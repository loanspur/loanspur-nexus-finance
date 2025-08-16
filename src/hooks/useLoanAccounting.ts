import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { useCreateJournalEntry } from './useAccounting';

// Types for loan accounting transactions
export interface LoanDisbursementData {
  loan_id: string;
  client_id: string;
  loan_product_id: string;
  principal_amount: number;
  disbursement_date: string;
  loan_number: string;
  payment_method?: string; // code like 'cash', 'bank_transfer', 'mpesa'
}

export interface LoanRepaymentData {
  loan_id: string;
  payment_amount: number;
  principal_amount: number;
  interest_amount: number;
  fee_amount?: number;
  penalty_amount?: number;
  payment_date: string;
  payment_reference?: string;
  payment_method?: string; // code like 'cash', 'bank_transfer', 'mpesa'
}


export interface LoanChargeData {
  loan_id: string;
  charge_type: 'fee' | 'penalty' | 'interest';
  amount: number;
  charge_date: string;
  description: string;
  fee_structure_id?: string; // optional: specific fee mapping
}

// Hook for loan disbursement accounting
export const useLoanDisbursementAccounting = () => {
  const { profile } = useAuth();
  const createJournalEntry = useCreateJournalEntry();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: LoanDisbursementData) => {
      if (!profile?.tenant_id) {
        throw new Error('No tenant context');
      }

      // Get loan product accounting setup
      const { data: product, error: productError } = await supabase
        .from('loan_products')
        .select(`
          loan_portfolio_account_id,
          fund_source_account_id,
          accounting_type
        `)
        .eq('id', data.loan_product_id)
        .single();

      if (productError) throw productError;

      if (!product.loan_portfolio_account_id) {
        throw new Error('Loan product accounting accounts not configured');
      }

      if (product.accounting_type === 'none') {
        throw new Error('Accounting is disabled for this loan product');
      }

      // Resolve asset account via advanced mapping (fallback to default fund_source_account_id)
      let assetAccountId = product.fund_source_account_id as string | null;
      try {
        const { resolveFundSourceAccount } = await import('./useFundSourceResolver');
        const resolved = await resolveFundSourceAccount({
          productId: data.loan_product_id,
          productType: 'loan',
          paymentMethodCode: data.payment_method || null,
        });
        if (resolved) assetAccountId = resolved;
      } catch (e) {
        console.warn('Fund source resolver failed, using default', e);
      }

      if (!assetAccountId) {
        throw new Error('No fund source asset account configured for this payment method');
      }

      // Create disbursement journal entry
      await createJournalEntry.mutateAsync({
        transaction_date: data.disbursement_date,
        description: `Loan disbursement - ${data.loan_number}`,
        reference_type: 'loan_disbursement',
        reference_id: data.loan_id,
        lines: [
          {
            account_id: product.loan_portfolio_account_id,
            description: `Loan disbursement - ${data.loan_number}`,
            debit_amount: data.principal_amount,
            credit_amount: 0,
          },
          {
            account_id: assetAccountId,
            description: `Loan disbursement - ${data.loan_number}`,
            debit_amount: 0,
            credit_amount: data.principal_amount,
          },
        ],
      });

      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: "Disbursement Recorded",
        description: "Loan disbursement has been recorded in the accounting system.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Accounting Error",
        description: error.message || "Failed to record loan disbursement.",
        variant: "destructive",
      });
    },
  });
};

