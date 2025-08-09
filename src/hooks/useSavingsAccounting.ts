import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { useCreateJournalEntry } from './useAccounting';

// Types for payment and fee mappings
interface PaymentTypeMapping {
  payment_type: string;
  asset_account_id: string;
}

interface FeeMapping {
  fee_name: string;
  fee_type: string;
  income_account_id: string;
}

// Types for savings accounting transactions
export interface SavingsDepositData {
  savings_account_id: string;
  savings_product_id: string;
  amount: number;
  transaction_date: string;
  account_number: string;
  payment_method?: string;
}

export interface SavingsWithdrawalData {
  savings_account_id: string;
  savings_product_id: string;
  amount: number;
  transaction_date: string;
  account_number: string;
  payment_method?: string;
}

export interface SavingsFeeChargeData {
  savings_account_id: string;
  savings_product_id: string;
  amount: number;
  transaction_date: string;
  account_number: string;
  fee_type: string;
  description: string;
}

export interface SavingsInterestPostingData {
  savings_account_id: string;
  savings_product_id: string;
  amount: number;
  transaction_date: string;
  account_number: string;
  period_start: string;
  period_end: string;
}

// Hook for savings deposit accounting
export const useSavingsDepositAccounting = () => {
  const { profile } = useAuth();
  const createJournalEntry = useCreateJournalEntry();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: SavingsDepositData) => {
      if (!profile?.tenant_id) {
        throw new Error('No tenant context');
      }

      // Get savings product accounting setup
      const { data: product, error: productError } = await supabase
        .from('savings_products')
        .select(`
          savings_reference_account_id,
          savings_control_account_id,
          payment_type_mappings,
          accounting_method
        `)
        .eq('id', data.savings_product_id)
        .single();

      if (productError) throw productError;

      if (!product.savings_reference_account_id || !product.savings_control_account_id) {
        throw new Error('Savings product accounting accounts not configured');
      }

      if (product.accounting_method === 'none') {
        throw new Error('Accounting is disabled for this savings product');
      }

      // Determine the cash/asset account based on payment method
      let assetAccountId = product.savings_reference_account_id as string;

      // Try advanced product mapping first
      if (data.payment_method) {
        try {
          const { resolveFundSourceAccount } = await import('./useFundSourceResolver');
          const mapped = await resolveFundSourceAccount({
            productId: data.savings_product_id,
            productType: 'savings',
            paymentMethodCode: data.payment_method,
          });
          if (mapped) assetAccountId = mapped;
        } catch (e) {
          console.warn('Savings deposit resolver failed', e);
        }
      }

      // If no mapping found, check legacy JSON mappings
      if (data.payment_method && product.payment_type_mappings && assetAccountId === product.savings_reference_account_id) {
        const mappings = product.payment_type_mappings as unknown as PaymentTypeMapping[];
        const mapping = mappings.find((m) => m.payment_type === data.payment_method);
        if (mapping?.asset_account_id) {
          assetAccountId = mapping.asset_account_id;
        }
      }

      // Create deposit journal entry
      // Dr. Cash/Asset Account
      // Cr. Savings Control Account (Liability)
      await createJournalEntry.mutateAsync({
        transaction_date: data.transaction_date,
        description: `Savings deposit - ${data.account_number}`,
        reference_type: 'savings_deposit',
        reference_id: data.savings_account_id,
        lines: [
          {
            account_id: assetAccountId,
            description: `Savings deposit - ${data.account_number}`,
            debit_amount: data.amount,
            credit_amount: 0,
          },
          {
            account_id: product.savings_control_account_id,
            description: `Savings deposit - ${data.account_number}`,
            debit_amount: 0,
            credit_amount: data.amount,
          },
        ],
      });

      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: "Deposit Recorded",
        description: "Savings deposit has been recorded in the accounting system.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Accounting Error",
        description: error.message || "Failed to record savings deposit.",
        variant: "destructive",
      });
    },
  });
};

