import { addMonths, addWeeks, addDays, format } from 'date-fns';

export interface LoanScheduleParams {
  loanId: string;
  principal: number;
  interestRate: number; // Annual rate as decimal (e.g., 0.15 for 15%)
  termMonths: number;
  disbursementDate: string;
  repaymentFrequency: 'daily' | 'weekly' | 'bi-weekly' | 'monthly' | 'quarterly';
  calculationMethod: 'reducing_balance' | 'flat_rate' | 'declining_balance';
  firstPaymentDate?: string; // Optional, defaults to one period after disbursement
  disbursementFees?: Array<{ name: string; amount: number; charge_time_type: string }>; // Disbursement-level fees
  installmentFees?: Array<{ name: string; amount: number; charge_time_type: string }>; // Per-installment fees
  // Enhanced MiFos X compatible settings
  daysInYearType?: '360' | '365' | 'actual';
  daysInMonthType?: '30' | 'actual';
  amortizationMethod?: 'equal_installments' | 'equal_principal';
}

export interface LoanScheduleEntry {
  loan_id: string;
  installment_number: number;
  due_date: string;
  principal_amount: number;
  interest_amount: number;
  fee_amount: number;
  total_amount: number;
  paid_amount: number;
  outstanding_amount: number;
  payment_status: 'unpaid';
}

export function generateLoanSchedule(params: LoanScheduleParams): LoanScheduleEntry[] {
  const {
    loanId,
    principal,
    interestRate,
    termMonths,
    disbursementDate,
    repaymentFrequency = 'monthly',
    calculationMethod = 'reducing_balance',
    firstPaymentDate,
    disbursementFees = [],
    installmentFees = [],
    daysInYearType = '365',
    daysInMonthType = 'actual',
    amortizationMethod = 'equal_installments'
  } = params;

  const schedule: LoanScheduleEntry[] = [];
  const startDate = new Date(disbursementDate);
  
  // CRITICAL: Interest rate should be in decimal format (e.g., 0.12 for 12%)
  // The interestRate parameter should already be normalized before this function
  let normalizedRate = interestRate;
  
  // Safety check: if rate is suspiciously high, it might be in wrong format
  if (normalizedRate > 0.5) { // More than 50% is unusual for normal loans
    console.warn(`Very high interest rate detected: ${interestRate}. Double-check rate format.`);
  }
  
  // Calculate number of payments based on frequency and term
  const paymentsPerYear = getPaymentsPerYear(repaymentFrequency);
  let totalPayments;
  
  // For daily frequency, use termMonths as days directly
  if (repaymentFrequency === 'daily') {
    totalPayments = termMonths; // termMonths represents days for daily frequency
  } else {
    totalPayments = Math.ceil((termMonths / 12) * paymentsPerYear);
  }
  
  // Calculate periodic rate using MiFos X compatible days convention
  const daysInYear = getDaysInYear(daysInYearType, startDate);
  const periodicRate = calculatePeriodicRate(normalizedRate, repaymentFrequency, daysInYear, paymentsPerYear);

  // Calculate first payment date
  let nextPaymentDate = firstPaymentDate ? new Date(firstPaymentDate) : getNextPaymentDate(startDate, repaymentFrequency);
  
  let remainingBalance = principal;

  for (let i = 1; i <= totalPayments; i++) {
    let principalAmount = 0;
    let interestAmount = 0;

    if (calculationMethod === 'reducing_balance' || calculationMethod === 'declining_balance') {
      // Reducing/Declining balance method with amortization options
      if (periodicRate > 0) {
        if (amortizationMethod === 'equal_installments') {
          // Equal total payments (PMT calculation)
          const monthlyPayment = calculateMonthlyPayment(principal, periodicRate, totalPayments);
          interestAmount = remainingBalance * periodicRate;
          principalAmount = monthlyPayment - interestAmount;
        } else if (amortizationMethod === 'equal_principal') {
          // Equal principal payments
          principalAmount = principal / totalPayments;
          interestAmount = remainingBalance * periodicRate;
        }
        
        // Ensure principal doesn't exceed remaining balance for last payment
        if (i === totalPayments || principalAmount > remainingBalance) {
          principalAmount = remainingBalance;
          // Interest should be calculated on remaining balance before payment, not on principal amount
          interestAmount = remainingBalance * periodicRate;
        }
      } else {
        // Zero interest rate
        principalAmount = principal / totalPayments;
        interestAmount = 0;
      }
    } else if (calculationMethod === 'flat_rate') {
      // Flat rate method - interest calculated on original principal
      principalAmount = principal / totalPayments;
      
      // Use new flat rate formula: interest = original principal * rate% / (12 * actual days in month)
      const daysInCurrentMonth = new Date(nextPaymentDate.getFullYear(), nextPaymentDate.getMonth() + 1, 0).getDate();
      interestAmount = principal * normalizedRate / (12 * daysInCurrentMonth);
    } else {
      // Default to equal principal installments
      principalAmount = principal / totalPayments;
      interestAmount = remainingBalance * periodicRate;
    }

    // Round amounts to 2 decimal places
    principalAmount = Math.round(principalAmount * 100) / 100;
    interestAmount = Math.round(interestAmount * 100) / 100;

    // Calculate fees for this installment
    let feeAmount = 0;
    
    // Add disbursement fees to first installment only
    if (i === 1) {
      feeAmount += disbursementFees.reduce((sum, fee) => sum + Number(fee.amount || 0), 0);
    }
    
    // Add per-installment fees
    feeAmount += installmentFees.reduce((sum, fee) => sum + Number(fee.amount || 0), 0);
    
    feeAmount = Math.round(feeAmount * 100) / 100;

    const totalAmount = principalAmount + interestAmount + feeAmount;
    remainingBalance = Math.max(0, remainingBalance - principalAmount);

    const scheduleEntry: LoanScheduleEntry = {
      loan_id: loanId,
      installment_number: i,
      due_date: format(nextPaymentDate, 'yyyy-MM-dd'),
      principal_amount: principalAmount,
      interest_amount: interestAmount,
      fee_amount: feeAmount,
      total_amount: totalAmount,
      paid_amount: 0,
      outstanding_amount: totalAmount,
      payment_status: 'unpaid' as const,
    };

    schedule.push(scheduleEntry);

    // Calculate next payment date
    nextPaymentDate = getNextPaymentDate(nextPaymentDate, repaymentFrequency);
  }

  return schedule;
}

