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
            loan_portfolio_account_id,
            interest_income_account_id,
            fee_income_account_id,
            penalty_income_account_id,
            principal_payment_account_id,
            interest_payment_account_id,
            fee_payment_account_id,
            penalty_payment_account_id,
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

      const lines: Array<{
        account_id: string;
        description: string;
        debit_amount: number;
        credit_amount: number;
      }> = [];

      // Principal repayment
      if (data.principal_amount > 0) {
        if (!product.principal_payment_account_id || !product.loan_portfolio_account_id) {
          throw new Error('Principal payment accounts not configured');
        }

        lines.push({
          account_id: product.principal_payment_account_id,
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
        if (!product.interest_payment_account_id || !product.interest_income_account_id) {
          throw new Error('Interest payment accounts not configured');
        }

        lines.push({
          account_id: product.interest_payment_account_id,
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
        if (!product.fee_payment_account_id || !product.fee_income_account_id) {
          throw new Error('Fee payment accounts not configured');
        }

        lines.push({
          account_id: product.fee_payment_account_id,
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
        if (!product.penalty_payment_account_id || !product.penalty_income_account_id) {
          throw new Error('Penalty payment accounts not configured');
        }

        lines.push({
          account_id: product.penalty_payment_account_id,
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
        reference_type: 'loan_repayment',
        reference_id: data.loan_id,
        lines,
      });

      return { success: true };
    },
    onSuccess: () => {
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

      if (!receivableAccountId || !incomeAccountId) {
        throw new Error(`${data.charge_type} accounts not configured for this loan product`);
      }

      // Create charge journal entry
      await createJournalEntry.mutateAsync({
        transaction_date: data.charge_date,
        description: data.description,
        reference_type: 'loan_charge',
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