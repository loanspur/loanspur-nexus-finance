import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MPESACallbackData {
  Body: {
    stkCallback?: {
      MerchantRequestID: string;
      CheckoutRequestID: string;
      ResultCode: number;
      ResultDesc: string;
      CallbackMetadata?: {
        Item: Array<{
          Name: string;
          Value: string | number;
        }>;
      };
    };
    CallbackMetadata?: {
      Item: Array<{
        Name: string;
        Value: string | number;
      }>;
    };
  };
}

interface C2BCallbackData {
  TransactionType: string;
  TransID: string;
  TransTime: string;
  TransAmount: number;
  BusinessShortCode: string;
  BillRefNumber: string;
  InvoiceNumber: string;
  OrgAccountBalance: number;
  ThirdPartyTransID: string;
  MSISDN: string;
  FirstName: string;
  MiddleName: string;
  LastName: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { 
      status: 405, 
      headers: corsHeaders 
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const requestData = await req.json();
    console.log('MPESA Callback received:', JSON.stringify(requestData, null, 2));

    // Determine callback type based on the structure
    let transactionData: any = {};
    let callbackType = 'unknown';

    // Handle STK Push callback
    if (requestData.Body?.stkCallback) {
      callbackType = 'stk_push';
      const callback = requestData.Body.stkCallback;
      
      if (callback.ResultCode === 0 && callback.CallbackMetadata) {
        // Extract transaction details from CallbackMetadata
        const metadata = callback.CallbackMetadata.Item;
        const getMetadataValue = (name: string) => 
          metadata.find(item => item.Name === name)?.Value;

        transactionData = {
          mpesa_receipt_number: getMetadataValue('MpesaReceiptNumber') as string,
          transaction_type: 'c2b',
          amount: getMetadataValue('Amount') as number,
          phone_number: getMetadataValue('PhoneNumber') as string,
          transaction_date: new Date().toISOString(),
          raw_callback_data: requestData
        };
      }
    }
    // Handle C2B (PayBill/Till) callback
    else if (requestData.TransactionType) {
      callbackType = 'c2b_paybill';
      const data = requestData as C2BCallbackData;
      
      transactionData = {
        mpesa_receipt_number: data.TransID,
        transaction_type: data.TransactionType.toLowerCase().includes('paybill') ? 'paybill' : 'till',
        amount: data.TransAmount,
        phone_number: data.MSISDN,
        first_name: data.FirstName,
        last_name: data.LastName,
        middle_name: data.MiddleName,
        transaction_date: new Date(data.TransTime).toISOString(),
        account_reference: data.BillRefNumber,
        bill_ref_number: data.BillRefNumber,
        org_account_balance: data.OrgAccountBalance,
        third_party_trans_id: data.ThirdPartyTransID,
        msisdn: data.MSISDN,
        raw_callback_data: requestData
      };
    }

    // If we have valid transaction data, store it
    if (transactionData.mpesa_receipt_number) {
      // Try to determine tenant_id from account reference or business logic
      let tenantId = null;
      
      // You can implement logic here to map account references to tenants
      // For now, we'll try to find a tenant or use a default approach
      const { data: tenants } = await supabase
        .from('tenants')
        .select('id')
        .limit(1);
      
      if (tenants && tenants.length > 0) {
        tenantId = tenants[0].id;
      }

      if (tenantId) {
        // Insert MPESA transaction
        const { data: mpesaTransaction, error: mpesaError } = await supabase
          .from('mpesa_transactions')
          .insert({
            tenant_id: tenantId,
            ...transactionData
          })
          .select()
          .single();

        if (mpesaError) {
          console.error('Error inserting MPESA transaction:', mpesaError);
          throw mpesaError;
        }

        console.log('MPESA transaction saved:', mpesaTransaction.id);

        // Try to auto-match with existing transactions
        await attemptAutoReconciliation(supabase, mpesaTransaction);

        // If no match found, create suspense entry
        if (mpesaTransaction.reconciliation_status === 'unmatched') {
          await createSuspenseEntry(supabase, mpesaTransaction, tenantId);
        }
      }
    }

    // Respond with success to MPESA
    return new Response(JSON.stringify({ 
      ResultCode: 0,
      ResultDesc: "Accepted"
    }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });

  } catch (error) {
    console.error('MPESA callback processing error:', error);
    
    return new Response(JSON.stringify({ 
      ResultCode: 1,
      ResultDesc: "Failed to process callback"
    }), {
      status: 200, // Still return 200 to MPESA to avoid retries
      headers: { 
        'Content-Type': 'application/json',
        ...corsHeaders
      }
    });
  }
});

