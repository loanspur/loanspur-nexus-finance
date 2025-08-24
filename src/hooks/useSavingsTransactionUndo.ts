import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { useCreateJournalEntry } from './useAccounting';

export interface SavingsTransactionUndoData {
  transactionId: string;
  savingsAccountId: string;
  reason: string;
  notes?: string;
}

export const useSavingsTransactionUndo = () => {
  const { profile } = useAuth();
  const createJournalEntry = useCreateJournalEntry();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: SavingsTransactionUndoData) => {
      if (!profile?.tenant_id) {
        throw new Error('No tenant context');
      }

      // 1. Get the original transaction details
      const { data: transaction, error: transactionError } = await supabase
        .from('savings_transactions')
        .select(`
          *,
          savings_accounts!inner(
            account_number,
            account_balance,
            savings_products!inner(
              savings_reference_account_id,
              savings_control_account_id,
              interest_on_savings_account_id,
              income_from_fees_account_id,
              income_from_penalties_account_id,
              accounting_method
            )
          )
        `)
        .eq('id', data.transactionId)
        .eq('tenant_id', profile.tenant_id)
        .single();

      if (transactionError || !transaction) {
        throw new Error('Transaction not found or access denied');
      }

      const savingsAccount = transaction.savings_accounts;
      const product = savingsAccount.savings_products;

      if (product.accounting_method === 'none') {
        throw new Error('Accounting is disabled for this savings product');
      }

      // 2. Check if transaction has already been reversed
      const { data: existingReversal } = await supabase
        .from('transactions')
        .select('id')
        .eq('external_transaction_id', `REV-${transaction.reference_number || transaction.id}`)
        .maybeSingle();

      if (existingReversal) {
        throw new Error('This transaction has already been reversed');
      }

      // 3. Create reversal journal entries (opposite of original)
      const reversalLines: Array<{
        account_id: string;
        description: string;
        debit_amount: number;
        credit_amount: number;
      }> = [];

      const reversalDescription = `Reversal of ${transaction.transaction_type} ${transaction.reference_number || transaction.id} - ${savingsAccount.account_number}`;

      if (transaction.transaction_type === 'deposit') {
        // Reverse deposit: Debit savings control, Credit savings reference
        reversalLines.push({
          account_id: product.savings_control_account_id,
          description: `Deposit reversal - ${savingsAccount.account_number}`,
          debit_amount: transaction.amount,
          credit_amount: 0,
        });

        reversalLines.push({
          account_id: product.savings_reference_account_id,
          description: `Deposit reversal - ${savingsAccount.account_number}`,
          debit_amount: 0,
          credit_amount: transaction.amount,
        });
      } else if (transaction.transaction_type === 'withdrawal') {
        // Reverse withdrawal: Debit savings reference, Credit savings control
        reversalLines.push({
          account_id: product.savings_reference_account_id,
          description: `Withdrawal reversal - ${savingsAccount.account_number}`,
          debit_amount: transaction.amount,
          credit_amount: 0,
        });

        reversalLines.push({
          account_id: product.savings_control_account_id,
          description: `Withdrawal reversal - ${savingsAccount.account_number}`,
          debit_amount: 0,
          credit_amount: transaction.amount,
        });
      }

      // Note: Savings transactions don't have separate fee amounts in the current schema

      if (reversalLines.length === 0) {
        throw new Error('No accounting entries to reverse');
      }

      // 4. Create reversal journal entry
      await createJournalEntry.mutateAsync({
        transaction_date: new Date().toISOString().split('T')[0],
        description: reversalDescription,
        reference_type: 'savings_reversal',
        reference_id: data.transactionId,
        lines: reversalLines,
      });

      // 5. Create reversal transaction record
      const { error: transactionInsertError } = await supabase
        .from('transactions')
        .insert({
          tenant_id: profile.tenant_id,
          savings_account_id: data.savingsAccountId,
          amount: -transaction.amount, // Negative amount for reversal
          transaction_type: transaction.transaction_type as any,
          payment_type: transaction.method as any,
          payment_status: 'completed',
          transaction_date: new Date().toISOString(),
          transaction_id: `SR-REV-${Date.now()}`,
          external_transaction_id: `REV-${transaction.reference_number || transaction.id}`,
          description: `Reversal: ${reversalDescription}`,
          processed_by: profile.id,
          reconciliation_status: 'reconciled'
        });

      if (transactionInsertError) {
        console.error('Failed to create reversal transaction:', transactionInsertError);
      }

      // 6. Update savings account balance
      const balanceAdjustment = transaction.transaction_type === 'deposit' 
        ? -transaction.amount 
        : transaction.amount;
      
      const newBalance = (savingsAccount.account_balance || 0) + balanceAdjustment;

      const { error: accountUpdateError } = await supabase
        .from('savings_accounts')
        .update({ 
          account_balance: newBalance,
          available_balance: newBalance 
        })
        .eq('id', data.savingsAccountId);

      if (accountUpdateError) {
        console.error('Failed to update savings account balance:', accountUpdateError);
      }

      // 7. Mark original transaction as reversed
      const { error: savingsTransactionUpdateError } = await supabase
        .from('savings_transactions')
        .update({ 
          method: `${transaction.method}_REVERSED`
        })
        .eq('id', data.transactionId);

      if (savingsTransactionUpdateError) {
        console.error('Failed to mark savings transaction as reversed:', savingsTransactionUpdateError);
      }

      return { 
        success: true, 
        reversalAmount: transaction.amount,
        accountNumber: savingsAccount.account_number,
        transactionType: transaction.transaction_type
      };
    },
    onSuccess: (result) => {
      toast({
        title: "Transaction Reversed",
        description: `Successfully reversed ${result.transactionType} of ${new Intl.NumberFormat('en-KE', {
          style: 'currency',
          currency: 'KES',
        }).format(result.reversalAmount)} for account ${result.accountNumber}`,
      });
      
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['savings_transactions'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['savings_accounts'] });
      queryClient.invalidateQueries({ queryKey: ['journal_entries'] });
    },
    onError: (error: any) => {
      toast({
        title: "Reversal Failed",
        description: error.message || "Failed to reverse transaction. Please try again.",
        variant: "destructive",
      });
    },
  });
};