// Hook for loan repayment accounting
export const useLoanRepaymentAccounting = () => {
  const { profile } = useAuth();
  const createJournalEntry = useCreateJournalEntry();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: LoanRepaymentData) => {
      if (!profile?.tenant_id) {
        throw new Error('No tenant context');
      }

      // Get loan and product information
      const { data: loan, error: loanError } = await supabase
        .from('loans')
        .select(`
          loan_number,
          loan_products (
            id,
            loan_portfolio_account_id,
            interest_income_account_id,
            fee_income_account_id,
            penalty_income_account_id,
            fund_source_account_id,
            accounting_type
          )
        `)
        .eq('id', data.loan_id)
        .single();

      if (loanError) throw loanError;

      const product = loan.loan_products;
      if (!product || product.accounting_type === 'none') {
        throw new Error('Accounting is disabled for this loan product');
      }

      // Get payment account from payment channel mapping if payment method is provided
      let paymentAccount = product.fund_source_account_id; // fallback to fund source account
      
      if (data.payment_method) {
        const { data: mappings, error: mappingError } = await supabase
          .from('product_fund_source_mappings')
          .select('account_id')
          .eq('tenant_id', profile.tenant_id)
          .eq('product_id', product.id)
          .eq('product_type', 'loan')
          .eq('channel_id', data.payment_method)
          .maybeSingle();

        if (!mappingError && mappings?.account_id) {
          paymentAccount = mappings.account_id;
        }
      }

      if (!paymentAccount) {
        throw new Error('Payment account not configured for this payment method');
      }

      const lines: Array<{
        account_id: string;
        description: string;
        debit_amount: number;
        credit_amount: number;
      }> = [];

      // Principal repayment
      if (data.principal_amount > 0) {
        if (!product.loan_portfolio_account_id) {
          throw new Error('Loan portfolio account not configured');
        }

        lines.push({
          account_id: paymentAccount,
          description: `Principal repayment - ${loan.loan_number}`,
          debit_amount: data.principal_amount,
          credit_amount: 0,
        });

        lines.push({
          account_id: product.loan_portfolio_account_id,
          description: `Principal repayment - ${loan.loan_number}`,
          debit_amount: 0,
          credit_amount: data.principal_amount,
        });
      }

      // Interest repayment
      if (data.interest_amount > 0) {
        if (!product.interest_income_account_id) {
          throw new Error('Interest income account not configured');
        }

        lines.push({
          account_id: paymentAccount,
          description: `Interest repayment - ${loan.loan_number}`,
          debit_amount: data.interest_amount,
          credit_amount: 0,
        });

        lines.push({
          account_id: product.interest_income_account_id,
          description: `Interest repayment - ${loan.loan_number}`,
          debit_amount: 0,
          credit_amount: data.interest_amount,
        });
      }

      // Fee repayment
      if (data.fee_amount && data.fee_amount > 0) {
        if (!product.fee_income_account_id) {
          throw new Error('Fee income account not configured');
        }

        lines.push({
          account_id: paymentAccount,
          description: `Fee repayment - ${loan.loan_number}`,
          debit_amount: data.fee_amount,
          credit_amount: 0,
        });

        lines.push({
          account_id: product.fee_income_account_id,
          description: `Fee repayment - ${loan.loan_number}`,
          debit_amount: 0,
          credit_amount: data.fee_amount,
        });
      }

      // Penalty repayment
      if (data.penalty_amount && data.penalty_amount > 0) {
        if (!product.penalty_income_account_id) {
          throw new Error('Penalty income account not configured');
        }

        lines.push({
          account_id: paymentAccount,
          description: `Penalty repayment - ${loan.loan_number}`,
          debit_amount: data.penalty_amount,
          credit_amount: 0,
        });

        lines.push({
          account_id: product.penalty_income_account_id,
          description: `Penalty repayment - ${loan.loan_number}`,
          debit_amount: 0,
          credit_amount: data.penalty_amount,
        });
      }

      if (lines.length === 0) {
        throw new Error('No accounting entries to create');
      }

      // Create repayment journal entry
      await createJournalEntry.mutateAsync({
        transaction_date: data.payment_date,
        description: `Loan repayment - ${loan.loan_number}`,
        reference_type: 'loan_payment',
        reference_id: data.loan_id,
        lines,
      });

      // Create transaction record for the payment  
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          tenant_id: profile.tenant_id,
          loan_id: data.loan_id,
          amount: data.payment_amount,
          transaction_type: 'loan_repayment',
          payment_type: (data.payment_method || 'cash') as any,
          payment_status: 'completed',
          transaction_date: new Date(data.payment_date).toISOString(),
          transaction_id: `LR-${Date.now()}`,
          external_transaction_id: data.payment_reference,
          description: `Loan repayment - ${loan.loan_number}`,
          processed_by: profile.id,
          reconciliation_status: 'reconciled'
        });

      if (transactionError) {
        console.error('Failed to create transaction record:', transactionError);
        // Don't throw error as accounting entry was successful
      }

      // Create loan payment record
      const { error: paymentError } = await supabase
        .from('loan_payments')
        .insert({
          tenant_id: profile.tenant_id,
          loan_id: data.loan_id,
          payment_amount: data.payment_amount,
          principal_amount: data.principal_amount,
          interest_amount: data.interest_amount,
          fee_amount: data.fee_amount || 0,
          payment_date: data.payment_date,
          payment_method: data.payment_method || 'cash',
          reference_number: data.payment_reference,
          processed_by: profile.id
        });

      if (paymentError) {
        console.error('Failed to create loan payment record:', paymentError);
        // Don't throw error as accounting entry was successful
      }

      return { success: true };
    },
    onSuccess: (_, variables) => {
      // Invalidate relevant queries to trigger real-time updates
      const queryClient = useQueryClient();
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['loan-payments'] });
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      queryClient.invalidateQueries({ queryKey: ['all-loans'] });
      queryClient.invalidateQueries({ queryKey: ['client-loans'] });
      
      toast({
        title: "Repayment Recorded",
        description: "Loan repayment has been recorded in the accounting system.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Accounting Error",
        description: error.message || "Failed to record loan repayment.",
        variant: "destructive",
      });
    },
  });
};