async function attemptAutoReconciliation(supabase: any, mpesaTransaction: any) {
  try {
    // Look for matching system transactions within a reasonable time window
    const transactionDate = new Date(mpesaTransaction.transaction_date);
    const startDate = new Date(transactionDate.getTime() - (24 * 60 * 60 * 1000)); // 1 day before
    const endDate = new Date(transactionDate.getTime() + (24 * 60 * 60 * 1000)); // 1 day after

    const { data: systemTransactions, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('tenant_id', mpesaTransaction.tenant_id)
      .eq('payment_type', 'mpesa')
      .eq('amount', mpesaTransaction.amount)
      .gte('transaction_date', startDate.toISOString())
      .lte('transaction_date', endDate.toISOString())
      .is('mpesa_receipt_number', null); // Not already matched

    if (systemTransactions && systemTransactions.length === 1) {
      // Found exact match - auto-reconcile
      const systemTransaction = systemTransactions[0];
      
      // Update system transaction with MPESA receipt
      await supabase
        .from('transactions')
        .update({ 
          mpesa_receipt_number: mpesaTransaction.mpesa_receipt_number,
          payment_status: 'completed'
        })
        .eq('id', systemTransaction.id);

      // Update MPESA transaction status
      await supabase
        .from('mpesa_transactions')
        .update({ 
          reconciliation_status: 'matched',
          matched_transaction_id: systemTransaction.id
        })
        .eq('id', mpesaTransaction.id);

      console.log(`Auto-matched MPESA transaction ${mpesaTransaction.mpesa_receipt_number} with system transaction ${systemTransaction.id}`);
    }
  } catch (error) {
    console.error('Error in auto-reconciliation:', error);
  }
}

async function createSuspenseEntry(supabase: any, mpesaTransaction: any, tenantId: string) {
  try {
    // Find or create MPESA suspense account
    let { data: suspenseAccount, error } = await supabase
      .from('suspense_accounts')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('account_type', 'mpesa_suspense')
      .eq('is_active', true)
      .single();

    if (!suspenseAccount) {
      // Create MPESA suspense account
      const { data: newAccount, error: createError } = await supabase
        .from('suspense_accounts')
        .insert({
          tenant_id: tenantId,
          account_name: 'MPESA Suspense Account',
          account_type: 'mpesa_suspense',
          description: 'Unmatched MPESA transactions',
          current_balance: 0
        })
        .select()
        .single();

      if (createError) throw createError;
      suspenseAccount = newAccount;
    }

    // Create suspense entry
    await supabase
      .from('suspense_entries')
      .insert({
        suspense_account_id: suspenseAccount.id,
        reference_transaction_id: mpesaTransaction.id,
        reference_type: 'mpesa_transaction',
        amount: mpesaTransaction.amount,
        transaction_type: 'credit',
        description: `Unmatched MPESA payment - ${mpesaTransaction.mpesa_receipt_number}`,
        entry_date: new Date(mpesaTransaction.transaction_date).toISOString().split('T')[0]
      });

    // Update suspense account balance
    await supabase
      .from('suspense_accounts')
      .update({ 
        current_balance: suspenseAccount.current_balance + mpesaTransaction.amount
      })
      .eq('id', suspenseAccount.id);

    console.log(`Created suspense entry for unmatched MPESA transaction ${mpesaTransaction.mpesa_receipt_number}`);
  } catch (error) {
    console.error('Error creating suspense entry:', error);
  }
}