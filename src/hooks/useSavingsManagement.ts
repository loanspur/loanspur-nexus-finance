import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export interface SavingsTransaction {
  id: string;
  tenant_id: string;
  savings_account_id: string;
  transaction_type: 'deposit' | 'withdrawal' | 'interest_posting' | 'fee_charge';
  amount: number;
  balance_after: number;
  transaction_date: string;
  description?: string;
  reference_number?: string;
  payment_method?: string;
  processed_by?: string;
  created_at: string;
}

export interface InterestPosting {
  id: string;
  tenant_id: string;
  savings_account_id: string;
  period_start: string;
  period_end: string;
  average_balance: number;
  interest_rate: number;
  interest_amount: number;
  posting_date: string;
  status: 'calculated' | 'posted' | 'reversed';
  created_at: string;
}

// Savings Transactions Hook
export const useSavingsTransactions = (accountId?: string) => {
  return useQuery({
    queryKey: ['savings-transactions', accountId],
    queryFn: async () => {
      if (!accountId) throw new Error('No account ID provided');

      const { data, error } = await supabase
        .from('savings_transactions')
        .select('*')
        .eq('savings_account_id', accountId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as SavingsTransaction[];
    },
    enabled: !!accountId,
  });
};

// All Savings Transactions for Tenant
export const useAllSavingsTransactions = () => {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['all-savings-transactions', profile?.tenant_id],
    queryFn: async () => {
      if (!profile?.tenant_id) throw new Error('No tenant ID available');

      const { data, error } = await supabase
        .from('savings_transactions')
        .select(`
          *,
          savings_accounts(account_number, client_id),
          clients(first_name, last_name, client_number)
        `)
        .eq('tenant_id', profile.tenant_id)
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data as any[];
    },
    enabled: !!profile?.tenant_id,
  });
};

// Process Savings Transaction
export const useProcessSavingsTransaction = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async (transaction: Omit<SavingsTransaction, 'id' | 'created_at' | 'tenant_id' | 'balance_after'>) => {
      if (!profile?.tenant_id) throw new Error('No tenant ID available');

      // Get current account balance
      const { data: account, error: accountError } = await supabase
        .from('savings_accounts')
        .select('account_balance')
        .eq('id', transaction.savings_account_id)
        .single();

      if (accountError) throw accountError;

      let newBalance = account.account_balance || 0;
      
      // Calculate new balance based on transaction type
      if (transaction.transaction_type === 'deposit' || transaction.transaction_type === 'interest_posting') {
        newBalance += transaction.amount;
      } else if (transaction.transaction_type === 'withdrawal' || transaction.transaction_type === 'fee_charge') {
        newBalance -= transaction.amount;
        
        // Check for sufficient funds
        if (newBalance < 0) {
          throw new Error('Insufficient funds for this transaction');
        }
      }

      // Insert transaction
      const { data, error } = await supabase
        .from('savings_transactions')
        .insert([{
          ...transaction,
          tenant_id: profile.tenant_id,
          balance_after: newBalance,
          processed_by: profile.id,
        }])
        .select()
        .single();
      
      if (error) throw error;

      // Update account balance
      const { error: updateError } = await supabase
        .from('savings_accounts')
        .update({ 
          account_balance: newBalance,
          available_balance: newBalance 
        })
        .eq('id', transaction.savings_account_id);

      if (updateError) throw updateError;

      return data;
    },
    onSuccess: (_, variables) => {
      // Invalidate all related queries for better data consistency
      queryClient.invalidateQueries({ queryKey: ['savings-transactions', variables.savings_account_id] });
      queryClient.invalidateQueries({ queryKey: ['all-savings-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['savings-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-data'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast({
        title: "Success",
        description: "Transaction processed successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

// Calculate and Post Interest
export const useCalculateInterest = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async ({
      accountId,
      periodStart,
      periodEnd,
      interestRate
    }: {
      accountId: string;
      periodStart: string;
      periodEnd: string;
      interestRate: number;
    }) => {
      if (!profile?.tenant_id) throw new Error('No tenant ID available');

      // Get account balance for the period (simplified - would need more complex calculation for actual average)
      const { data: account, error: accountError } = await supabase
        .from('savings_accounts')
        .select('account_balance')
        .eq('id', accountId)
        .single();

      if (accountError) throw accountError;

      const averageBalance = account.account_balance || 0;
      const days = Math.ceil((new Date(periodEnd).getTime() - new Date(periodStart).getTime()) / (1000 * 60 * 60 * 24));
      const interestAmount = (averageBalance * interestRate / 100 * days) / 365;

      // Create interest posting record
      const { data: posting, error: postingError } = await supabase
        .from('savings_interest_postings')
        .insert([{
          tenant_id: profile.tenant_id,
          savings_account_id: accountId,
          period_start: periodStart,
          period_end: periodEnd,
          average_balance: averageBalance,
          interest_rate: interestRate,
          interest_amount: interestAmount,
          status: 'calculated'
        }])
        .select()
        .single();

      if (postingError) throw postingError;

      return posting;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interest-postings'] });
      toast({
        title: "Success",
        description: "Interest calculated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

// Post Interest to Account
export const usePostInterest = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (postingId: string) => {
      // Get the interest posting
      const { data: posting, error: postingError } = await supabase
        .from('savings_interest_postings')
        .select('*')
        .eq('id', postingId)
        .single();

      if (postingError) throw postingError;

      // Create interest transaction
      const { data: transaction, error: transactionError } = await supabase
        .from('savings_transactions')
        .insert([{
          tenant_id: posting.tenant_id,
          savings_account_id: posting.savings_account_id,
          transaction_type: 'interest_posting',
          amount: posting.interest_amount,
          balance_after: 0, // Will be calculated by the hook
          transaction_date: posting.posting_date,
          description: `Interest for period ${posting.period_start} to ${posting.period_end}`,
          reference_number: `INT-${postingId.slice(-8).toUpperCase()}`
        }])
        .select()
        .single();

      if (transactionError) throw transactionError;

      // Update posting status
      const { error: updateError } = await supabase
        .from('savings_interest_postings')
        .update({ status: 'posted' })
        .eq('id', postingId);

      if (updateError) throw updateError;

      return transaction;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interest-postings'] });
      queryClient.invalidateQueries({ queryKey: ['savings-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['savings-accounts'] });
      toast({
        title: "Success",
        description: "Interest posted to account successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

// Interest Postings Hook
export const useInterestPostings = () => {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['interest-postings', profile?.tenant_id],
    queryFn: async () => {
      if (!profile?.tenant_id) throw new Error('No tenant ID available');

      const { data, error } = await supabase
        .from('savings_interest_postings')
        .select(`
          *,
          savings_accounts(account_number, client_id),
          clients(first_name, last_name, client_number)
        `)
        .eq('tenant_id', profile.tenant_id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as any[];
    },
    enabled: !!profile?.tenant_id,
  });
};