// Hook for savings withdrawal accounting
export const useSavingsWithdrawalAccounting = () => {
  const { profile } = useAuth();
  const createJournalEntry = useCreateJournalEntry();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: SavingsWithdrawalData) => {
      if (!profile?.tenant_id) {
        throw new Error('No tenant context');
      }

      // Get savings product accounting setup
      const { data: product, error: productError } = await supabase
        .from('savings_products')
        .select(`
          savings_reference_account_id,
          savings_control_account_id,
          payment_type_mappings,
          accounting_method
        `)
        .eq('id', data.savings_product_id)
        .single();

      if (productError) throw productError;

      if (!product.savings_reference_account_id || !product.savings_control_account_id) {
        throw new Error('Savings product accounting accounts not configured');
      }

      if (product.accounting_method === 'none') {
        throw new Error('Accounting is disabled for this savings product');
      }

      // Determine the cash/asset account based on payment method
      let assetAccountId = product.savings_reference_account_id as string;

      // Try advanced product mapping first
      if (data.payment_method) {
        try {
          const { resolveFundSourceAccount } = await import('./useFundSourceResolver');
          const mapped = await resolveFundSourceAccount({
            productId: data.savings_product_id,
            productType: 'savings',
            paymentMethodCode: data.payment_method,
          });
          if (mapped) assetAccountId = mapped;
        } catch (e) {
          console.warn('Savings withdrawal resolver failed', e);
        }
      }

      // If no mapping found, check legacy JSON mappings
      if (data.payment_method && product.payment_type_mappings && assetAccountId === product.savings_reference_account_id) {
        const mappings = product.payment_type_mappings as unknown as PaymentTypeMapping[];
        const mapping = mappings.find((m) => m.payment_type === data.payment_method);
        if (mapping?.asset_account_id) {
          assetAccountId = mapping.asset_account_id;
        }
      }

      // Create withdrawal journal entry
      // Dr. Savings Control Account (Liability)
      // Cr. Cash/Asset Account
      await createJournalEntry.mutateAsync({
        transaction_date: data.transaction_date,
        description: `Savings withdrawal - ${data.account_number}`,
        reference_type: 'savings_withdrawal',
        reference_id: data.savings_account_id,
        lines: [
          {
            account_id: product.savings_control_account_id,
            description: `Savings withdrawal - ${data.account_number}`,
            debit_amount: data.amount,
            credit_amount: 0,
          },
          {
            account_id: assetAccountId,
            description: `Savings withdrawal - ${data.account_number}`,
            debit_amount: 0,
            credit_amount: data.amount,
          },
        ],
      });

      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: "Withdrawal Recorded",
        description: "Savings withdrawal has been recorded in the accounting system.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Accounting Error",
        description: error.message || "Failed to record savings withdrawal.",
        variant: "destructive",
      });
    },
  });
};

// Hook for savings fee charge accounting
export const useSavingsFeeChargeAccounting = () => {
  const { profile } = useAuth();
  const createJournalEntry = useCreateJournalEntry();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: SavingsFeeChargeData) => {
      if (!profile?.tenant_id) {
        throw new Error('No tenant context');
      }

      // Get savings product accounting setup
      const { data: product, error: productError } = await supabase
        .from('savings_products')
        .select(`
          savings_control_account_id,
          income_from_fees_account_id,
          fee_mappings,
          accounting_method
        `)
        .eq('id', data.savings_product_id)
        .single();

      if (productError) throw productError;

      if (!product.savings_control_account_id || !product.income_from_fees_account_id) {
        throw new Error('Savings product fee accounting accounts not configured');
      }

      if (product.accounting_method === 'none') {
        throw new Error('Accounting is disabled for this savings product');
      }

      // Determine the income account based on fee type
      let incomeAccountId = product.income_from_fees_account_id;
      
      // Check fee mappings for specific fee type
      if (product.fee_mappings) {
        const mappings = product.fee_mappings as unknown as FeeMapping[];
        
        const mapping = mappings.find((m) => m.fee_type === data.fee_type);
        if (mapping?.income_account_id) {
          incomeAccountId = mapping.income_account_id;
        }
      }

      // Create fee charge journal entry
      // Dr. Savings Control Account (reduce customer balance)
      // Cr. Fee Income Account
      await createJournalEntry.mutateAsync({
        transaction_date: data.transaction_date,
        description: data.description,
        reference_type: 'savings_fee_charge',
        reference_id: data.savings_account_id,
        lines: [
          {
            account_id: product.savings_control_account_id,
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
        title: "Fee Charge Recorded",
        description: "Savings fee charge has been recorded in the accounting system.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Accounting Error",
        description: error.message || "Failed to record savings fee charge.",
        variant: "destructive",
      });
    },
  });
};

// Hook for savings interest posting accounting
export const useSavingsInterestPostingAccounting = () => {
  const { profile } = useAuth();
  const createJournalEntry = useCreateJournalEntry();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: SavingsInterestPostingData) => {
      if (!profile?.tenant_id) {
        throw new Error('No tenant context');
      }

      // Get savings product accounting setup
      const { data: product, error: productError } = await supabase
        .from('savings_products')
        .select(`
          savings_control_account_id,
          interest_on_savings_account_id,
          accounting_method
        `)
        .eq('id', data.savings_product_id)
        .single();

      if (productError) throw productError;

      if (!product.savings_control_account_id || !product.interest_on_savings_account_id) {
        throw new Error('Savings product interest accounting accounts not configured');
      }

      if (product.accounting_method === 'none') {
        throw new Error('Accounting is disabled for this savings product');
      }

      // Create interest posting journal entry
      // Dr. Interest Expense Account
      // Cr. Savings Control Account (increase customer balance)
      await createJournalEntry.mutateAsync({
        transaction_date: data.transaction_date,
        description: `Interest posting - ${data.account_number} (${data.period_start} to ${data.period_end})`,
        reference_type: 'savings_interest_posting',
        reference_id: data.savings_account_id,
        lines: [
          {
            account_id: product.interest_on_savings_account_id,
            description: `Interest posting - ${data.account_number}`,
            debit_amount: data.amount,
            credit_amount: 0,
          },
          {
            account_id: product.savings_control_account_id,
            description: `Interest posting - ${data.account_number}`,
            debit_amount: 0,
            credit_amount: data.amount,
          },
        ],
      });

      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: "Interest Posted",
        description: "Savings interest has been recorded in the accounting system.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Accounting Error",
        description: error.message || "Failed to record savings interest.",
        variant: "destructive",
      });
    },
  });
};