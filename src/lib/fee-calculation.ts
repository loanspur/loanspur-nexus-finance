/**
 * Centralized fee calculation utilities with min/max enforcement
 */

export interface FeeStructure {
  id: string;
  name: string;
  calculation_type: 'fixed' | 'percentage' | 'flat';
  amount: number;
  min_amount?: number | null;
  max_amount?: number | null;
  fee_type: string;
  charge_time_type: string;
}

export interface CalculatedFee {
  id: string;
  name: string;
  calculation_type: string;
  original_amount: number;
  calculated_amount: number;
  applied_limit?: 'minimum' | 'maximum' | null;
  base_amount?: number;
}

/**
 * Calculate fee amount with min/max enforcement
 */
export function calculateFeeAmount(
  feeStructure: FeeStructure,
  baseAmount: number = 0
): CalculatedFee {
  let calculatedAmount: number;
  let appliedLimit: 'minimum' | 'maximum' | null = null;

  // Initial calculation based on type
  if (feeStructure.calculation_type === 'fixed' || feeStructure.calculation_type === 'flat') {
    calculatedAmount = feeStructure.amount;
  } else if (feeStructure.calculation_type === 'percentage') {
    calculatedAmount = (baseAmount * feeStructure.amount) / 100;
  } else {
    calculatedAmount = feeStructure.amount;
  }

  // Apply minimum limit
  if (feeStructure.min_amount && calculatedAmount < feeStructure.min_amount) {
    calculatedAmount = feeStructure.min_amount;
    appliedLimit = 'minimum';
  }

  // Apply maximum limit
  if (feeStructure.max_amount && calculatedAmount > feeStructure.max_amount) {
    calculatedAmount = feeStructure.max_amount;
    appliedLimit = 'maximum';
  }

  return {
    id: feeStructure.id,
    name: feeStructure.name,
    calculation_type: feeStructure.calculation_type,
    original_amount: feeStructure.amount,
    calculated_amount: calculatedAmount,
    applied_limit: appliedLimit,
    base_amount: baseAmount,
  };
}

/**
 * Calculate total fees for an array of fee structures
 */
export function calculateTotalFees(
  feeStructures: FeeStructure[],
  baseAmount: number = 0
): {
  total: number;
  fees: CalculatedFee[];
  hasLimitsApplied: boolean;
} {
  const calculatedFees = feeStructures.map(fee => 
    calculateFeeAmount(fee, baseAmount)
  );

  const total = calculatedFees.reduce((sum, fee) => sum + fee.calculated_amount, 0);
  const hasLimitsApplied = calculatedFees.some(fee => fee.applied_limit !== null);

  return {
    total,
    fees: calculatedFees,
    hasLimitsApplied,
  };
}

/**
 * Format fee display with limit information
 */
export function formatFeeDisplay(calculatedFee: CalculatedFee): string {
  const amount = calculatedFee.calculated_amount;
  const isPercentage = calculatedFee.calculation_type === 'percentage';
  
  let display = isPercentage 
    ? `${calculatedFee.original_amount}%` 
    : `KES ${amount.toLocaleString()}`;

  if (calculatedFee.applied_limit) {
    const limitType = calculatedFee.applied_limit === 'minimum' ? 'Min' : 'Max';
    display += ` (${limitType} applied: KES ${amount.toLocaleString()})`;
  } else if (isPercentage && calculatedFee.base_amount) {
    display += ` = KES ${amount.toLocaleString()}`;
  }

  return display;
}

/**
 * Get fee calculation warning message if limits are applied
 */
export function getFeeWarningMessage(calculatedFees: CalculatedFee[]): string | null {
  const feesWithLimits = calculatedFees.filter(fee => fee.applied_limit);
  
  if (feesWithLimits.length === 0) return null;

  const minApplied = feesWithLimits.filter(fee => fee.applied_limit === 'minimum');
  const maxApplied = feesWithLimits.filter(fee => fee.applied_limit === 'maximum');

  let message = '';
  
  if (minApplied.length > 0) {
    message += `Minimum charge limits applied to: ${minApplied.map(f => f.name).join(', ')}`;
  }
  
  if (maxApplied.length > 0) {
    if (message) message += '. ';
    message += `Maximum charge limits applied to: ${maxApplied.map(f => f.name).join(', ')}`;
  }

  return message;
}