// Hook for loan charge accounting
export const useLoanChargeAccounting = () => {
  const { profile } = useAuth();
  const createJournalEntry = useCreateJournalEntry();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: LoanChargeData) => {
      if (!profile?.tenant_id) {
        throw new Error('No tenant context');
      }

      // Get loan and product information
      const { data: loan, error: loanError } = await supabase
        .from('loans')
        .select(`
          loan_number,
          loan_products (
            loan_portfolio_account_id,
            interest_receivable_account_id,
            interest_income_account_id,
            fee_income_account_id,
            penalty_income_account_id,
            accounting_type,
            fee_mappings
          )
        `)
        .eq('id', data.loan_id)
        .single();

      if (loanError) throw loanError;

      const product = loan.loan_products;
      if (!product || product.accounting_type === 'none') {
        throw new Error('Accounting is disabled for this loan product');
      }

      let receivableAccountId: string;
      let incomeAccountId: string;

      switch (data.charge_type) {
        case 'interest':
          receivableAccountId = product.interest_receivable_account_id;
          incomeAccountId = product.interest_income_account_id;
          break;
        case 'fee':
          receivableAccountId = product.loan_portfolio_account_id; // Fees typically added to loan balance
          incomeAccountId = product.fee_income_account_id;
          break;
        case 'penalty':
          receivableAccountId = product.loan_portfolio_account_id; // Penalties typically added to loan balance
          incomeAccountId = product.penalty_income_account_id;
          break;
        default:
          throw new Error('Invalid charge type');
      }

      // Override income account if a specific fee mapping exists
      const feeMaps = (product as any).fee_mappings as any[] | undefined;
      if (data.charge_type === 'fee' && data.fee_structure_id && Array.isArray(feeMaps)) {
        const mm = feeMaps.find((m: any) => m.fee_id === data.fee_structure_id || m.feeType === data.fee_structure_id);
        if (mm?.income_account_id) {
          incomeAccountId = mm.income_account_id;
        }
      }

      if (!receivableAccountId || !incomeAccountId) {
        throw new Error(`${data.charge_type} accounts not configured for this loan product`);
      }

      // Create charge journal entry
      await createJournalEntry.mutateAsync({
        transaction_date: data.charge_date,
        description: data.description,
        reference_type: 'fee_collection',
        reference_id: data.loan_id,
        lines: [
          {
            account_id: receivableAccountId,
            description: data.description,
            debit_amount: data.amount,
            credit_amount: 0,
          },
          {
            account_id: incomeAccountId,
            description: data.description,
            debit_amount: 0,
            credit_amount: data.amount,
          },
        ],
      });

      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: "Charge Recorded",
        description: "Loan charge has been recorded in the accounting system.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Accounting Error",
        description: error.message || "Failed to record loan charge.",
        variant: "destructive",
      });
    },
  });
};