import { addMonths, addWeeks, addDays, format } from 'date-fns';
import { 
  generateMifosLoanSchedule, 
  MifosInterestParams, 
  convertMifosScheduleToDatabase,
  validateMifosLoanParams 
} from './mifos-interest-calculation';

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
  gracePeriodDays?: number;
  gracePeriodType?: 'none' | 'principal_only' | 'interest_only' | 'principal_and_interest';
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
  payment_status: string;
}

/**
 * Generate loan schedule using Mifos X standards
 * This function now uses the unified Mifos X interest calculation system
 */
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
    amortizationMethod = 'equal_installments',
    gracePeriodDays = 0,
    gracePeriodType = 'none'
  } = params;

  // Convert frequency to Mifos X format
  const mifosFrequency = convertFrequencyToMifos(repaymentFrequency);
  
  // Convert calculation method to Mifos X format
  const mifosInterestType = convertCalculationMethodToMifos(calculationMethod);
  
  // Calculate term in periods based on frequency
  const termInPeriods = calculateTermInPeriods(termMonths, repaymentFrequency);

  // Prepare Mifos X parameters
  const mifosParams: MifosInterestParams = {
    principal,
    annualInterestRate: interestRate * 100, // Convert decimal to percentage
    termInPeriods,
    repaymentFrequency: mifosFrequency,
    interestType: mifosInterestType,
    amortizationType: amortizationMethod,
    daysInYearType,
    daysInMonthType,
    disbursementDate: new Date(disbursementDate),
    firstPaymentDate: firstPaymentDate ? new Date(firstPaymentDate) : undefined,
    gracePeriodDays,
    gracePeriodType
  };

  // Validate parameters
  const validation = validateMifosLoanParams(mifosParams);
  if (!validation.valid) {
    throw new Error(`Invalid loan parameters: ${validation.errors.join(', ')}`);
  }

  // Generate schedule using Mifos X system
  const mifosResult = generateMifosLoanSchedule(mifosParams);
  
  // Convert to database format
  const schedule = convertMifosScheduleToDatabase(mifosResult.schedule, loanId);

  // Add fees to the schedule
  const scheduleWithFees = addFeesToSchedule(schedule, disbursementFees, installmentFees);

  return scheduleWithFees;
}

/**
 * Convert frequency to Mifos X format
 */
function convertFrequencyToMifos(frequency: string): 'daily' | 'weekly' | 'monthly' {
  switch (frequency) {
    case 'daily':
      return 'daily';
    case 'weekly':
    case 'bi-weekly':
      return 'weekly';
    case 'monthly':
    case 'quarterly':
      return 'monthly';
    default:
      return 'monthly';
  }
}

/**
 * Convert calculation method to Mifos X format
 */
function convertCalculationMethodToMifos(method: string): 'declining_balance' | 'flat_rate' {
  switch (method) {
    case 'reducing_balance':
    case 'declining_balance':
      return 'declining_balance';
    case 'flat_rate':
      return 'flat_rate';
    default:
      return 'declining_balance';
  }
}

/**
 * Calculate term in periods based on frequency
 */
function calculateTermInPeriods(termMonths: number, frequency: string): number {
  switch (frequency) {
    case 'daily':
      return termMonths; // termMonths represents days for daily frequency
    case 'weekly':
      return Math.ceil((termMonths / 12) * 52); // 52 weeks per year
    case 'bi-weekly':
      return Math.ceil((termMonths / 12) * 26); // 26 bi-weeks per year
    case 'monthly':
      return termMonths;
    case 'quarterly':
      return Math.ceil(termMonths / 3); // 4 quarters per year
    default:
      return termMonths;
  }
}

/**
 * Add fees to the schedule
 */
function addFeesToSchedule(
  schedule: LoanScheduleEntry[],
  disbursementFees: Array<{ name: string; amount: number; charge_time_type: string }>,
  installmentFees: Array<{ name: string; amount: number; charge_time_type: string }>
): LoanScheduleEntry[] {
  if (schedule.length === 0) return schedule;

  const updatedSchedule = [...schedule];

  // Add disbursement fees to first installment
  const totalDisbursementFees = disbursementFees.reduce((sum, fee) => sum + fee.amount, 0);
  if (totalDisbursementFees > 0 && updatedSchedule.length > 0) {
    updatedSchedule[0].fee_amount += totalDisbursementFees;
    updatedSchedule[0].total_amount += totalDisbursementFees;
    updatedSchedule[0].outstanding_amount += totalDisbursementFees;
  }

  // Add installment fees to all installments
  const totalInstallmentFees = installmentFees.reduce((sum, fee) => sum + fee.amount, 0);
  if (totalInstallmentFees > 0) {
    updatedSchedule.forEach(entry => {
      entry.fee_amount += totalInstallmentFees;
      entry.total_amount += totalInstallmentFees;
      entry.outstanding_amount += totalInstallmentFees;
    });
  }

  return updatedSchedule;
}

// Legacy functions for backward compatibility
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

function getDaysInYear(daysInYearType: string, startDate: Date): number {
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

function calculatePeriodicRate(annualRate: number, frequency: string, daysInYear: number, paymentsPerYear: number): number {
  const annualRateDecimal = annualRate;
  
  if (frequency === 'daily') {
    return annualRateDecimal / daysInYear;
  } else {
    return annualRateDecimal / paymentsPerYear;
  }
}

function getPaymentPeriodDays(frequency: string): number {
  switch (frequency) {
    case 'weekly':
      return 7;
    case 'bi-weekly':
      return 14;
    case 'monthly':
      return 30; // Standard month for flat rate calculations
    case 'quarterly':
      return 90; // 3 months
    default:
      return 1; // daily
  }
}

function getNextPaymentDate(startDate: Date, frequency: string): Date {
  switch (frequency) {
    case 'daily':
      return addDays(startDate, 1);
    case 'weekly':
      return addWeeks(startDate, 1);
    case 'bi-weekly':
      return addWeeks(startDate, 2);
    case 'monthly':
      return addMonths(startDate, 1);
    case 'quarterly':
      return addMonths(startDate, 3);
    default:
      return addMonths(startDate, 1);
  }
}

// Helper function to recalculate outstanding amounts after payments
export function recalculateScheduleOutstanding(
  schedule: LoanScheduleEntry[],
  payments: Array<{ schedule_id?: string; principal_amount: number; interest_amount: number; fee_amount: number }>
): LoanScheduleEntry[] {
  const updatedSchedule = [...schedule];
  
  payments.forEach(payment => {
    const scheduleEntry = updatedSchedule.find(entry => entry.installment_number === parseInt(payment.schedule_id || '0'));
    if (scheduleEntry) {
      const totalPaid = payment.principal_amount + payment.interest_amount + payment.fee_amount;
      scheduleEntry.paid_amount = Math.min(scheduleEntry.total_amount, totalPaid);
      scheduleEntry.outstanding_amount = Math.max(0, scheduleEntry.total_amount - scheduleEntry.paid_amount);
      
      if (scheduleEntry.outstanding_amount === 0) {
        scheduleEntry.payment_status = 'paid';
      } else if (scheduleEntry.paid_amount > 0) {
        scheduleEntry.payment_status = 'partial';
      }
    }
  });
  
  return updatedSchedule;
}