import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MPesaPaymentRequest {
  phone_number: string;
  amount: number;
  account_reference: string;
  transaction_desc: string;
  tenant_id: string;
  client_id?: string;
  loan_id?: string;
  savings_account_id?: string;
}

interface MPesaDisbursementRequest {
  phone_number: string;
  amount: number;
  account_reference: string;
  transaction_desc: string;
  tenant_id: string;
  loan_id: string;
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

// Get M-Pesa access token
async function getMPesaToken() {
  const consumerKey = Deno.env.get('MPESA_CONSUMER_KEY');
  const consumerSecret = Deno.env.get('MPESA_CONSUMER_SECRET');
  const isSandbox = Deno.env.get('MPESA_ENVIRONMENT') === 'sandbox';
  
  if (!consumerKey || !consumerSecret) {
    throw new Error('M-Pesa credentials not configured');
  }

  const auth = btoa(`${consumerKey}:${consumerSecret}`);
  const baseUrl = isSandbox 
    ? 'https://sandbox.safaricom.co.ke' 
    : 'https://api.safaricom.co.ke';

  const response = await fetch(`${baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
    method: 'GET',
    headers: {
      'Authorization': `Basic ${auth}`,
    },
  });

  const data = await response.json();
  return data.access_token;
}

// Initiate STK Push (Customer to Business)
async function initiateSTKPush(request: MPesaPaymentRequest) {
  const token = await getMPesaToken();
  const isSandbox = Deno.env.get('MPESA_ENVIRONMENT') === 'sandbox';
  const baseUrl = isSandbox 
    ? 'https://sandbox.safaricom.co.ke' 
    : 'https://api.safaricom.co.ke';

  const shortCode = Deno.env.get('MPESA_SHORTCODE') || '174379';
  const passkey = Deno.env.get('MPESA_PASSKEY') || 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919';
  const callbackUrl = Deno.env.get('MPESA_CALLBACK_URL') || `${Deno.env.get('SUPABASE_URL')}/functions/v1/mpesa-integration`;

  const timestamp = new Date().toISOString().replace(/[T\-:\.Z]/g, '').slice(0, 14);
  const password = btoa(`${shortCode}${passkey}${timestamp}`);

  const stkPushRequest = {
    BusinessShortCode: shortCode,
    Password: password,
    Timestamp: timestamp,
    TransactionType: 'CustomerPayBillOnline',
    Amount: request.amount,
    PartyA: request.phone_number,
    PartyB: shortCode,
    PhoneNumber: request.phone_number,
    CallBackURL: `${callbackUrl}/callback`,
    AccountReference: request.account_reference,
    TransactionDesc: request.transaction_desc
  };

  console.log('Initiating STK Push:', stkPushRequest);

  const response = await fetch(`${baseUrl}/mpesa/stkpush/v1/processrequest`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(stkPushRequest),
  });

  const data = await response.json();
  console.log('STK Push Response:', data);

  // Store the payment request in database
  if (data.ResponseCode === '0') {
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

// Business to Customer (Loan Disbursement)
async function initiateB2C(request: MPesaDisbursementRequest) {
  const token = await getMPesaToken();
  const isSandbox = Deno.env.get('MPESA_ENVIRONMENT') === 'sandbox';
  const baseUrl = isSandbox 
    ? 'https://sandbox.safaricom.co.ke' 
    : 'https://api.safaricom.co.ke';

  const shortCode = Deno.env.get('MPESA_SHORTCODE') || '600000';
  const securityCredential = Deno.env.get('MPESA_SECURITY_CREDENTIAL') || '';
  const queueTimeoutUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/mpesa-integration/timeout`;
  const resultUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/mpesa-integration/result`;

  const b2cRequest = {
    InitiatorName: Deno.env.get('MPESA_INITIATOR_NAME') || 'testapi',
    SecurityCredential: securityCredential,
    CommandID: 'BusinessPayment',
    Amount: request.amount,
    PartyA: shortCode,
    PartyB: request.phone_number,
    Remarks: request.transaction_desc,
    QueueTimeOutURL: queueTimeoutUrl,
    ResultURL: resultUrl,
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

  // Store the disbursement request in database
  if (data.ResponseCode === '0') {
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

// Handle M-Pesa callbacks
async function handleCallback(callback: MPesaCallbackRequest) {
  console.log('Received M-Pesa callback:', JSON.stringify(callback, null, 2));

  const stkCallback = callback.Body.stkCallback;
  const checkoutRequestID = stkCallback.CheckoutRequestID;
  const resultCode = stkCallback.ResultCode;

  let mpesaReceiptNumber = null;
  let actualAmount = null;

  if (resultCode === 0 && stkCallback.CallbackMetadata) {
    // Payment successful, extract details
    for (const item of stkCallback.CallbackMetadata.Item) {
      if (item.Name === 'MpesaReceiptNumber') {
        mpesaReceiptNumber = item.Value;
      }
      if (item.Name === 'Amount') {
        actualAmount = item.Value;
      }
    }
  }

  // Update transaction status in database
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

  console.log('Transaction updated successfully');
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
      // Handle M-Pesa callback
      const callback = await req.json();
      await handleCallback(callback);
      return new Response(JSON.stringify({ ResultCode: 0, ResultDesc: "Success" }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (path.endsWith('/timeout') || path.endsWith('/result')) {
      // Handle M-Pesa timeout and result callbacks
      const data = await req.json();
      console.log(`Received ${path}:`, JSON.stringify(data, null, 2));
      return new Response(JSON.stringify({ ResultCode: 0, ResultDesc: "Success" }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Main endpoint for payment requests
    if (req.method !== 'POST') {
      throw new Error('Method not allowed');
    }

    const body = await req.json();
    const { action } = body;

    let result;
    switch (action) {
      case 'stk_push':
        result = await initiateSTKPush(body);
        break;
      case 'b2c_disbursement':
        result = await initiateB2C(body);
        break;
      default:
        throw new Error('Invalid action');
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in M-Pesa integration:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});