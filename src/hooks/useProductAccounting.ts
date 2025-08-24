import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { useCreateJournalEntry } from './useAccounting';

// Types for product accounting integration
export interface ProductAccountingSetup {
  product_id: string;
  product_type: 'loan' | 'savings' | 'fee';
  product_name: string;
  accounting_accounts: {
    loan_portfolio_account_id?: string;
    interest_receivable_account_id?: string;
    interest_income_account_id?: string;
    fee_income_account_id?: string;
    penalty_income_account_id?: string;
    provision_account_id?: string;
    writeoff_expense_account_id?: string;
    overpayment_liability_account_id?: string;
    suspended_income_account_id?: string;
    fund_source_account_id?: string;
    principal_payment_account_id?: string;
    interest_payment_account_id?: string;
    fee_payment_account_id?: string;
    penalty_payment_account_id?: string;
  };
  is_accounting_enabled: boolean;
  has_complete_setup: boolean;
}

export interface ProductTransaction {
  product_id: string;
  product_type: 'loan' | 'savings' | 'fee';
  transaction_type: 'disbursement' | 'repayment' | 'fee_charge' | 'interest_accrual' | 'penalty' | 'deposit' | 'withdrawal';
  amount: number;
  description: string;
  reference_id?: string;
  client_id?: string;
  auto_post?: boolean;
}

// Hook to get product accounting setup status
export const useProductAccountingSetup = () => {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['product-accounting-setup', profile?.tenant_id],
    queryFn: async () => {
      if (!profile?.tenant_id) return [];

      // Get loan products with accounting setup
      const { data: loanProducts, error: loanError } = await supabase
        .from('loan_products')
        .select(`
          id,
          name,
          accounting_type,
          loan_portfolio_account_id,
          interest_receivable_account_id,
          interest_income_account_id,
          fee_income_account_id,
          penalty_income_account_id,
          provision_account_id,
          writeoff_expense_account_id,
          overpayment_liability_account_id,
          suspended_income_account_id,
          fund_source_account_id,
          principal_payment_account_id,
          interest_payment_account_id,
          fee_payment_account_id,
          penalty_payment_account_id
        `)
        .eq('tenant_id', profile.tenant_id)
        .eq('is_active', true);

      if (loanError) throw loanError;

      // Get savings products (when implemented)
      const { data: savingsProducts, error: savingsError } = await supabase
        .from('savings_products')
        .select('id, name')
        .eq('tenant_id', profile.tenant_id)
        .eq('is_active', true);

      if (savingsError) throw savingsError;

      // Get fee structures
      const { data: feeStructures, error: feeError } = await supabase
        .from('fee_structures')
        .select('id, name')
        .eq('tenant_id', profile.tenant_id)
        .eq('is_active', true);

      if (feeError) throw feeError;

      const setupData: ProductAccountingSetup[] = [];

      // Process loan products
      loanProducts?.forEach(product => {
        const accountingAccounts = {
          loan_portfolio_account_id: product.loan_portfolio_account_id,
          interest_receivable_account_id: product.interest_receivable_account_id,
          interest_income_account_id: product.interest_income_account_id,
          fee_income_account_id: product.fee_income_account_id,
          penalty_income_account_id: product.penalty_income_account_id,
          provision_account_id: product.provision_account_id,
          writeoff_expense_account_id: product.writeoff_expense_account_id,
          overpayment_liability_account_id: product.overpayment_liability_account_id,
          suspended_income_account_id: product.suspended_income_account_id,
          fund_source_account_id: product.fund_source_account_id,
          principal_payment_account_id: product.principal_payment_account_id,
          interest_payment_account_id: product.interest_payment_account_id,
          fee_payment_account_id: product.fee_payment_account_id,
          penalty_payment_account_id: product.penalty_payment_account_id,
        };

        const requiredAccounts = [
          'loan_portfolio_account_id',
          'interest_income_account_id',
          'fund_source_account_id'
        ];

        const hasCompleteSetup = requiredAccounts.every(
          account => accountingAccounts[account as keyof typeof accountingAccounts]
        );

        setupData.push({
          product_id: product.id,
          product_type: 'loan',
          product_name: product.name,
          accounting_accounts: accountingAccounts,
          is_accounting_enabled: product.accounting_type !== 'none',
          has_complete_setup: hasCompleteSetup,
        });
      });

      // Process savings products
      savingsProducts?.forEach(product => {
        setupData.push({
          product_id: product.id,
          product_type: 'savings',
          product_name: product.name,
          accounting_accounts: {},
          is_accounting_enabled: false, // Will be updated when savings accounting is implemented
          has_complete_setup: false,
        });
      });

      // Process fee structures
      feeStructures?.forEach(product => {
        setupData.push({
          product_id: product.id,
          product_type: 'fee',
          product_name: product.name,
          accounting_accounts: {},
          is_accounting_enabled: false, // Will be updated when fee accounting is implemented
          has_complete_setup: false,
        });
      });

      return setupData;
    },
    enabled: !!profile?.tenant_id,
  });
};

