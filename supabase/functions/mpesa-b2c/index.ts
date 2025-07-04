import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MPesaB2CRequest {
  phone_number: string;
  amount: number;
  account_reference: string;
  transaction_desc: string;
  tenant_id: string;
  loan_id: string;
}

interface MPesaB2CResult {
  Result: {
    ResultType: number;
    ResultCode: number;
    ResultDesc: string;
    OriginatorConversationID: string;
    ConversationID: string;
    TransactionID: string;
    ResultParameters?: {
      ResultParameter: Array<{
        Key: string;
        Value: any;
      }>;
    };
  };
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

// Get M-Pesa access token using tenant credentials
async function getMPesaToken(tenantId: string) {
  // Get tenant-specific M-Pesa credentials
  const { data: credentials, error } = await supabase
    .from('mpesa_credentials')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('is_active', true)
    .single();

  if (error || !credentials) {
    throw new Error('M-Pesa credentials not found for tenant');
  }

  const auth = btoa(`${credentials.consumer_key}:${credentials.consumer_secret}`);
  const baseUrl = credentials.environment === 'sandbox' 
    ? 'https://sandbox.safaricom.co.ke' 
    : 'https://api.safaricom.co.ke';

  const response = await fetch(`${baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
    method: 'GET',
    headers: {
      'Authorization': `Basic ${auth}`,
    },
  });

  const data = await response.json();
  return { token: data.access_token, credentials };
}

// Initiate B2C (Business to Customer - Outgoing Payments/Disbursements)
async function initiateB2C(request: MPesaB2CRequest) {
  const { token, credentials } = await getMPesaToken(request.tenant_id);
  const baseUrl = credentials.environment === 'sandbox' 
    ? 'https://sandbox.safaricom.co.ke' 
    : 'https://api.safaricom.co.ke';

  const b2cRequest = {
    InitiatorName: credentials.initiator_name || 'testapi',
    SecurityCredential: credentials.security_credential || '',
    CommandID: 'BusinessPayment',
    Amount: request.amount,
    PartyA: credentials.business_short_code,
    PartyB: request.phone_number,
    Remarks: request.transaction_desc,
    QueueTimeOutURL: credentials.transaction_status_callback_url || `${Deno.env.get('SUPABASE_URL')}/functions/v1/mpesa-b2c/timeout`,
    ResultURL: credentials.b2c_callback_url || `${Deno.env.get('SUPABASE_URL')}/functions/v1/mpesa-b2c/result`,
    Occasion: request.account_reference
  };

  console.log('Initiating B2C:', b2cRequest);

  const response = await fetch(`${baseUrl}/mpesa/b2c/v1/paymentrequest`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(b2cRequest),
  });

  const data = await response.json();
  console.log('B2C Response:', data);

  // Store the disbursement request in M-Pesa transactions table
  if (data.ResponseCode === '0') {
    await supabase.from('mpesa_transactions').insert({
      tenant_id: request.tenant_id,
      transaction_type: 'b2c',
      conversation_id: data.ConversationID,
      originator_conversation_id: data.OriginatorConversationID,
      amount: request.amount,
      phone_number: request.phone_number,
      account_reference: request.account_reference,
      raw_callback_data: { request: b2cRequest, response: data },
      reconciliation_status: 'unmatched'
    });

    // Also store in main transactions table for business logic
    await supabase.from('transactions').insert({
      tenant_id: request.tenant_id,
      loan_id: request.loan_id,
      transaction_id: data.ConversationID,
      external_transaction_id: data.OriginatorConversationID,
      amount: request.amount,
      transaction_type: 'loan_disbursement',
      payment_type: 'mpesa',
      payment_status: 'pending',
      description: request.transaction_desc,
      transaction_date: new Date().toISOString(),
    });
  }

  return data;
}

// Handle M-Pesa B2C result callbacks
async function handleB2CResult(result: MPesaB2CResult) {
  console.log('Received M-Pesa B2C result:', JSON.stringify(result, null, 2));

  const resultData = result.Result;
  const conversationID = resultData.ConversationID;
  const resultCode = resultData.ResultCode;

  let transactionID = null;
  let recipientRegistered = null;
  let chargesPaidAccount = null;
  let receiverPartyPublicName = null;
  let transactionAmount = null;

  if (resultCode === 0 && resultData.ResultParameters) {
    // Payment successful, extract details
    for (const param of resultData.ResultParameters.ResultParameter) {
      switch (param.Key) {
        case 'TransactionReceipt':
          transactionID = param.Value;
          break;
        case 'ReceiverPartyPublicName':
          receiverPartyPublicName = param.Value;
          break;
        case 'TransactionAmount':
          transactionAmount = param.Value;
          break;
        case 'ChargesPaidAccountBalance':
          chargesPaidAccount = param.Value;
          break;
        case 'RecipientIsRegisteredCustomer':
          recipientRegistered = param.Value;
          break;
      }
    }
  }

  // Update M-Pesa transaction
  const { error: mpesaUpdateError } = await supabase
    .from('mpesa_transactions')
    .update({
      mpesa_receipt_number: transactionID,
      raw_callback_data: result,
      reconciliation_status: resultCode === 0 ? 'matched' : 'unmatched'
    })
    .eq('conversation_id', conversationID);

  if (mpesaUpdateError) {
    console.error('Error updating M-Pesa transaction:', mpesaUpdateError);
  }

  // Update main transaction status
  const { data: transaction, error: fetchError } = await supabase
    .from('transactions')
    .select('*')
    .eq('transaction_id', conversationID)
    .single();

  if (fetchError) {
    console.error('Error fetching transaction:', fetchError);
    return;
  }

  const updateData: any = {
    payment_status: resultCode === 0 ? 'completed' : 'failed',
    mpesa_receipt_number: transactionID,
    updated_at: new Date().toISOString(),
  };

  if (transactionAmount && transactionAmount !== transaction.amount) {
    updateData.amount = transactionAmount;
  }

  const { error: updateError } = await supabase
    .from('transactions')
    .update(updateData)
    .eq('transaction_id', conversationID);

  if (updateError) {
    console.error('Error updating transaction:', updateError);
    return;
  }

  // If disbursement successful, update loan status
  if (resultCode === 0 && transaction && transaction.loan_id) {
    await supabase
      .from('loans')
      .update({ 
        loan_status: 'active',
        disbursed_amount: transactionAmount || transaction.amount,
        disbursement_date: new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString()
      })
      .eq('id', transaction.loan_id);
  }

  console.log('B2C transaction processed successfully');
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname;

    if (path.endsWith('/result')) {
      // Handle M-Pesa B2C result callback
      const result = await req.json();
      await handleB2CResult(result);
      return new Response(JSON.stringify({ ResultCode: 0, ResultDesc: "Success" }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (path.endsWith('/timeout')) {
      // Handle M-Pesa B2C timeout callback
      const data = await req.json();
      console.log('Received B2C timeout:', JSON.stringify(data, null, 2));
      return new Response(JSON.stringify({ ResultCode: 0, ResultDesc: "Success" }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Main endpoint for B2C disbursement requests
    if (req.method !== 'POST') {
      throw new Error('Method not allowed');
    }

    const body = await req.json();
    const result = await initiateB2C(body);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in M-Pesa B2C integration:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});