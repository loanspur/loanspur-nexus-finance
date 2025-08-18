import { supabase } from '@/integrations/supabase/client';
import { generateLoanSchedule, LoanScheduleParams } from '@/lib/loan-schedule-generator';
import { allocateRepayment } from '@/lib/loan-repayment-strategy';

export interface LoanCalculationData {
  id: string;
  principal_amount: number;
  interest_rate: number;
  term_months: number;
  disbursement_date: string;
  outstanding_balance: number;
  loan_products: {
    repayment_frequency: string;
    interest_calculation_method?: string;
    default_nominal_interest_rate: number;
  };
}

export interface HarmonizedLoanCalculation {
  totalScheduledAmount: number;
  totalPaidAmount: number;
  calculatedOutstanding: number;
  correctedInterestRate: number;
  daysInArrears: number;
  scheduleConsistent: boolean;
}

/**
 * Harmonizes loan calculation data across all components
 * Ensures consistent interest rates, outstanding balances, and schedule calculations
 */
export async function harmonizeLoanCalculations(loan: LoanCalculationData): Promise<HarmonizedLoanCalculation> {
  try {
    // Step 1: Preserve loan's original interest rate - NEVER use product default
    // Only normalize format (decimal to percentage) but keep the original rate value
    const correctedInterestRate = normalizeInterestRate(loan.interest_rate);

    // Step 2: Fetch current loan schedule
    const { data: currentSchedule, error: scheduleError } = await supabase
      .from('loan_schedules')
      .select('*')
      .eq('loan_id', loan.id)
      .order('installment_number');

    if (scheduleError) {
      console.error('Error fetching loan schedule:', scheduleError);
      throw new Error('Failed to fetch loan schedule');
    }

    // Step 3: Fetch all payments made
    const { data: payments, error: paymentsError } = await supabase
      .from('loan_payments')
      .select('*')
      .eq('loan_id', loan.id)
      .order('payment_date');

    if (paymentsError) {
      console.error('Error fetching loan payments:', paymentsError);
      throw new Error('Failed to fetch loan payments');
    }

    const totalPaidAmount = payments?.reduce((sum, payment) => sum + Number(payment.payment_amount || 0), 0) || 0;

    // Step 4: Check if schedule needs regeneration
    const scheduleConsistent = validateScheduleConsistency(currentSchedule, loan, correctedInterestRate);

    if (!scheduleConsistent) {
      // Regenerate schedule with correct parameters
      await regenerateConsistentSchedule(loan, correctedInterestRate);
      
      // Fetch updated schedule
      const { data: newSchedule } = await supabase
        .from('loan_schedules')
        .select('*')
        .eq('loan_id', loan.id)
        .order('installment_number');
      
      // Reallocate payments to new schedule
      if (newSchedule && payments && payments.length > 0) {
        await reallocatePaymentsToSchedule(loan.id, newSchedule, payments);
      }
    }

    // Step 5: Calculate accurate outstanding balance
    const { data: finalSchedule } = await supabase
      .from('loan_schedules')
      .select('*')
      .eq('loan_id', loan.id)
      .order('installment_number');

    const totalScheduledAmount = finalSchedule?.reduce((sum, entry) => 
      sum + Number(entry.total_amount || 0), 0) || 0;
    
    const calculatedOutstanding = Math.max(0, totalScheduledAmount - totalPaidAmount);

    // Step 6: Calculate days in arrears
    const daysInArrears = calculateDaysInArrears(finalSchedule);

    // Step 7: Update loan record with corrected values
    await supabase
      .from('loans')
      .update({
        interest_rate: correctedInterestRate / 100, // Store as decimal
        outstanding_balance: calculatedOutstanding,
        updated_at: new Date().toISOString()
      })
      .eq('id', loan.id);

    return {
      totalScheduledAmount,
      totalPaidAmount,
      calculatedOutstanding,
      correctedInterestRate,
      daysInArrears,
      scheduleConsistent
    };

  } catch (error) {
    console.error('Error harmonizing loan calculations:', error);
    throw error;
  }
}

/**
 * Normalizes interest rate to ensure it's displayed correctly
 * CRITICAL: Always preserves the loan's original interest rate from creation
 * Only converts between decimal and percentage formats, never changes the actual rate
 */
function normalizeInterestRate(currentRate: number, productDefaultRate?: number): number {
  // PRESERVE LOAN TERMS: Never replace loan's original rate with product default
  // The loan should maintain its creation-time interest rate throughout its lifecycle
  
  // Enhanced logic to handle various interest rate formats consistently
  if (currentRate <= 0.01) {
    // Very small decimal (0.0067 for 0.67%)
    return currentRate * 100;
  } else if (currentRate <= 1) {
    // Decimal format (0.067 for 6.7% or 0.12 for 12%)
    return currentRate * 100;
  } else if (currentRate > 100) {
    // Likely error: 1200 instead of 12%
    return currentRate / 100;
  } else {
    // Already in percentage form (6.7% or 12%)
    return currentRate;
  }
}

