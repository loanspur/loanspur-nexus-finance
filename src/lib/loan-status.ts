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

  // Overpaid: if we can detect a negative outstanding balance or total paid > principal
  const principal = Number(loan.principal_amount ?? loan.amount ?? 0) || 0;
  const outstanding = Number(loan.outstanding_balance ?? loan.outstanding ?? 0);
  const totalPaid = Number(loan.total_paid ?? 0);

  if (!Number.isNaN(outstanding) && outstanding < 0) {
    return {
      status: 'overpaid',
      overpaidAmount: Math.abs(outstanding),
    };
  }
  if (principal > 0 && totalPaid > principal + 1e-6) {
    return {
      status: 'overpaid',
      overpaidAmount: totalPaid - principal,
    };
  }

  // In arrears: check schedules if available
  const schedules: any[] = loan.loan_schedules || loan.schedules || [];
  if (Array.isArray(schedules) && schedules.length > 0) {
    const today = new Date();
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
      const diffMs = new Date().getTime() - oldest.getTime();
      const days = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
      return {
        status: 'in_arrears',
        daysInArrears: days,
      };
    }
  }

  // Normalize semantics: treat 'disbursed' as 'active' for UX, unless arrears/overpaid
  if (rawStatus === 'disbursed') return { status: 'active' };

  // Pass-through for application states and other known statuses
  return { status: rawStatus || 'unknown' };
}