// Hook to create product-related journal entries
export const useCreateProductJournalEntry = () => {
  const createJournalEntry = useCreateJournalEntry();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (transaction: ProductTransaction) => {
      // Get product accounting setup
      const { data: product } = await supabase
        .from(transaction.product_type === 'loan' ? 'loan_products' : 'savings_products')
        .select('*')
        .eq('id', transaction.product_id)
        .single();

      if (!product) {
        throw new Error('Product not found');
      }

      // Generate journal entry lines based on transaction type
      const lines = generateJournalEntryLines(transaction, product);

      if (lines.length === 0) {
        throw new Error('No journal entry lines generated');
      }

      // Create the journal entry
      return createJournalEntry.mutateAsync({
        transaction_date: new Date().toISOString().split('T')[0],
        description: transaction.description,
        reference_type: 'manual',
        reference_id: transaction.reference_id,
        lines,
      });
    },
    onSuccess: () => {
      toast({
        title: "Journal Entry Created",
        description: "Product transaction has been recorded in the accounting system.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Accounting Error",
        description: error.message || "Failed to create accounting entry for product transaction.",
        variant: "destructive",
      });
    },
  });
};

// Generate journal entry lines based on transaction type
function generateJournalEntryLines(transaction: ProductTransaction, product: any) {
  const lines: Array<{
    account_id: string;
    description?: string;
    debit_amount: number;
    credit_amount: number;
  }> = [];

  switch (transaction.transaction_type) {
    case 'disbursement':
      if (product.loan_portfolio_account_id && product.fund_source_account_id) {
        lines.push({
          account_id: product.loan_portfolio_account_id,
          description: 'Loan disbursement',
          debit_amount: transaction.amount,
          credit_amount: 0,
        });
        lines.push({
          account_id: product.fund_source_account_id,
          description: 'Loan disbursement',
          debit_amount: 0,
          credit_amount: transaction.amount,
        });
      }
      break;

    case 'repayment':
      if (product.principal_payment_account_id && product.loan_portfolio_account_id) {
        lines.push({
          account_id: product.principal_payment_account_id,
          description: 'Loan repayment',
          debit_amount: transaction.amount,
          credit_amount: 0,
        });
        lines.push({
          account_id: product.loan_portfolio_account_id,
          description: 'Loan repayment',
          debit_amount: 0,
          credit_amount: transaction.amount,
        });
      }
      break;

    case 'fee_charge':
      if (product.fee_income_account_id && product.loan_portfolio_account_id) {
        lines.push({
          account_id: product.loan_portfolio_account_id,
          description: 'Fee charge',
          debit_amount: transaction.amount,
          credit_amount: 0,
        });
        lines.push({
          account_id: product.fee_income_account_id,
          description: 'Fee charge',
          debit_amount: 0,
          credit_amount: transaction.amount,
        });
      }
      break;

    case 'interest_accrual':
      if (product.interest_receivable_account_id && product.interest_income_account_id) {
        lines.push({
          account_id: product.interest_receivable_account_id,
          description: 'Interest accrual',
          debit_amount: transaction.amount,
          credit_amount: 0,
        });
        lines.push({
          account_id: product.interest_income_account_id,
          description: 'Interest accrual',
          debit_amount: 0,
          credit_amount: transaction.amount,
        });
      }
      break;

    case 'penalty':
      if (product.penalty_income_account_id && product.loan_portfolio_account_id) {
        lines.push({
          account_id: product.loan_portfolio_account_id,
          description: 'Penalty charge',
          debit_amount: transaction.amount,
          credit_amount: 0,
        });
        lines.push({
          account_id: product.penalty_income_account_id,
          description: 'Penalty charge',
          debit_amount: 0,
          credit_amount: transaction.amount,
        });
      }
      break;
  }

  return lines;
}

// Hook to validate product accounting setup
export const useValidateProductAccounting = () => {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['validate-product-accounting', profile?.tenant_id],
    queryFn: async () => {
      if (!profile?.tenant_id) return { isValid: false, issues: [] };

      const issues: string[] = [];

      // Check if chart of accounts is set up
      const { data: accounts } = await supabase
        .from('chart_of_accounts')
        .select('count')
        .eq('tenant_id', profile.tenant_id);

      if (!accounts || accounts.length === 0) {
        issues.push('No chart of accounts found. Please set up your chart of accounts first.');
      }

      // Check loan products accounting setup
      const { data: loanProducts } = await supabase
        .from('loan_products')
        .select('id, name, loan_portfolio_account_id, interest_income_account_id, fund_source_account_id')
        .eq('tenant_id', profile.tenant_id)
        .eq('is_active', true);

      const incompleteProducts = loanProducts?.filter(product => 
        !product.loan_portfolio_account_id || 
        !product.interest_income_account_id || 
        !product.fund_source_account_id
      );

      if (incompleteProducts && incompleteProducts.length > 0) {
        issues.push(`${incompleteProducts.length} loan product(s) have incomplete accounting setup.`);
      }

      return {
        isValid: issues.length === 0,
        issues,
        totalProducts: loanProducts?.length || 0,
        incompleteProducts: incompleteProducts?.length || 0,
      };
    },
    enabled: !!profile?.tenant_id,
  });
};