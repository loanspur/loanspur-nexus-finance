import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { generateLoanSchedule } from '@/lib/loan-schedule-generator';

interface RegenerateScheduleData {
  loanId: string;
  forceRegenerate?: boolean;
}

export const useLoanScheduleManager = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const regenerateSchedule = useMutation({
    mutationFn: async ({ loanId, forceRegenerate = false }: RegenerateScheduleData) => {
      if (!user || !profile?.tenant_id) {
        throw new Error('User not authenticated');
      }

      // Get loan details with product information
      const { data: loan, error: loanError } = await supabase
        .from('loans')
        .select(`
          *,
          loan_products!inner(
            repayment_frequency,
            interest_calculation_method,
            default_nominal_interest_rate
          )
        `)
        .eq('id', loanId)
        .single();

      if (loanError || !loan) {
        throw new Error('Loan not found');
      }

      // Get existing schedule to check if regeneration is needed
      const { data: existingSchedule } = await supabase
        .from('loan_schedules')
        .select('*')
        .eq('loan_id', loanId)
        .order('installment_number', { ascending: true })
        .limit(5);

      // Check if schedule needs regeneration based on frequency
      const productFrequency = loan.loan_products.repayment_frequency;
      let needsRegeneration = forceRegenerate;

      if (existingSchedule && existingSchedule.length > 1 && !forceRegenerate) {
        const firstDue = new Date(existingSchedule[0].due_date);
        const secondDue = new Date(existingSchedule[1].due_date);
        const daysBetween = Math.abs((secondDue.getTime() - firstDue.getTime()) / (1000 * 3600 * 24));

        // Check if frequency matches schedule interval
        const expectedDays = productFrequency === 'daily' ? 1 : 
                            productFrequency === 'weekly' ? 7 :
                            productFrequency === 'bi-weekly' ? 14 :
                            productFrequency === 'monthly' ? 30 :
                            productFrequency === 'quarterly' ? 90 : 30;

        if (Math.abs(daysBetween - expectedDays) > 1) {
          needsRegeneration = true;
          console.log(`Schedule frequency mismatch detected. Expected: ${expectedDays} days, Found: ${daysBetween} days`);
        }
      }

      if (needsRegeneration) {
        // Get all existing payments to preserve them
        const { data: existingPayments } = await supabase
          .from('transactions')
          .select('amount, transaction_date')
          .eq('loan_id', loanId)
          .eq('transaction_type', 'loan_repayment');

        const totalPaidAmount = existingPayments?.reduce((sum, payment) => sum + Number(payment.amount), 0) || 0;

        // Delete existing schedule
        await supabase
          .from('loan_schedules')
          .delete()
          .eq('loan_id', loanId);

        // CRITICAL: Proper interest rate normalization for schedule generation
        const loanInterestRate = Number(loan.interest_rate);
        const productDefaultRate = Number(loan.loan_products.default_nominal_interest_rate || 0);
        
        console.log(`Loan interest rate: ${loanInterestRate}, Product default: ${productDefaultRate}`);
        
        // Determine if rate needs conversion to decimal format
        let interestRateDecimal = loanInterestRate;
        
        // CASE 1: Rate stored as percentage (e.g., 12.5 for 12.5%)
        if (loanInterestRate > 1) {
          interestRateDecimal = loanInterestRate / 100;
          console.log(`Converting percentage to decimal: ${loanInterestRate}% -> ${interestRateDecimal}`);
        }
        // CASE 2: Rate already in decimal format (e.g., 0.125 for 12.5%)
        else if (loanInterestRate <= 1) {
          interestRateDecimal = loanInterestRate;
          console.log(`Using decimal rate as-is: ${interestRateDecimal}`);
        }
        
        // Safety validation
        if (interestRateDecimal > 0.5) { // More than 50% annual is unusual
          console.warn(`WARNING: Very high annual interest rate: ${interestRateDecimal * 100}%`);
        }
        
        const scheduleParams = {
          loanId,
          principal: Number(loan.principal_amount),
          interestRate: interestRateDecimal, // Already in decimal format
          termMonths: Number(loan.term_months),
          disbursementDate: loan.disbursement_date,
          repaymentFrequency: productFrequency as 'daily' | 'weekly' | 'bi-weekly' | 'monthly' | 'quarterly',
          calculationMethod: (loan.loan_products.interest_calculation_method || 'reducing_balance') as 'reducing_balance' | 'flat_rate' | 'declining_balance',
        };

        const newSchedule = generateLoanSchedule(scheduleParams);

        // Insert new schedule
        const { error: insertError } = await supabase
          .from('loan_schedules')
          .insert(newSchedule);

        if (insertError) {
          throw new Error(`Failed to insert new schedule: ${insertError.message}`);
        }

        // Re-allocate existing payments to new schedule
        if (totalPaidAmount > 0) {
          const { data: newScheduleEntries } = await supabase
            .from('loan_schedules')
            .select('*')
            .eq('loan_id', loanId)
            .order('installment_number', { ascending: true });

          if (newScheduleEntries) {
            let remainingPayment = totalPaidAmount;
            const scheduleUpdates = [];

            for (const schedule of newScheduleEntries) {
              if (remainingPayment <= 0) break;

              const paymentForThisSchedule = Math.min(remainingPayment, Number(schedule.total_amount));
              const newOutstandingAmount = Math.max(0, Number(schedule.total_amount) - paymentForThisSchedule);

              scheduleUpdates.push({
                id: schedule.id,
                paid_amount: paymentForThisSchedule,
                outstanding_amount: newOutstandingAmount,
                payment_status: newOutstandingAmount <= 0.01 ? 'paid' : (paymentForThisSchedule > 0 ? 'partial' : 'unpaid')
              });

              remainingPayment -= paymentForThisSchedule;
            }

            // Update schedules with payment allocation
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
        }

        return {
          regenerated: true,
          scheduleEntries: newSchedule.length,
          paymentsReallocated: totalPaidAmount
        };
      }

      return { regenerated: false, message: 'Schedule is already correct' };
    },
    onSuccess: (data) => {
      if (data.regenerated) {
        toast({
          title: "Schedule Regenerated",
          description: `Generated ${data.scheduleEntries} entries and reallocated ${data.paymentsReallocated} in payments`,
        });
      } else {
        toast({
          title: "No Changes Needed",
          description: data.message,
        });
      }
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['loan-schedule'] });
      queryClient.invalidateQueries({ queryKey: ['loans'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    regenerateSchedule: regenerateSchedule.mutate,
    isRegenerating: regenerateSchedule.isPending,
  };
};