/**
 * Validates if the current schedule is consistent with loan parameters
 */
function validateScheduleConsistency(
  schedule: any[], 
  loan: LoanCalculationData, 
  correctedInterestRate: number
): boolean {
  if (!schedule || schedule.length === 0) return false;

  // Check if schedule frequency matches product frequency
  if (schedule.length >= 2) {
    const firstDue = new Date(schedule[0].due_date);
    const secondDue = new Date(schedule[1].due_date);
    const daysBetween = Math.abs((secondDue.getTime() - firstDue.getTime()) / (1000 * 3600 * 24));
    
    const expectedDays = getExpectedDaysBetweenPayments(loan.loan_products.repayment_frequency);
    
    if (Math.abs(daysBetween - expectedDays) > 1) {
      return false;
    }
  }

  // Check if interest calculation seems reasonable
  const totalInterest = schedule.reduce((sum, entry) => sum + Number(entry.interest_amount || 0), 0);
  const principal = Number(loan.principal_amount);
  const annualRate = correctedInterestRate / 100;
  const termYears = Number(loan.term_months) / 12;
  
  // Rough check: total interest shouldn't be more than 3x principal for reasonable rates
  const maxExpectedInterest = principal * annualRate * termYears * 3;
  
  if (totalInterest > maxExpectedInterest) {
    return false;
  }

  return true;
}

/**
 * Gets expected days between payments based on frequency
 */
function getExpectedDaysBetweenPayments(frequency: string): number {
  switch (frequency) {
    case 'daily': return 1;
    case 'weekly': return 7;
    case 'bi-weekly': return 14;
    case 'monthly': return 30;
    case 'quarterly': return 90;
    default: return 30;
  }
}

/**
 * Regenerates loan schedule with consistent parameters
 */
async function regenerateConsistentSchedule(loan: LoanCalculationData, correctedInterestRate: number): Promise<void> {
  // Delete existing schedule
  await supabase
    .from('loan_schedules')
    .delete()
    .eq('loan_id', loan.id);

  // Generate new schedule with corrected parameters
  const scheduleParams: LoanScheduleParams = {
    loanId: loan.id,
    principal: Number(loan.principal_amount),
    interestRate: correctedInterestRate / 100, // Convert to decimal for calculation
    termMonths: Number(loan.term_months),
    disbursementDate: loan.disbursement_date,
    repaymentFrequency: (loan.loan_products.repayment_frequency || 'monthly') as any,
    calculationMethod: (loan.loan_products.interest_calculation_method || 'reducing_balance') as any,
  };

  const newSchedule = generateLoanSchedule(scheduleParams);

  // Insert new schedule
  const { error: insertError } = await supabase
    .from('loan_schedules')
    .insert(newSchedule);

  if (insertError) {
    throw new Error(`Failed to insert new schedule: ${insertError.message}`);
  }
}

/**
 * Reallocates existing payments to new schedule entries
 */
async function reallocatePaymentsToSchedule(
  loanId: string, 
  schedule: any[], 
  payments: any[]
): Promise<void> {
  const totalPaidAmount = payments.reduce((sum, payment) => sum + Number(payment.payment_amount || 0), 0);
  
  let remainingPayment = totalPaidAmount;
  const scheduleUpdates = [];

  for (const scheduleEntry of schedule) {
    if (remainingPayment <= 0) break;

    const scheduleTotal = Number(scheduleEntry.total_amount);
    const paymentForThisSchedule = Math.min(remainingPayment, scheduleTotal);
    const newOutstandingAmount = Math.max(0, scheduleTotal - paymentForThisSchedule);

    scheduleUpdates.push({
      id: scheduleEntry.id,
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

/**
 * Calculates days in arrears based on overdue schedule entries
 */
function calculateDaysInArrears(schedule: any[]): number {
  if (!schedule || schedule.length === 0) return 0;

  const today = new Date();
  const overdueEntries = schedule.filter(entry => {
    const dueDate = new Date(entry.due_date);
    return dueDate < today && entry.payment_status !== 'paid';
  });

  if (overdueEntries.length === 0) return 0;

  // Find the earliest overdue payment
  const earliestOverdue = overdueEntries.reduce((earliest, entry) => {
    const entryDue = new Date(entry.due_date);
    const earliestDue = new Date(earliest.due_date);
    return entryDue < earliestDue ? entry : earliest;
  }, overdueEntries[0]);

  const earliestDueDate = new Date(earliestOverdue.due_date);
  return Math.floor((today.getTime() - earliestDueDate.getTime()) / (1000 * 3600 * 24));
}

/**
 * Hook to trigger loan calculation harmonization
 */
export function useHarmonizeLoanCalculations() {
  return {
    harmonizeLoan: harmonizeLoanCalculations
  };
}
