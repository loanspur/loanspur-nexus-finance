/**
 * Loan Repayment Strategy Engine
 * Handles allocation of repayment amounts according to loan product configuration
 */

export interface RepaymentAllocation {
  principal: number;
  interest: number;
  fees: number;
  penalties: number;
}

export interface LoanBalances {
  outstandingPrincipal: number;
  unpaidInterest: number;
  unpaidFees: number;
  unpaidPenalties: number;
}

export type RepaymentStrategyType = 
  | 'penalties_fees_interest_principal'
  | 'interest_principal_penalties_fees' 
  | 'interest_penalties_fees_principal'
  | 'principal_interest_fees_penalties';

/**
 * Allocates a payment amount according to the specified repayment strategy
 */
export function allocateRepayment(
  paymentAmount: number,
  loanBalances: LoanBalances,
  strategy: RepaymentStrategyType = 'penalties_fees_interest_principal'
): RepaymentAllocation {
  let remaining = paymentAmount;
  const allocation: RepaymentAllocation = {
    principal: 0,
    interest: 0,
    fees: 0,
    penalties: 0
  };

  // Define allocation order based on strategy
  const allocationOrder = getStrategyOrder(strategy);

  // Allocate payment according to strategy order
  for (const component of allocationOrder) {
    if (remaining <= 0) break;

    const availableAmount = getAvailableAmount(component, loanBalances);
    const allocatedAmount = Math.min(remaining, availableAmount);
    
    if (allocatedAmount > 0) {
      allocation[component] = allocatedAmount;
      remaining -= allocatedAmount;
    }
  }

  return allocation;
}

/**
 * Gets the allocation order for a given strategy
 */
function getStrategyOrder(strategy: RepaymentStrategyType): Array<keyof RepaymentAllocation> {
  switch (strategy) {
    case 'penalties_fees_interest_principal':
      return ['penalties', 'fees', 'interest', 'principal'];
    case 'interest_principal_penalties_fees':
      return ['interest', 'principal', 'penalties', 'fees'];
    case 'interest_penalties_fees_principal':
      return ['interest', 'penalties', 'fees', 'principal'];
    case 'principal_interest_fees_penalties':
      return ['principal', 'interest', 'fees', 'penalties'];
    default:
      return ['penalties', 'fees', 'interest', 'principal'];
  }
}

/**
 * Gets the available amount for a specific component
 */
function getAvailableAmount(
  component: keyof RepaymentAllocation,
  balances: LoanBalances
): number {
  switch (component) {
    case 'principal':
      return Math.max(0, balances.outstandingPrincipal);
    case 'interest':
      return Math.max(0, balances.unpaidInterest);
    case 'fees':
      return Math.max(0, balances.unpaidFees);
    case 'penalties':
      return Math.max(0, balances.unpaidPenalties);
    default:
      return 0;
  }
}

/**
 * Validates if a repayment allocation is valid
 */
export function validateAllocation(
  allocation: RepaymentAllocation,
  loanBalances: LoanBalances
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (allocation.principal > loanBalances.outstandingPrincipal) {
    errors.push('Principal allocation exceeds outstanding principal');
  }

  if (allocation.interest > loanBalances.unpaidInterest) {
    errors.push('Interest allocation exceeds unpaid interest');
  }

  if (allocation.fees > loanBalances.unpaidFees) {
    errors.push('Fee allocation exceeds unpaid fees');
  }

  if (allocation.penalties > loanBalances.unpaidPenalties) {
    errors.push('Penalty allocation exceeds unpaid penalties');
  }

  // Check for negative amounts
  Object.entries(allocation).forEach(([key, value]) => {
    if (value < 0) {
      errors.push(`${key} allocation cannot be negative`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Calculates the total allocated amount
 */
export function getTotalAllocation(allocation: RepaymentAllocation): number {
  return allocation.principal + allocation.interest + allocation.fees + allocation.penalties;
}

/**
 * Formats allocation breakdown for display
 */
export function formatAllocationBreakdown(allocation: RepaymentAllocation): string {
  const parts: string[] = [];
  
  if (allocation.penalties > 0) {
    parts.push(`Penalties: ${formatCurrency(allocation.penalties)}`);
  }
  if (allocation.fees > 0) {
    parts.push(`Fees: ${formatCurrency(allocation.fees)}`);
  }
  if (allocation.interest > 0) {
    parts.push(`Interest: ${formatCurrency(allocation.interest)}`);
  }
  if (allocation.principal > 0) {
    parts.push(`Principal: ${formatCurrency(allocation.principal)}`);
  }

  return parts.length > 0 ? parts.join(', ') : 'No allocation';
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
  }).format(amount);
}