function getPaymentsPerYear(frequency: string): number {
  switch (frequency) {
    case 'daily':
      return 365;
    case 'weekly':
      return 52;
    case 'bi-weekly':
      return 26;
    case 'monthly':
      return 12;
    case 'quarterly':
      return 4;
    default:
      return 12;
  }
}

function getNextPaymentDate(currentDate: Date, frequency: string): Date {
  switch (frequency) {
    case 'daily':
      return addDays(currentDate, 1);
    case 'weekly':
      return addWeeks(currentDate, 1);
    case 'bi-weekly':
      return addWeeks(currentDate, 2);
    case 'monthly':
      return addMonths(currentDate, 1);
    case 'quarterly':
      return addMonths(currentDate, 3);
    default:
      return addMonths(currentDate, 1);
  }
}

function calculateMonthlyPayment(principal: number, periodicRate: number, totalPayments: number): number {
  if (periodicRate === 0) {
    return principal / totalPayments;
  }
  
  return (principal * periodicRate * Math.pow(1 + periodicRate, totalPayments)) / 
         (Math.pow(1 + periodicRate, totalPayments) - 1);
}

// Enhanced helper functions for MiFos X compatibility
function getDaysInYear(daysInYearType: string, referenceDate: Date): number {
  switch (daysInYearType) {
    case '360':
      return 360;
    case '365':
      return 365;
    case 'actual':
      const year = referenceDate.getFullYear();
      return (year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)) ? 366 : 365;
    default:
      return 365;
  }
}

function calculatePeriodicRate(annualRate: number, frequency: string, daysInYear: number, paymentsPerYear: number): number {
  // CRITICAL: Ensure proper periodic rate calculation
  // annualRate should be in decimal format (e.g., 0.12 for 12% annual)
  
  console.log(`Calculating periodic rate: annual=${annualRate}, frequency=${frequency}, daysInYear=${daysInYear}, paymentsPerYear=${paymentsPerYear}`);
  
  let periodicRate;
  if (frequency === 'daily') {
    periodicRate = annualRate / daysInYear;
  } else {
    periodicRate = annualRate / paymentsPerYear;
  }
  
  console.log(`Calculated periodic rate: ${periodicRate} (${(periodicRate * 100).toFixed(4)}%)`);
  
  // Safety check: periodic rate should be reasonable
  if (periodicRate > 0.1) { // More than 10% per period is suspicious
    console.error(`WARNING: Very high periodic rate calculated: ${periodicRate}. Check input data.`);
  }
  
  return periodicRate;
}

// Helper function to recalculate outstanding amounts after payments
export function recalculateScheduleOutstanding(
  schedule: LoanScheduleEntry[],
  payments: Array<{ schedule_id?: string; principal_amount: number; interest_amount: number; fee_amount: number }>
): LoanScheduleEntry[] {
  const updatedSchedule = [...schedule];
  
  payments.forEach(payment => {
    if (payment.schedule_id) {
      const scheduleIndex = updatedSchedule.findIndex(s => s.loan_id === payment.schedule_id);
      if (scheduleIndex >= 0) {
        const entry = updatedSchedule[scheduleIndex];
        entry.paid_amount += payment.principal_amount + payment.interest_amount + payment.fee_amount;
        entry.outstanding_amount = Math.max(0, entry.total_amount - entry.paid_amount);
        entry.payment_status = entry.outstanding_amount === 0 ? 'paid' as any : 
                              entry.paid_amount > 0 ? 'partial' as any : 'unpaid';
      }
    }
  });
  
  return updatedSchedule;
}