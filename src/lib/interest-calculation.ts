/**
 * Unified Interest Calculation Utilities
 * 
 * This module provides standardized interest calculation functions
 * to ensure consistency across the entire system.
 */

export interface InterestCalculationParams {
  principal: number;
  annualRate: number; // As percentage (e.g., 12 for 12%)
  termInMonths: number;
  calculationMethod: 'flat_rate' | 'reducing_balance' | 'declining_balance';
  paymentFrequency?: 'monthly' | 'weekly' | 'daily';
}

export interface InterestCalculationResult {
  dailyInterest: number;
  monthlyInterest: number;
  totalInterest: number;
  monthlyPayment: number;
}

/**
 * Calculates daily interest using the standardized formula:
 * dailyInterest = (Principal × Annual Rate) ÷ (12 × Days in Month)
 * 
 * @param principal - The loan principal amount
 * @param annualRate - Annual interest rate as percentage (e.g., 12 for 12%)
 * @param daysInMonth - Number of days in the current month (default: 30)
 * @returns Daily interest amount
 */
export function calculateDailyInterest(
  principal: number, 
  annualRate: number, 
  daysInMonth: number = 30
): number {
  return (principal * (annualRate / 100)) / (12 * daysInMonth);
}

/**
 * Calculates monthly interest based on daily interest
 * 
 * @param principal - The loan principal amount
 * @param annualRate - Annual interest rate as percentage
 * @param daysInMonth - Number of days in the current month (default: 30)
 * @returns Monthly interest amount
 */
export function calculateMonthlyInterest(
  principal: number, 
  annualRate: number, 
  daysInMonth: number = 30
): number {
  const dailyInterest = calculateDailyInterest(principal, annualRate, daysInMonth);
  return dailyInterest * daysInMonth;
}

/**
 * Calculates interest for flat rate loans using the unified formula
 * 
 * @param params - Interest calculation parameters
 * @returns Interest calculation results
 */
export function calculateFlatRateInterest(params: InterestCalculationParams): InterestCalculationResult {
  const { principal, annualRate, termInMonths } = params;
  const daysInMonth = 30; // Standard for flat rate calculations
  
  const dailyInterest = calculateDailyInterest(principal, annualRate, daysInMonth);
  const monthlyInterest = dailyInterest * daysInMonth;
  const totalInterest = monthlyInterest * termInMonths;
  const monthlyPrincipal = principal / termInMonths;
  const monthlyPayment = monthlyPrincipal + monthlyInterest;
  
  return {
    dailyInterest,
    monthlyInterest,
    totalInterest,
    monthlyPayment
  };
}

/**
 * Calculates interest for reducing balance loans
 * 
 * @param params - Interest calculation parameters
 * @returns Interest calculation results
 */
export function calculateReducingBalanceInterest(params: InterestCalculationParams): InterestCalculationResult {
  const { principal, annualRate, termInMonths } = params;
  const monthlyRate = annualRate / 100 / 12;
  
  let monthlyPayment: number;
  if (monthlyRate === 0) {
    monthlyPayment = principal / termInMonths;
  } else {
    monthlyPayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, termInMonths)) / 
                    (Math.pow(1 + monthlyRate, termInMonths) - 1);
  }
  
  const totalPayment = monthlyPayment * termInMonths;
  const totalInterest = totalPayment - principal;
  const monthlyInterest = totalInterest / termInMonths; // Average monthly interest
  const dailyInterest = monthlyInterest / 30; // Average daily interest
  
  return {
    dailyInterest,
    monthlyInterest,
    totalInterest,
    monthlyPayment
  };
}

/**
 * Main function to calculate interest based on the specified method
 * 
 * @param params - Interest calculation parameters
 * @returns Interest calculation results
 */
export function calculateInterest(params: InterestCalculationParams): InterestCalculationResult {
  switch (params.calculationMethod) {
    case 'flat_rate':
      return calculateFlatRateInterest(params);
    case 'reducing_balance':
    case 'declining_balance':
      return calculateReducingBalanceInterest(params);
    default:
      throw new Error(`Unsupported calculation method: ${params.calculationMethod}`);
  }
}

/**
 * Gets the number of days in a specific month
 * 
 * @param date - The date to get days for
 * @returns Number of days in the month
 */
export function getDaysInMonth(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

/**
 * Calculates interest for a specific date using actual days in month
 * 
 * @param principal - The loan principal amount
 * @param annualRate - Annual interest rate as percentage
 * @param date - The date to calculate for
 * @returns Daily interest amount for the specific month
 */
export function calculateDailyInterestForDate(
  principal: number, 
  annualRate: number, 
  date: Date
): number {
  const daysInMonth = getDaysInMonth(date);
  return calculateDailyInterest(principal, annualRate, daysInMonth);
}