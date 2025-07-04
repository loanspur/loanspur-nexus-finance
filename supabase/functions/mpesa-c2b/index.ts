import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MPesaC2BRequest {
  phone_number: string;
  amount: number;
  account_reference: string;
  transaction_desc: string;
  tenant_id: string;
  client_id?: string;
  loan_id?: string;
  savings_account_id?: string;
}

interface MPesaCallbackRequest {
  Body: {
    stkCallback: {
      MerchantRequestID: string;
      CheckoutRequestID: string;
      ResultCode: number;
      ResultDesc: string;
      CallbackMetadata?: {
        Item: Array<{
          Name: string;
          Value: any;
        }>;
      };
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

// Initiate STK Push (Customer to Business - Incoming Payments)
async function initiateSTKPush(request: MPesaC2BRequest) {
  const { token, credentials } = await getMPesaToken(request.tenant_id);
  const baseUrl = credentials.environment === 'sandbox' 
    ? 'https://sandbox.safaricom.co.ke' 
    : 'https://api.safaricom.co.ke';

  const timestamp = new Date().toISOString().replace(/[T\-:\.Z]/g, '').slice(0, 14);
  const password = btoa(`${credentials.business_short_code}${credentials.passkey}${timestamp}`);

  const stkPushRequest = {
    BusinessShortCode: credentials.business_short_code,
    Password: password,
    Timestamp: timestamp,
    TransactionType: 'CustomerPayBillOnline',
    Amount: request.amount,
    PartyA: request.phone_number,
    PartyB: credentials.business_short_code,
    PhoneNumber: request.phone_number,
    CallBackURL: credentials.c2b_callback_url || `${Deno.env.get('SUPABASE_URL')}/functions/v1/mpesa-c2b/callback`,
    AccountReference: request.account_reference,
    TransactionDesc: request.transaction_desc
  };

  console.log('Initiating C2B STK Push:', stkPushRequest);

  const response = await fetch(`${baseUrl}/mpesa/stkpush/v1/processrequest`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(stkPushRequest),
  });

  const data = await response.json();
  console.log('C2B STK Push Response:', data);

  // Store the payment request in M-Pesa transactions table
  if (data.ResponseCode === '0') {
    await supabase.from('mpesa_transactions').insert({
      tenant_id: request.tenant_id,
      transaction_type: 'c2b',
      transaction_id: data.CheckoutRequestID,
      originator_conversation_id: data.MerchantRequestID,
      amount: request.amount,
      phone_number: request.phone_number,
      account_reference: request.account_reference,
      raw_callback_data: { request: stkPushRequest, response: data },
      reconciliation_status: 'unmatched'
    });

    // Also store in main transactions table for business logic
    await supabase.from('transactions').insert({
      tenant_id: request.tenant_id,
      client_id: request.client_id,
      loan_id: request.loan_id,
      savings_account_id: request.savings_account_id,
      transaction_id: data.CheckoutRequestID,
      external_transaction_id: data.MerchantRequestID,
      amount: request.amount,
      transaction_type: request.loan_id ? 'loan_repayment' : 'savings_deposit',
      payment_type: 'mpesa',
      payment_status: 'pending',
      description: request.transaction_desc,
      transaction_date: new Date().toISOString(),
    });
  }

  return data;
}

// Handle M-Pesa C2B callbacks
async function handleC2BCallback(callback: MPesaCallbackRequest) {
  console.log('Received M-Pesa C2B callback:', JSON.stringify(callback, null, 2));

  const stkCallback = callback.Body.stkCallback;
  const checkoutRequestID = stkCallback.CheckoutRequestID;
  const resultCode = stkCallback.ResultCode;

  let mpesaReceiptNumber = null;
  let actualAmount = null;
  let phoneNumber = null;

  if (resultCode === 0 && stkCallback.CallbackMetadata) {
    // Payment successful, extract details
    for (const item of stkCallback.CallbackMetadata.Item) {
      if (item.Name === 'MpesaReceiptNumber') {
        mpesaReceiptNumber = item.Value;
      }
      if (item.Name === 'Amount') {
        actualAmount = item.Value;
      }
      if (item.Name === 'PhoneNumber') {
        phoneNumber = item.Value;
      }
    }
  }

  // Update M-Pesa transaction
  const { error: mpesaUpdateError } = await supabase
    .from('mpesa_transactions')
    .update({
      mpesa_receipt_number: mpesaReceiptNumber,
      raw_callback_data: callback,
      reconciliation_status: resultCode === 0 ? 'matched' : 'unmatched'
    })
    .eq('transaction_id', checkoutRequestID);

  if (mpesaUpdateError) {
    console.error('Error updating M-Pesa transaction:', mpesaUpdateError);
  }

  // Update main transaction status
  const { data: transaction, error: fetchError } = await supabase
    .from('transactions')
    .select('*')
    .eq('transaction_id', checkoutRequestID)
    .single();

  if (fetchError) {
    console.error('Error fetching transaction:', fetchError);
    return;
  }

  const updateData: any = {
    payment_status: resultCode === 0 ? 'completed' : 'failed',
    mpesa_receipt_number: mpesaReceiptNumber,
    updated_at: new Date().toISOString(),
  };

  if (actualAmount && actualAmount !== transaction.amount) {
    updateData.amount = actualAmount;
  }

  const { error: updateError } = await supabase
    .from('transactions')
    .update(updateData)
    .eq('transaction_id', checkoutRequestID);

  if (updateError) {
    console.error('Error updating transaction:', updateError);
    return;
  }

  // If payment successful, update loan or savings account
  if (resultCode === 0 && transaction) {
    if (transaction.loan_id && transaction.transaction_type === 'loan_repayment') {
      // Update loan balance
      const { data: loan } = await supabase
        .from('loans')
        .select('outstanding_balance')
        .eq('id', transaction.loan_id)
        .single();

      if (loan) {
        const newBalance = Math.max(0, loan.outstanding_balance - actualAmount);
        await supabase
          .from('loans')
          .update({ 
            outstanding_balance: newBalance,
            updated_at: new Date().toISOString()
          })
          .eq('id', transaction.loan_id);
      }
    } else if (transaction.savings_account_id && transaction.transaction_type === 'savings_deposit') {
      // Update savings balance
      const { data: account } = await supabase
        .from('savings_accounts')
        .select('account_balance, available_balance')
        .eq('id', transaction.savings_account_id)
        .single();

      if (account) {
        const newBalance = account.account_balance + actualAmount;
        const newAvailable = account.available_balance + actualAmount;
        await supabase
          .from('savings_accounts')
          .update({ 
            account_balance: newBalance,
            available_balance: newAvailable,
            updated_at: new Date().toISOString()
          })
          .eq('id', transaction.savings_account_id);
      }
    }
  }

  console.log('C2B transaction processed successfully');
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname;

    if (path.endsWith('/callback')) {
      // Handle M-Pesa C2B callback
      const callback = await req.json();
      await handleC2BCallback(callback);
      return new Response(JSON.stringify({ ResultCode: 0, ResultDesc: "Success" }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Main endpoint for C2B payment requests
    if (req.method !== 'POST') {
      throw new Error('Method not allowed');
    }

    const body = await req.json();
    const result = await initiateSTKPush(body);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in M-Pesa C2B integration:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});