// Centralized loan status derivation utilities
// Uses available fields to compute consistent statuses across the app

export type DerivedLoanStatus = {
  status: string;
  daysInArrears?: number;
  overpaidAmount?: number;
};

function parseDate(value?: string | Date | null): Date | null {
  if (!value) return null;
  try {
    return new Date(value);
  } catch {
    return null;
  }
}

export function getDerivedLoanStatus(loan: any): DerivedLoanStatus {
  if (!loan) return { status: 'unknown' };

  const rawStatus: string = (loan.status || '').toLowerCase();

  // Get payments and schedules
  const payments = loan.loan_payments || loan.payments || [];
  const schedules: any[] = loan.loan_schedules || loan.schedules || [];
  
  // Calculate total payments made
  const totalPayments = payments.reduce((sum: number, payment: any) => {
    return sum + Number(payment.payment_amount || 0);
  }, 0);
  
  // Calculate total loan amount (principal + interest + fees)
  const totalLoanAmount = schedules.reduce((sum: number, schedule: any) => {
    return sum + Number(schedule.total_amount || 0);
  }, 0) || Number(loan.principal_amount || 0);
  
  // Current outstanding balance from database
  const dbOutstanding = Number(loan.outstanding_balance ?? loan.outstanding ?? 0);
  
  // Calculate derived outstanding: total loan amount - total payments
  const derivedOutstanding = totalLoanAmount - totalPayments;
  
  // If we have payments that exceed the loan amount, it's overpaid
  if (totalPayments > totalLoanAmount && totalPayments > 0) {
    return {
      status: 'active', // Keep as active since overpaid isn't a valid DB status
      overpaidAmount: totalPayments - totalLoanAmount,
    };
  }
  
  // If total payments equal or exceed loan amount, or derived outstanding is 0 or negative
  if ((totalPayments >= totalLoanAmount && totalPayments > 0) || derivedOutstanding <= 0) {
    return { status: 'closed' };
  }
  
  // Check database outstanding balance as fallback
  if (dbOutstanding === 0) {
    return { status: 'closed' };
  }
  
  // Overpaid: only if outstanding balance is negative (means overpayment)
  if (!Number.isNaN(dbOutstanding) && dbOutstanding < 0) {
    return {
      status: 'active',
      overpaidAmount: Math.abs(dbOutstanding),
    };
  }

  // In arrears: check schedules if available
  if (Array.isArray(schedules) && schedules.length > 0) {
    const today = new Date();
    today.setHours(23, 59, 59, 999); // Set to end of day for comparison
    
    const overdueSchedules = schedules.filter((s) => {
      const due = parseDate(s.due_date);
      const paid = (s.payment_status || '').toLowerCase() === 'paid';
      return due && due < today && !paid;
    });

    if (overdueSchedules.length > 0) {
      // Oldest overdue installment determines days in arrears
      const oldest = overdueSchedules.reduce((min, s) => {
        const d = parseDate(s.due_date)!;
        return d < min ? d : min;
      }, parseDate(overdueSchedules[0].due_date)!);
      const diffMs = today.getTime() - oldest.getTime();
      const days = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
      return {
        status: 'in_arrears',
        daysInArrears: days,
      };
    }
  }

  // If the raw status is already 'overdue', preserve it
  if (rawStatus === 'overdue') {
    return { status: 'overdue' };
  }

  // Normalize semantics: treat 'disbursed' as 'active' for UX, unless arrears/overpaid
  if (rawStatus === 'disbursed') return { status: 'active' };

  // For overpaid scenarios, keep loan as active since overpaid isn't a valid DB status
  if (rawStatus === 'overpaid') return { status: 'active' };

  // Pass-through for application states and other known statuses
  return { status: rawStatus || 'unknown' };
}
