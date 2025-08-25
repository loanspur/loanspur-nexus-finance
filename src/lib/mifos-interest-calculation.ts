/**
 * Mifos X Unified Interest Calculation System
 * 
 * This module provides standardized interest calculation functions
 * that follow Mifos X standards for daily, weekly, and monthly payments.
 * 
 * Mifos X Standards:
 * - Interest calculation period types: Daily, Weekly, Monthly
 * - Interest types: Declining Balance, Flat Rate
 * - Amortization types: Equal Installments, Equal Principal
 * - Days calculation: 360, 365, Actual
 */

export interface MifosInterestParams {
  principal: number;
  annualInterestRate: number; // As percentage (e.g., 12 for 12%)
  termInPeriods: number; // Number of payment periods
  repaymentFrequency: 'daily' | 'weekly' | 'monthly';
  interestType: 'declining_balance' | 'flat_rate';
  amortizationType: 'equal_installments' | 'equal_principal';
  daysInYearType: '360' | '365' | 'actual';
  daysInMonthType: '30' | 'actual';
  disbursementDate: Date;
  firstPaymentDate?: Date;
  gracePeriodDays?: number;
  gracePeriodType?: 'none' | 'principal_only' | 'interest_only' | 'principal_and_interest';
}

export interface MifosScheduleEntry {
  installmentNumber: number;
  dueDate: Date;
  principalAmount: number;
  interestAmount: number;
  feeAmount: number;
  totalAmount: number;
  outstandingBalance: number;
  daysInPeriod: number;
  isGracePeriod: boolean;
}

export interface MifosInterestResult {
  schedule: MifosScheduleEntry[];
  totalInterest: number;
  totalPrincipal: number;
  totalFees: number;
  totalAmount: number;
  periodicPayment: number; // For equal installments
}

/**
 * Calculate days in year based on Mifos X standards
 */
