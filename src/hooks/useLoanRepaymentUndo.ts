import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { useCreateJournalEntry } from './useAccounting';

export interface LoanRepaymentUndoData {
  paymentId: string;
  loanId: string;
  reason: string;
  notes?: string;
}

export const useLoanRepaymentUndo = () => {
  const { profile } = useAuth();
  const createJournalEntry = useCreateJournalEntry();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: LoanRepaymentUndoData) => {
      if (!profile?.tenant_id) {
        throw new Error('No tenant context');
      }

      // 1. Get the original payment details
      const { data: payment, error: paymentError } = await supabase
        .from('loan_payments')
        .select(`
          *,
          loans!inner(
            loan_number,
            status,
            outstanding_balance,
            principal_amount,
            loan_products!inner(
              loan_portfolio_account_id,
              interest_income_account_id,
              fee_income_account_id,
              penalty_income_account_id,
              fund_source_account_id,
              accounting_type
            )
          )
        `)
        .eq('id', data.paymentId)
        .eq('tenant_id', profile.tenant_id)
        .single();

      if (paymentError || !payment) {
        throw new Error('Payment not found or access denied');
      }

      // 2. Verify loan is not in a state that prevents undo
      const loan = payment.loans;
      if (loan.status === 'written_off') {
        throw new Error('Cannot undo payments on written-off loans');
      }

      const product = loan.loan_products;
      if (product.accounting_type === 'none') {
        throw new Error('Accounting is disabled for this loan product');
      }

      // 3. Check if payment has already been reversed
      const { data: existingReversal } = await supabase
        .from('transactions')
        .select('id')
        .eq('external_transaction_id', `REV-${payment.reference_number || payment.id}`)
        .maybeSingle();

      if (existingReversal) {
        throw new Error('This payment has already been reversed');
      }

      // 4. Get payment account from payment method mapping
      let paymentAccount = product.fund_source_account_id;
      
      if (payment.payment_method) {
        const { data: mappings } = await supabase
          .from('product_fund_source_mappings')
          .select('account_id')
          .eq('tenant_id', profile.tenant_id)
          .eq('product_id', product.loan_portfolio_account_id) // Use portfolio account as proxy
          .eq('product_type', 'loan')
          .eq('channel_id', payment.payment_method)
          .maybeSingle();

        if (mappings?.account_id) {
          paymentAccount = mappings.account_id;
        }
      }

      if (!paymentAccount) {
        throw new Error('Payment account not configured');
      }

      // 5. Create reversal journal entries (opposite of original)
      const reversalLines: Array<{
        account_id: string;
        description: string;
        debit_amount: number;
        credit_amount: number;
      }> = [];

      const reversalDescription = `Reversal of payment ${payment.reference_number || payment.id} - ${loan.loan_number}`;

      // Principal reversal
      if ((payment.principal_amount || 0) > 0) {
        reversalLines.push({
          account_id: product.loan_portfolio_account_id,
          description: `Principal payment reversal - ${loan.loan_number}`,
          debit_amount: payment.principal_amount || 0,
          credit_amount: 0,
        });

        reversalLines.push({
          account_id: paymentAccount,
          description: `Principal payment reversal - ${loan.loan_number}`,
          debit_amount: 0,
          credit_amount: payment.principal_amount || 0,
        });
      }

      // Interest reversal
      if ((payment.interest_amount || 0) > 0) {
        reversalLines.push({
          account_id: product.interest_income_account_id,
          description: `Interest payment reversal - ${loan.loan_number}`,
          debit_amount: payment.interest_amount || 0,
          credit_amount: 0,
        });

        reversalLines.push({
          account_id: paymentAccount,
          description: `Interest payment reversal - ${loan.loan_number}`,
          debit_amount: 0,
          credit_amount: payment.interest_amount || 0,
        });
      }

      // Fee reversal
      if ((payment.fee_amount || 0) > 0) {
        reversalLines.push({
          account_id: product.fee_income_account_id,
          description: `Fee payment reversal - ${loan.loan_number}`,
          debit_amount: payment.fee_amount || 0,
          credit_amount: 0,
        });

        reversalLines.push({
          account_id: paymentAccount,
          description: `Fee payment reversal - ${loan.loan_number}`,
          debit_amount: 0,
          credit_amount: payment.fee_amount || 0,
        });
      }

      // Penalty reversal
      const penaltyAmount = (payment as any).penalty_amount || 0;
      if (penaltyAmount > 0) {
        reversalLines.push({
          account_id: product.penalty_income_account_id,
          description: `Penalty payment reversal - ${loan.loan_number}`,
          debit_amount: penaltyAmount,
          credit_amount: 0,
        });

        reversalLines.push({
          account_id: paymentAccount,
          description: `Penalty payment reversal - ${loan.loan_number}`,
          debit_amount: 0,
          credit_amount: penaltyAmount,
        });
      }

      if (reversalLines.length === 0) {
        throw new Error('No accounting entries to reverse');
      }

      // 6. Create reversal journal entry
      await createJournalEntry.mutateAsync({
        transaction_date: new Date().toISOString().split('T')[0],
        description: reversalDescription,
        reference_type: 'loan_payment_reversal',
        reference_id: data.paymentId,
        lines: reversalLines,
      });

      // 7. Create reversal transaction record
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          tenant_id: profile.tenant_id,
          loan_id: data.loanId,
          amount: -payment.payment_amount, // Negative amount for reversal
          transaction_type: 'loan_repayment',
          payment_type: payment.payment_method as any,
          payment_status: 'completed',
          transaction_date: new Date().toISOString(),
          transaction_id: `LR-REV-${Date.now()}`,
          external_transaction_id: `REV-${payment.reference_number || payment.id}`,
          description: `Reversal: ${reversalDescription}`,
          processed_by: profile.id,
          reconciliation_status: 'reconciled'
        });

      if (transactionError) {
        console.error('Failed to create reversal transaction:', transactionError);
      }

      // 8. Create loan payment reversal record - simplified approach
      const { error: reversalError } = await supabase
        .from('transactions')
        .insert({
          tenant_id: profile.tenant_id,
          loan_id: data.loanId,
          amount: payment.payment_amount, // Positive amount for reversal record
          transaction_type: 'loan_repayment',
          payment_type: payment.payment_method as any,
          payment_status: 'completed',
          transaction_date: new Date().toISOString(),
          transaction_id: `LR-UNDO-${Date.now()}`,
          external_transaction_id: `UNDO-${payment.reference_number || payment.id}`,
          description: `Undo: ${reversalDescription} - Reason: ${data.reason}`,
          processed_by: profile.id,
          reconciliation_status: 'reconciled'
        });

      if (reversalError) {
        console.error('Failed to create undo record:', reversalError);
      }

      // 9. Update loan outstanding balance
      const newOutstanding = (loan.outstanding_balance || 0) + payment.payment_amount;
      const loanUpdatePayload: any = { 
        outstanding_balance: newOutstanding 
      };

      // Reopen loan if it was closed and now has outstanding balance
      if (loan.status === 'closed' && newOutstanding > 0) {
        loanUpdatePayload.status = 'active';
        loanUpdatePayload.closed_date = null;
      }

      const { error: loanUpdateError } = await supabase
        .from('loans')
        .update(loanUpdatePayload)
        .eq('id', data.loanId);

      if (loanUpdateError) {
        console.error('Failed to update loan status:', loanUpdateError);
      }

      // 10. Update loan schedules to reflect the reversal
      const { data: schedules, error: schedulesError } = await supabase
        .from('loan_schedules')
        .select('*')
        .eq('loan_id', data.loanId)
        .order('installment_number', { ascending: true });

      if (!schedulesError && schedules && schedules.length > 0) {
        let remainingReversal = payment.payment_amount;
        const scheduleUpdates = [];

        // Reverse the payment allocation by working backwards through paid schedules
        for (let i = schedules.length - 1; i >= 0 && remainingReversal > 0; i--) {
          const schedule = schedules[i];
          const currentPaid = Number(schedule.paid_amount || 0);
          
          if (currentPaid > 0) {
            const reversalForThisSchedule = Math.min(remainingReversal, currentPaid);
            const newPaidAmount = currentPaid - reversalForThisSchedule;
            const newOutstandingAmount = Number(schedule.total_amount) - newPaidAmount;
            
            scheduleUpdates.push({
              id: schedule.id,
              paid_amount: newPaidAmount,
              outstanding_amount: newOutstandingAmount,
              payment_status: newPaidAmount <= 0.01 ? 'unpaid' : (newOutstandingAmount <= 0.01 ? 'paid' : 'partial')
            });

            remainingReversal -= reversalForThisSchedule;
          }
        }

        // Update schedules
        for (const update of scheduleUpdates) {
          await supabase
            .from('loan_schedules')
            .update({
              paid_amount: update.paid_amount,
              outstanding_amount: update.outstanding_amount,
              payment_status: update.payment_status
            })
            .eq('id', update.id);
        }
      }

      // 11. Mark original payment as reversed - using direct update
      const { error: paymentUpdateError } = await supabase
        .from('loan_payments')
        .update({ 
          payment_method: `${payment.payment_method}_REVERSED`  // Mark as reversed
        })
        .eq('id', data.paymentId);

      if (paymentUpdateError) {
        console.error('Failed to mark payment as reversed:', paymentUpdateError);
      }

      return { 
        success: true, 
        reversalAmount: payment.payment_amount,
        loanNumber: loan.loan_number
      };
    },
    onSuccess: (result) => {
      toast({
        title: "Payment Reversed",
        description: `Successfully reversed payment of ${new Intl.NumberFormat('en-KE', {
          style: 'currency',
          currency: 'KES',
        }).format(result.reversalAmount)} for loan ${result.loanNumber}`,
      });
      
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['loan_payments'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      queryClient.invalidateQueries({ queryKey: ['loan_schedules'] });
      queryClient.invalidateQueries({ queryKey: ['journal_entries'] });
    },
    onError: (error: any) => {
      toast({
        title: "Reversal Failed",
        description: error.message || "Failed to reverse payment. Please try again.",
        variant: "destructive",
      });
    },
  });
};