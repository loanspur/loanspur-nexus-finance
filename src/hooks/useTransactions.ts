import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export interface Transaction {
  id: string;
  tenant_id: string;
  transaction_id: string;
  amount: number;
  payment_type: 'cash' | 'bank_transfer' | 'mpesa' | 'mobile_money' | 'cheque';
  transaction_type: 'loan_repayment' | 'savings_deposit' | 'loan_disbursement' | 'savings_withdrawal' | 'fee_payment';
  payment_status: 'pending' | 'completed' | 'failed' | 'cancelled';
  transaction_date: string;
  description?: string;
  client_id?: string;
  loan_id?: string;
  savings_account_id?: string;
  external_transaction_id?: string;
  mpesa_receipt_number?: string;
  processed_by?: string;
  reconciliation_status?: string;
  created_at: string;
  updated_at: string;
}

export const useTransactions = () => {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['transactions', profile?.tenant_id],
    queryFn: async () => {
      if (!profile?.tenant_id) {
        throw new Error('No tenant ID available');
      }

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('tenant_id', profile.tenant_id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Transaction[];
    },
    enabled: !!profile?.tenant_id,
  });
};

export const useCreateTransaction = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async (transaction: Omit<Transaction, 'id' | 'created_at' | 'updated_at' | 'tenant_id'>) => {
      if (!profile?.tenant_id) {
        throw new Error('No tenant ID available');
      }

      const { data, error } = await supabase
        .from('transactions')
        .insert([{
          ...transaction,
          tenant_id: profile.tenant_id,
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast({
        title: "Success",
        description: "Transaction created successfully",
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

export const useUpdateTransaction = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Transaction> }) => {
      const { data, error } = await supabase
        .from('transactions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast({
        title: "Success",
        description: "Transaction updated successfully",
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

export const useReverseTransaction = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      transactionId, 
      reason, 
      notes 
    }: { 
      transactionId: string; 
      reason: string; 
      notes?: string;
    }) => {
      if (!profile?.tenant_id) {
        throw new Error('No tenant ID available');
      }

      // Get original transaction
      const { data: originalTransaction, error: fetchError } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', transactionId)
        .single();

      if (fetchError) throw fetchError;

      // Create reversal transaction
      const reversalTransaction = {
        tenant_id: profile.tenant_id,
        transaction_id: `REV-${originalTransaction.transaction_id}`,
        amount: -originalTransaction.amount, // Negative amount for reversal
        payment_type: originalTransaction.payment_type,
        transaction_type: originalTransaction.transaction_type,
        payment_status: 'completed' as const,
        transaction_date: new Date().toISOString(),
        description: `Reversal of ${originalTransaction.transaction_id} - ${reason}`,
        client_id: originalTransaction.client_id,
        loan_id: originalTransaction.loan_id,
        savings_account_id: originalTransaction.savings_account_id,
        processed_by: profile.id,
        reconciliation_status: 'reconciled',
      };

      const { data, error } = await supabase
        .from('transactions')
        .insert([reversalTransaction])
        .select()
        .single();
      
      if (error) throw error;

      // Update original transaction status
      await supabase
        .from('transactions')
        .update({ 
          payment_status: 'cancelled' as const,
          description: `${originalTransaction.description || ''} [REVERSED: ${reason}]`
        })
        .eq('id', transactionId);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast({
        title: "Success",
        description: "Transaction reversed successfully",
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