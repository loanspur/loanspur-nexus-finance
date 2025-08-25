import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { useCreateJournalEntry } from './useAccounting';
import { harmonizeLoanCalculations } from '@/lib/mifos-interest-calculation';

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
            client_id,
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

      // 8. Handle overpayment reversal - check if there was a savings transfer
      const { data: overpaymentTransfers } = await supabase
        .from('savings_transactions')
        .select(`
          *,
          savings_accounts!inner(account_balance, available_balance)
        `)
        .eq('description', `Overpayment transfer from loan ${loan.loan_number}`)
        .gte('created_at', payment.created_at);

      let overpaymentReversalAmount = 0;
      if (overpaymentTransfers && overpaymentTransfers.length > 0) {
        for (const transfer of overpaymentTransfers) {
          // Reverse the savings deposit
          const reversalAmount = Number(transfer.amount);
          overpaymentReversalAmount += reversalAmount;

          // Get current savings account balance
          const { data: savingsAccount } = await supabase
            .from('savings_accounts')
            .select('account_balance, available_balance')
            .eq('id', transfer.savings_account_id)
            .single();

          if (savingsAccount) {
            // Create withdrawal to reverse the deposit
            const { error: savingsReversalError } = await supabase
              .from('savings_transactions')
              .insert({
                tenant_id: profile.tenant_id,
                savings_account_id: transfer.savings_account_id,
                amount: reversalAmount,
                transaction_type: 'withdrawal',
                transaction_date: new Date().toISOString().split('T')[0],
                description: `Reversal: Overpayment transfer from loan ${loan.loan_number}`,
                reference_number: `REV-OVP-${transfer.id}`,
                method: 'cash',
                processed_by: profile.id,
                balance_after: (savingsAccount.account_balance || 0) - reversalAmount
              });

            if (!savingsReversalError) {
              // Update savings account balance
              await supabase
                .from('savings_accounts')
                .update({
                  account_balance: (savingsAccount.account_balance || 0) - reversalAmount,
                  available_balance: (savingsAccount.available_balance || 0) - reversalAmount,
                  updated_at: new Date().toISOString()
                })
                .eq('id', transfer.savings_account_id);

              // Create transaction record for overpayment reversal
              await supabase
                .from('transactions')
                .insert({
                  tenant_id: profile.tenant_id,
                  client_id: loan.client_id,
                  loan_id: data.loanId,
                  savings_account_id: transfer.savings_account_id,
                  amount: -reversalAmount, // Negative for withdrawal
                  transaction_type: 'savings_withdrawal',
                  payment_type: 'cash',
                  payment_status: 'completed',
                  transaction_date: new Date().toISOString(),
                  transaction_id: `OVP-REV-${Date.now()}`,
                  description: `Overpayment reversal from loan payment undo: ${reversalDescription}`,
                  processed_by: profile.id
                });
            }
          }
        }
      }

      // 9. Create undo transaction record
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

      // 11. Mark original payment as reversed
      const { error: paymentUpdateError } = await supabase
        .from('loan_payments')
        .update({ 
          payment_method: `${payment.payment_method}_REVERSED`  // Mark as reversed
        })
        .eq('id', data.paymentId);

      if (paymentUpdateError) {
        console.error('Failed to mark payment as reversed:', paymentUpdateError);
      }

      // 12. Trigger harmonized loan calculations to ensure consistency
      try {
        const { data: updatedLoan } = await supabase
          .from('loans')
          .select(`
            *,
            loan_products!inner(
              repayment_frequency,
              interest_calculation_method,
              default_nominal_interest_rate
            )
          `)
          .eq('id', data.loanId)
          .single();

        if (updatedLoan) {
          const harmonizedResult = await harmonizeLoanCalculations(updatedLoan);
          console.log('Harmonized calculations after reversal:', harmonizedResult);
          
          // Update loan status based on new calculations
          const shouldReopen = harmonizedResult.calculatedOutstanding > 0 && loan.status === 'closed';
          if (shouldReopen) {
            await supabase
              .from('loans')
              .update({
                status: harmonizedResult.daysInArrears > 0 ? 'overdue' : 'active',
                closed_date: null,
                updated_at: new Date().toISOString()
              })
              .eq('id', data.loanId);
          }
        }
      } catch (harmonizationError) {
        console.error('Harmonization after reversal failed:', harmonizationError);
        // Don't fail the reversal if harmonization fails
      }

      return { 
        success: true, 
        reversalAmount: payment.payment_amount + overpaymentReversalAmount,
        loanNumber: loan.loan_number,
        overpaymentReversed: overpaymentReversalAmount > 0
      };
    },
    onSuccess: (result) => {
      const overpaymentText = result.overpaymentReversed 
        ? " Overpayment transfers have also been reversed." 
        : "";
      
      toast({
        title: "Payment Reversed",
        description: `Successfully reversed payment of ${new Intl.NumberFormat('en-KE', {
          style: 'currency',
          currency: 'KES',
        }).format(result.reversalAmount)} for loan ${result.loanNumber}.${overpaymentText}`,
      });
      
      // Invalidate relevant queries to refresh data - including harmonized data
      queryClient.invalidateQueries({ queryKey: ['loan_payments'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      queryClient.invalidateQueries({ queryKey: ['loan_schedules'] });
      queryClient.invalidateQueries({ queryKey: ['journal_entries'] });
      queryClient.invalidateQueries({ queryKey: ['savings_transactions'] });
      queryClient.invalidateQueries({ queryKey: ['savings_accounts'] });
      queryClient.invalidateQueries({ queryKey: ['harmonized_loan_calculations'] });
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