function getDaysInYear(daysInYearType: '360' | '365' | 'actual', startDate: Date): number {
  switch (daysInYearType) {
    case '360':
      return 360;
    case '365':
      return 365;
    case 'actual':
      const year = startDate.getFullYear();
      return ((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0) ? 366 : 365;
    default:
      return 365;
  }
}

/**
 * Calculate days in month based on Mifos X standards
 */
function getDaysInMonth(daysInMonthType: '30' | 'actual', date: Date): number {
  switch (daysInMonthType) {
    case '30':
      return 30;
    case 'actual':
      return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    default:
      return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  }
}

/**
 * Calculate periodic interest rate based on Mifos X standards
 */
function calculatePeriodicRate(
  annualRate: number,
  repaymentFrequency: 'daily' | 'weekly' | 'monthly',
  daysInYear: number
): number {
  const annualRateDecimal = annualRate / 100;
  
  switch (repaymentFrequency) {
    case 'daily':
      return annualRateDecimal / daysInYear;
    case 'weekly':
      return (annualRateDecimal / daysInYear) * 7;
    case 'monthly':
      return annualRateDecimal / 12;
    default:
      return annualRateDecimal / 12;
  }
}

/**
 * Calculate daily interest for savings accounts
 * This is a simple daily interest calculation used for savings products
 */
export function calculateDailyInterest(
  principal: number,
  annualInterestRate: number,
  daysInYear: number = 365
): number {
  if (principal <= 0 || annualInterestRate <= 0) return 0;
  
  const dailyRate = (annualInterestRate / 100) / daysInYear;
  return principal * dailyRate;
}

/**
 * Calculate reducing balance interest for loans
 * This is a legacy function for backward compatibility
 */
export function calculateReducingBalanceInterest(params: {
  principal: number;
  annualRate: number;
  termInMonths: number;
  calculationMethod?: string;
}): {
  monthlyPayment: number;
  totalInterest: number;
  totalPayment: number;
} {
  const { principal, annualRate, termInMonths } = params;
  
  if (principal <= 0 || annualRate <= 0 || termInMonths <= 0) {
    return { monthlyPayment: 0, totalInterest: 0, totalPayment: 0 };
  }
  
  const monthlyRate = (annualRate / 100) / 12;
  const monthlyPayment = (principal * monthlyRate * Math.pow(1 + monthlyRate, termInMonths)) / 
                        (Math.pow(1 + monthlyRate, termInMonths) - 1);
  const totalPayment = monthlyPayment * termInMonths;
  const totalInterest = totalPayment - principal;
  
  return { monthlyPayment, totalInterest, totalPayment };
}

/**
 * Calculate monthly interest for loans
 * This is a legacy function for backward compatibility
 */
export function calculateMonthlyInterest(
  principal: number,
  annualInterestRate: number
): number {
  if (principal <= 0 || annualInterestRate <= 0) return 0;
  
  const monthlyRate = (annualInterestRate / 100) / 12;
  return principal * monthlyRate;
}

/**
 * Calculate flat rate interest for loans
 * This is a legacy function for backward compatibility
 */
export function calculateFlatRateInterest(
  principal: number,
  annualInterestRate: number,
  termInMonths: number
): number {
  if (principal <= 0 || annualInterestRate <= 0 || termInMonths <= 0) return 0;
  
  const totalInterest = (principal * (annualInterestRate / 100) * termInMonths) / 12;
  return totalInterest;
}

/**
 * Calculate days between two dates
 */
function getDaysBetween(startDate: Date, endDate: Date): number {
  const timeDiff = endDate.getTime() - startDate.getTime();
  return Math.ceil(timeDiff / (1000 * 3600 * 24));
}

/**
 * Calculate next payment date based on frequency
 */
function getNextPaymentDate(currentDate: Date, frequency: 'daily' | 'weekly' | 'monthly'): Date {
  const nextDate = new Date(currentDate);
  
  switch (frequency) {
    case 'daily':
      nextDate.setDate(nextDate.getDate() + 1);
      break;
    case 'weekly':
      nextDate.setDate(nextDate.getDate() + 7);
      break;
    case 'monthly':
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
  }
  
  return nextDate;
}

/**
 * Calculate interest for a specific period using Mifos X declining balance method
 */
function calculateDecliningBalanceInterest(
  outstandingBalance: number,
  periodicRate: number,
  daysInPeriod: number,
  daysInYear: number
): number {
  // Mifos X declining balance formula: Interest = Outstanding Balance × Periodic Rate × (Days in Period / Days in Year)
  return outstandingBalance * periodicRate * (daysInPeriod / daysInYear);
}

/**
 * Calculate interest for flat rate method
 */
function calculateFlatRateInterestForPeriod(
  principal: number,
  annualRate: number,
  totalPeriods: number,
  currentPeriod: number
): number {
  const totalInterest = (principal * (annualRate / 100) * totalPeriods) / 12;
  return totalInterest / totalPeriods; // Equal interest per period
}

/**
 * Generate loan schedule using Mifos X standards
 */
export function generateMifosLoanSchedule(params: MifosInterestParams): MifosInterestResult {
  const {
    principal,
    annualInterestRate,
    termInPeriods,
    repaymentFrequency,
    interestType,
    amortizationType,
    daysInYearType,
    daysInMonthType,
    disbursementDate,
    firstPaymentDate,
    gracePeriodDays = 0,
    gracePeriodType = 'none'
  } = params;

  const schedule: MifosScheduleEntry[] = [];
  const daysInYear = getDaysInYear(daysInYearType, disbursementDate);
  const periodicRate = calculatePeriodicRate(annualInterestRate, repaymentFrequency, daysInYear);
  
  let currentDate = firstPaymentDate || getNextPaymentDate(disbursementDate, repaymentFrequency);
  let outstandingBalance = principal;
  let totalInterest = 0;
  let totalFees = 0;

  // Calculate periodic payment for equal installments
  let periodicPayment = 0;
  if (amortizationType === 'equal_installments' && interestType === 'declining_balance') {
    if (periodicRate === 0) {
      periodicPayment = principal / termInPeriods;
    } else {
      periodicPayment = principal * (periodicRate * Math.pow(1 + periodicRate, termInPeriods)) / 
                       (Math.pow(1 + periodicRate, termInPeriods) - 1);
    }
  }

  for (let i = 1; i <= termInPeriods; i++) {
    const isGracePeriod = i <= Math.ceil(gracePeriodDays / getDaysBetween(disbursementDate, currentDate));
    const prevDate = i === 1 ? disbursementDate : schedule[i - 2]?.dueDate || disbursementDate;
    const daysInPeriod = getDaysBetween(prevDate, currentDate);

    let principalAmount = 0;
    let interestAmount = 0;

    // Calculate principal amount
    if (amortizationType === 'equal_principal') {
      principalAmount = principal / termInPeriods;
    } else if (amortizationType === 'equal_installments') {
      if (interestType === 'declining_balance') {
        interestAmount = calculateDecliningBalanceInterest(outstandingBalance, periodicRate, daysInPeriod, daysInYear);
        principalAmount = periodicPayment - interestAmount;
      } else {
        // Flat rate with equal installments
        interestAmount = calculateFlatRateInterestForPeriod(principal, annualInterestRate, termInPeriods, i);
        const totalPayment = (principal + (interestAmount * termInPeriods)) / termInPeriods;
        principalAmount = totalPayment - interestAmount;
      }
    }

    // Handle grace period
    if (isGracePeriod) {
      switch (gracePeriodType) {
        case 'principal_only':
          principalAmount = 0;
          break;
        case 'interest_only':
          interestAmount = 0;
          break;
        case 'principal_and_interest':
          principalAmount = 0;
          interestAmount = 0;
          break;
        case 'none':
        default:
          // No grace period, calculate normally
          break;
      }
    }

    // Ensure principal doesn't exceed outstanding balance
    if (principalAmount > outstandingBalance) {
      principalAmount = outstandingBalance;
    }

    // Update outstanding balance
    outstandingBalance = Math.max(0, outstandingBalance - principalAmount);

    const totalAmount = principalAmount + interestAmount;
    totalInterest += interestAmount;

    schedule.push({
      installmentNumber: i,
      dueDate: new Date(currentDate),
      principalAmount: Math.round(principalAmount * 100) / 100,
      interestAmount: Math.round(interestAmount * 100) / 100,
      feeAmount: 0, // Fees can be added separately
      totalAmount: Math.round(totalAmount * 100) / 100,
      outstandingBalance: Math.round(outstandingBalance * 100) / 100,
      daysInPeriod,
      isGracePeriod
    });

    // Move to next payment date
    currentDate = getNextPaymentDate(currentDate, repaymentFrequency);
  }

  return {
    schedule,
    totalInterest: Math.round(totalInterest * 100) / 100,
    totalPrincipal: principal,
    totalFees: totalFees,
    totalAmount: principal + totalInterest + totalFees,
    periodicPayment: Math.round(periodicPayment * 100) / 100
  };
}

/**
 * Calculate daily interest for a specific date using Mifos X standards
 */
export function calculateMifosDailyInterest(
  outstandingBalance: number,
  annualRate: number,
  date: Date,
  daysInYearType: '360' | '365' | 'actual' = '365'
): number {
  const daysInYear = getDaysInYear(daysInYearType, date);
  const dailyRate = (annualRate / 100) / daysInYear;
  return outstandingBalance * dailyRate;
}

/**
 * Calculate weekly interest using Mifos X standards
 */
export function calculateMifosWeeklyInterest(
  outstandingBalance: number,
  annualRate: number,
  startDate: Date,
  endDate: Date,
  daysInYearType: '360' | '365' | 'actual' = '365'
): number {
  const daysInYear = getDaysInYear(daysInYearType, startDate);
  const daysInPeriod = getDaysBetween(startDate, endDate);
  const periodicRate = (annualRate / 100) * (daysInPeriod / daysInYear);
  return outstandingBalance * periodicRate;
}

/**
 * Calculate monthly interest using Mifos X standards
 */
export function calculateMifosMonthlyInterest(
  outstandingBalance: number,
  annualRate: number,
  date: Date,
  daysInMonthType: '30' | 'actual' = 'actual',
  daysInYearType: '360' | '365' | 'actual' = '365'
): number {
  const daysInYear = getDaysInYear(daysInYearType, date);
  const daysInMonth = getDaysInMonth(daysInMonthType, date);
  const monthlyRate = (annualRate / 100) * (daysInMonth / daysInYear);
  return outstandingBalance * monthlyRate;
}

/**
 * Validate loan parameters according to Mifos X standards
 */
export function validateMifosLoanParams(params: MifosInterestParams): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (params.principal <= 0) {
    errors.push('Principal amount must be greater than zero');
  }

  if (params.annualInterestRate < 0 || params.annualInterestRate > 100) {
    errors.push('Annual interest rate must be between 0 and 100 percent');
  }

  if (params.termInPeriods <= 0) {
    errors.push('Term in periods must be greater than zero');
  }

  if (params.gracePeriodDays && params.gracePeriodDays < 0) {
    errors.push('Grace period days cannot be negative');
  }

  if (params.gracePeriodDays && params.gracePeriodDays >= params.termInPeriods) {
    errors.push('Grace period cannot exceed or equal the loan term');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Convert Mifos X schedule to database format
 */
export function convertMifosScheduleToDatabase(
  mifosSchedule: MifosScheduleEntry[],
  loanId: string
): Array<{
  loan_id: string;
  installment_number: number;
  due_date: string;
  principal_amount: number;
  interest_amount: number;
  fee_amount: number;
  total_amount: number;
  paid_amount: number;
  outstanding_amount: number;
  payment_status: string;
}> {
  return mifosSchedule.map(entry => ({
    loan_id: loanId,
    installment_number: entry.installmentNumber,
    due_date: entry.dueDate.toISOString().split('T')[0],
    principal_amount: entry.principalAmount,
    interest_amount: entry.interestAmount,
    fee_amount: entry.feeAmount,
    total_amount: entry.totalAmount,
    paid_amount: 0,
    outstanding_amount: entry.totalAmount,
    payment_status: 'unpaid'
  }));
}

/**
 * Repayment Strategy Types
 */
export type RepaymentStrategyType = 
  | 'penalties_fees_interest_principal'
  | 'fees_interest_principal'
  | 'interest_principal'
  | 'principal_only'
  | 'custom';

/**
 * Loan Balances Interface
 */
export interface LoanBalances {
  outstandingPrincipal: number;
  unpaidInterest: number;
  unpaidFees: number;
  unpaidPenalties: number;
}

/**
 * Repayment Allocation Result
 */
export interface RepaymentAllocation {
  principal: number;
  interest: number;
  fees: number;
  penalties: number;
}

/**
 * Allocate repayment amount according to specified strategy
 * This function determines how a payment should be distributed across
 * principal, interest, fees, and penalties based on the repayment strategy
 */
export function allocateRepayment(
  paymentAmount: number,
  loanBalances: LoanBalances,
  strategy: RepaymentStrategyType
): RepaymentAllocation {
  let remainingAmount = paymentAmount;
  const allocation: RepaymentAllocation = {
    principal: 0,
    interest: 0,
    fees: 0,
    penalties: 0
  };

  switch (strategy) {
    case 'penalties_fees_interest_principal':
      // 1. Pay penalties first
      if (remainingAmount > 0 && loanBalances.unpaidPenalties > 0) {
        allocation.penalties = Math.min(remainingAmount, loanBalances.unpaidPenalties);
        remainingAmount -= allocation.penalties;
      }
      
      // 2. Pay fees
      if (remainingAmount > 0 && loanBalances.unpaidFees > 0) {
        allocation.fees = Math.min(remainingAmount, loanBalances.unpaidFees);
        remainingAmount -= allocation.fees;
      }
      
      // 3. Pay interest
      if (remainingAmount > 0 && loanBalances.unpaidInterest > 0) {
        allocation.interest = Math.min(remainingAmount, loanBalances.unpaidInterest);
        remainingAmount -= allocation.interest;
      }
      
      // 4. Pay principal
      if (remainingAmount > 0 && loanBalances.outstandingPrincipal > 0) {
        allocation.principal = Math.min(remainingAmount, loanBalances.outstandingPrincipal);
        remainingAmount -= allocation.principal;
      }
      break;

    case 'fees_interest_principal':
      // 1. Pay fees first
      if (remainingAmount > 0 && loanBalances.unpaidFees > 0) {
        allocation.fees = Math.min(remainingAmount, loanBalances.unpaidFees);
        remainingAmount -= allocation.fees;
      }
      
      // 2. Pay interest
      if (remainingAmount > 0 && loanBalances.unpaidInterest > 0) {
        allocation.interest = Math.min(remainingAmount, loanBalances.unpaidInterest);
        remainingAmount -= allocation.interest;
      }
      
      // 3. Pay principal
      if (remainingAmount > 0 && loanBalances.outstandingPrincipal > 0) {
        allocation.principal = Math.min(remainingAmount, loanBalances.outstandingPrincipal);
        remainingAmount -= allocation.principal;
      }
      break;

    case 'interest_principal':
      // 1. Pay interest first
      if (remainingAmount > 0 && loanBalances.unpaidInterest > 0) {
        allocation.interest = Math.min(remainingAmount, loanBalances.unpaidInterest);
        remainingAmount -= allocation.interest;
      }
      
      // 2. Pay principal
      if (remainingAmount > 0 && loanBalances.outstandingPrincipal > 0) {
        allocation.principal = Math.min(remainingAmount, loanBalances.outstandingPrincipal);
        remainingAmount -= allocation.principal;
      }
      break;

    case 'principal_only':
      // Pay only principal
      if (remainingAmount > 0 && loanBalances.outstandingPrincipal > 0) {
        allocation.principal = Math.min(remainingAmount, loanBalances.outstandingPrincipal);
        remainingAmount -= allocation.principal;
      }
      break;

    case 'custom':
      // For custom strategies, return zero allocation
      // The calling code should handle custom allocation logic
      break;

    default:
      // Default to penalties_fees_interest_principal
      return allocateRepayment(paymentAmount, loanBalances, 'penalties_fees_interest_principal');
  }

  return allocation;
}

/**
 * Harmonized Loan Calculation Interface
 * Used for ensuring consistency across loan display components
 */
export interface HarmonizedLoanCalculation {
  calculatedOutstanding: number;
  correctedInterestRate: number;
  daysInArrears: number;
  scheduleConsistent: boolean;
  totalScheduledAmount: number;
  totalPaidAmount: number;
  lastPaymentDate?: Date;
  nextPaymentDate?: Date;
}

/**
 * Harmonize loan calculations to ensure consistency
 * This function validates and corrects loan data for display purposes
 */
export function harmonizeLoanCalculations(loan: any): HarmonizedLoanCalculation {
  // Calculate outstanding balance from schedules if available
  let calculatedOutstanding = Number(loan.outstanding_balance || 0);
  let totalScheduledAmount = 0;
  let totalPaidAmount = 0;
  let daysInArrears = 0;
  let scheduleConsistent = true;

  // If loan has schedules, calculate from them for accuracy
  if (loan.loan_schedules && Array.isArray(loan.loan_schedules)) {
    totalScheduledAmount = loan.loan_schedules.reduce((sum: number, schedule: any) => 
      sum + Number(schedule.total_amount || 0), 0);
    
    totalPaidAmount = loan.loan_schedules.reduce((sum: number, schedule: any) => 
      sum + Number(schedule.paid_amount || 0), 0);
    
    calculatedOutstanding = totalScheduledAmount - totalPaidAmount;
    
    // Check for schedule consistency
    const expectedOutstanding = Number(loan.outstanding_balance || 0);
    const difference = Math.abs(calculatedOutstanding - expectedOutstanding);
    scheduleConsistent = difference < 0.01; // Allow for rounding differences
  }

  // Calculate days in arrears
  if (loan.loan_schedules && Array.isArray(loan.loan_schedules)) {
    const today = new Date();
    const overdueSchedules = loan.loan_schedules.filter((schedule: any) => {
      const dueDate = new Date(schedule.due_date);
      return dueDate < today && Number(schedule.outstanding_amount || 0) > 0;
    });

    if (overdueSchedules.length > 0) {
      const mostOverdue = overdueSchedules.reduce((latest: any, current: any) => {
        const latestDate = new Date(latest.due_date);
        const currentDate = new Date(current.due_date);
        return currentDate < latestDate ? current : latest;
      });
      
      const dueDate = new Date(mostOverdue.due_date);
      const timeDiff = today.getTime() - dueDate.getTime();
      daysInArrears = Math.ceil(timeDiff / (1000 * 3600 * 24));
    }
  }

  // Get corrected interest rate (ensure it's within valid range)
  let correctedInterestRate = Number(loan.interest_rate || 0);
  if (correctedInterestRate < 0) correctedInterestRate = 0;
  if (correctedInterestRate > 100) correctedInterestRate = 100;

  // Find last and next payment dates
  let lastPaymentDate: Date | undefined;
  let nextPaymentDate: Date | undefined;

  if (loan.loan_schedules && Array.isArray(loan.loan_schedules)) {
    const paidSchedules = loan.loan_schedules.filter((schedule: any) => 
      Number(schedule.paid_amount || 0) > 0);
    
    if (paidSchedules.length > 0) {
      const lastPaid = paidSchedules.reduce((latest: any, current: any) => {
        const latestDate = new Date(latest.due_date);
        const currentDate = new Date(current.due_date);
        return currentDate > latestDate ? current : latest;
      });
      lastPaymentDate = new Date(lastPaid.due_date);
    }

    const unpaidSchedules = loan.loan_schedules.filter((schedule: any) => 
      Number(schedule.outstanding_amount || 0) > 0);
    
    if (unpaidSchedules.length > 0) {
      const nextDue = unpaidSchedules.reduce((earliest: any, current: any) => {
        const earliestDate = new Date(earliest.due_date);
        const currentDate = new Date(current.due_date);
        return currentDate < earliestDate ? current : earliest;
      });
      nextPaymentDate = new Date(nextDue.due_date);
    }
  }

  return {
    calculatedOutstanding,
    correctedInterestRate,
    daysInArrears,
    scheduleConsistent,
    totalScheduledAmount,
    totalPaidAmount,
    lastPaymentDate,
    nextPaymentDate
  };
}
