import { useState, useMemo, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { 
  CreditCard, 
  Calendar, 
  DollarSign, 
  FileText, 
  History,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  Download,
  Eye,
  Calculator,
  FileWarning,
  ClipboardList,
  Users,
  ShieldX
} from "lucide-react";
import { format, differenceInCalendarDays } from "date-fns";
import { PaymentForm } from "@/components/forms/PaymentForm";
import { LoanCalculatorDialog } from "@/components/forms/LoanCalculatorDialog";
import { TransactionStatement } from "@/components/statements/TransactionStatement";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLoanSchedules, useProcessLoanPayment } from "@/hooks/useLoanManagement";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

import { useSavingsDepositAccounting } from "@/hooks/useSavingsAccounting";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as DatePickerCalendar } from "@/components/ui/calendar";
import { useLoanRepaymentAccounting, useLoanChargeAccounting } from "@/hooks/useLoanAccounting";
import { useCreateJournalEntry } from "@/hooks/useAccounting";
import { useFeeStructures } from "@/hooks/useFeeManagement";
import { calculateFeeAmount } from "@/lib/fee-calculation";

const safeFormatDate = (value?: any, fmt = 'MMM dd, yyyy') => {
  try {
    if (!value) return 'N/A';
    const d = new Date(value);
    if (isNaN(d.getTime())) return 'N/A';
    return format(d, fmt);
  } catch {
    return 'N/A';
  }
};

interface LoanDetailsDialogProps {
  loan: any;
  clientName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const LoanDetailsDialog = ({ loan, clientName, open, onOpenChange }: LoanDetailsDialogProps) => {
  const [paymentFormOpen, setPaymentFormOpen] = useState(false);
  const [calculatorOpen, setCalculatorOpen] = useState(false);
  const { toast } = useToast();
  const depositAccounting = useSavingsDepositAccounting();
  const queryClient = useQueryClient();

  // Process Transaction modals
  const [repayOpen, setRepayOpen] = useState(false);
  const [earlyRepayOpen, setEarlyRepayOpen] = useState(false);
  const [writeOffOpen, setWriteOffOpen] = useState(false);
  const [chargeOpen, setChargeOpen] = useState(false);
  const [recoveryOpen, setRecoveryOpen] = useState(false);
  const [processTab, setProcessTab] = useState<string>('repayment');

  // Form fields
  const [repayAmount, setRepayAmount] = useState<number>(0);
  const [repayMethod, setRepayMethod] = useState<string>('cash');
  const [repayDate, setRepayDate] = useState<Date | undefined>(new Date());
  const [repayRef, setRepayRef] = useState<string>('');

  const [earlyAmount, setEarlyAmount] = useState<number>(0);
  const [earlyDate, setEarlyDate] = useState<Date | undefined>(new Date());
  const [earlyMethod, setEarlyMethod] = useState<string>('cash');

  const [writeOffReason, setWriteOffReason] = useState<string>('');
  const [writeOffConfirm, setWriteOffConfirm] = useState<string>('');
  const [writeOffDate, setWriteOffDate] = useState<Date | undefined>(new Date());

  const [feeId, setFeeId] = useState<string>('');
  const [feeAmount, setFeeAmount] = useState<number>(0);
  const [feeDate, setFeeDate] = useState<Date | undefined>(new Date());
  const [feeDesc, setFeeDesc] = useState<string>('');

  const [recoveryAmount, setRecoveryAmount] = useState<number>(0);
  const [recoveryDate, setRecoveryDate] = useState<Date | undefined>(new Date());
  const [recoveryMethod, setRecoveryMethod] = useState<string>('cash');

  // Hooks
  const processPayment = useProcessLoanPayment();
  const repayAccounting = useLoanRepaymentAccounting();
  const chargeAccounting = useLoanChargeAccounting();
  const createJournal = useCreateJournalEntry();
  const { data: feeStructures = [] } = useFeeStructures();

  // Loan product config and allowed payment types
  const { data: productConfig } = useQuery({
    queryKey: ['loan-product-config', loan?.loan_product_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('loan_products')
        .select('id, repayment_strategy, fee_mappings')
        .eq('id', loan.loan_product_id)
        .single();
      if (error) throw error;
      return data as any;
    },
    enabled: !!loan?.loan_product_id,
  });

  const { data: productPaymentTypes = [] } = useQuery({
    queryKey: ['loan-product-payment-types', loan?.loan_product_id],
    queryFn: async () => {
      const { data: maps, error: mapErr } = await supabase
        .from('product_fund_source_mappings')
        .select('channel_id, channel_name')
        .eq('product_id', loan.loan_product_id)
        .eq('product_type', 'loan');
      if (mapErr) throw mapErr;
      const ids = (maps || []).map((m: any) => m.channel_id).filter(Boolean);
      if (ids.length === 0) {
        // Fallback to channel_name with inferred codes
        return (maps || []).map((m: any, idx: number) => ({
          id: m.channel_id || `channel_${idx}`,
          code: (m.channel_name || '').toLowerCase().replace(/\s+/g, '_'),
          name: m.channel_name || 'Payment Channel',
        }));
      }
      const { data: pts, error: ptErr } = await supabase
        .from('payment_types')
        .select('id, code, name')
        .in('id', ids);
      if (ptErr) throw ptErr;
      return (pts || []).map((p: any) => ({ id: p.id, code: p.code, name: p.name }));
    },
    enabled: !!loan?.loan_product_id,
  });

  // Default payment methods from product mapping
  useEffect(() => {
    if (!productPaymentTypes || productPaymentTypes.length === 0) return;
    const codes = productPaymentTypes.map((p: any) => p.code);
    if (!codes.includes(repayMethod)) setRepayMethod(productPaymentTypes[0].code);
    if (!codes.includes(earlyMethod)) setEarlyMethod(productPaymentTypes[0].code);
    if (!codes.includes(recoveryMethod)) setRecoveryMethod(productPaymentTypes[0].code);
  }, [productPaymentTypes]);

  // Product-linked fees
  const feeMappings = (productConfig as any)?.fee_mappings as any[] | undefined;
  const productFees = useMemo(() => {
    const base = (feeStructures || []).filter((f: any) => f.fee_type === 'loan' && f.is_active);
    if (!feeMappings || feeMappings.length === 0) return base;
    const allowedIds = feeMappings.map((m: any) => m.fee_id).filter(Boolean);
    return base.filter((f: any) => allowedIds.includes(f.id));
  }, [feeMappings, feeStructures]);

  const [earlyFeeId, setEarlyFeeId] = useState<string>('');
  const earlyFeeAmount = useMemo(() => {
    const fee: any = productFees.find((f: any) => f.id === earlyFeeId);
    if (!fee) return 0;
    const baseOutstanding = Number((loan as any)?.outstanding_balance ?? 0);
    const calc = calculateFeeAmount({
      id: fee.id,
      name: fee.name,
      calculation_type: fee.calculation_type,
      amount: Number(fee.amount || 0),
      min_amount: fee.min_amount,
      max_amount: fee.max_amount,
      fee_type: fee.fee_type,
      charge_time_type: fee.charge_time_type,
    } as any, baseOutstanding);
    return Number(calc.calculated_amount || 0);
  }, [earlyFeeId, productFees, loan]);

  // Auto-calc default fee amount in Add Fee dialog
  useEffect(() => {
    if (!feeId) return;
    const fee: any = productFees.find((f: any) => f.id === feeId);
    if (!fee) return;
    const baseOutstanding = Number((loan as any)?.outstanding_balance ?? 0);
    const calc = calculateFeeAmount({
      id: fee.id,
      name: fee.name,
      calculation_type: fee.calculation_type,
      amount: Number(fee.amount || 0),
      min_amount: fee.min_amount,
      max_amount: fee.max_amount,
      fee_type: fee.fee_type,
      charge_time_type: fee.charge_time_type,
    } as any, baseOutstanding);
    setFeeAmount(Number(calc.calculated_amount || 0));
  }, [feeId, loan, productFees]);

  // Derived status: in_arrears and overpaid
  const { data: schedules = [] } = useLoanSchedules(loan?.id);

  const { data: payments = [] } = useQuery({
    queryKey: ['loan-payments', loan?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('loan_payments')
        .select('*')
        .eq('loan_id', loan.id)
        .order('payment_date', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!loan?.id,
  });

  const derived = useMemo(() => {
    const today = new Date();
    const overdue = (schedules || []).filter((s: any) => new Date(s.due_date) < today && s.payment_status !== 'paid');
    const earliest = overdue.length ? overdue.reduce((min: any, s: any) => (new Date(s.due_date) < new Date(min.due_date) ? s : min), overdue[0]) : null;
    const daysInArrears = earliest ? differenceInCalendarDays(today, new Date(earliest.due_date)) : 0;

    const totalDue = (schedules || []).reduce((acc: number, s: any) => acc + (s.total_amount || 0), 0);
    const totalPaid = (payments as any[]).reduce((acc, p: any) => acc + (p.payment_amount || 0), 0);
    const overpaidAmount = Math.max(0, totalPaid - totalDue);

    let status: string = loan.status;
    if (overpaidAmount > 0) status = 'overpaid';
    else if (overdue.length > 0) status = 'in_arrears';

    return { status, daysInArrears, overpaidAmount, totalPaid, totalDue };
  }, [schedules, payments, loan.status]);

  // Timely Repayment Percentage (TRP) based on cumulative payments vs. schedule up to each due date
  const loanTRP = useMemo(() => {
    try {
      const today = new Date();
      const dueSchedules = (schedules || [])
        .filter((s: any) => s?.due_date && new Date(s.due_date) <= today)
        .sort((a: any, b: any) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
      if (dueSchedules.length === 0) return 100;

      const orderedPayments = ((payments as any[]) || [])
        .filter((p: any) => p?.payment_date)
        .sort((a: any, b: any) => new Date(a.payment_date).getTime() - new Date(b.payment_date).getTime())
        .map((p: any) => ({ date: new Date(p.payment_date), amount: Number(p.payment_amount || 0) }));

      let payIdx = 0;
      let cumulativePaid = 0;
      const advanceTo = (upTo: Date) => {
        while (payIdx < orderedPayments.length && orderedPayments[payIdx].date <= upTo) {
          cumulativePaid += orderedPayments[payIdx].amount;
          payIdx++;
        }
        return cumulativePaid;
      };

      let timely = 0;
      let requiredCumulative = 0;
      for (const s of dueSchedules) {
        requiredCumulative += Number(s.total_amount || 0);
        const paidByDue = advanceTo(new Date(s.due_date));
        if (paidByDue + 0.0001 >= requiredCumulative) timely++;
      }
      return Math.round((timely / dueSchedules.length) * 100);
    } catch {
      return null;
    }
  }, [schedules, payments]);

  // Savings accounts for transfer of overpayment
  const { data: savingsAccounts = [] } = useQuery({
    queryKey: ['client-savings-accounts', loan?.client_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('savings_accounts')
        .select('id, account_number, account_balance')
        .eq('client_id', loan.client_id)
        .eq('is_active', true);
      if (error) throw error;
      return data || [];
    },
    enabled: !!loan?.client_id,
  });

  const [transferOpen, setTransferOpen] = useState(false);
  const [selectedSavingsId, setSelectedSavingsId] = useState<string | null>(null);
  const handleTransferExcess = async () => {
    try {
      if (!selectedSavingsId || derived.overpaidAmount <= 0) return;
      // Fetch current balance
      const { data: acct, error: acctErr } = await supabase
        .from('savings_accounts')
        .select('account_balance, account_number, savings_product_id')
        .eq('id', selectedSavingsId)
        .single();
      if (acctErr) throw acctErr;

      const newBalance = (acct?.account_balance || 0) + derived.overpaidAmount;

      const { error: updErr } = await supabase
        .from('savings_accounts')
        .update({ account_balance: newBalance })
        .eq('id', selectedSavingsId);
      if (updErr) throw updErr;

      const { error: txErr } = await supabase
        .from('savings_transactions')
        .insert({
          tenant_id: loan.tenant_id,
          savings_account_id: selectedSavingsId,
          transaction_type: 'deposit',
          amount: derived.overpaidAmount,
          balance_after: newBalance,
          transaction_date: new Date().toISOString(),
          description: `Transfer of loan overpayment (${loan.loan_number || loan.id})`,
          processed_by: loan.loan_officer_id || null,
          method: 'internal_transfer',
        });
      if (txErr) throw txErr;

      // Best-effort accounting entry for the deposit to savings
      try {
        await depositAccounting.mutateAsync({
          savings_account_id: selectedSavingsId,
          savings_product_id: acct.savings_product_id,
          amount: derived.overpaidAmount,
          transaction_date: new Date().toISOString().split('T')[0],
          account_number: acct.account_number,
          payment_method: 'internal_transfer',
        } as any);
      } catch (e) {
        console.warn('Savings deposit accounting failed:', e);
      }

      toast({ title: 'Excess transferred', description: 'Overpaid amount transferred to savings.' });
      setTransferOpen(false);
      setSelectedSavingsId(null);
    } catch (e: any) {
      toast({ title: 'Transfer failed', description: e.message || 'Could not transfer excess.', variant: 'destructive' });
    }
  };

if (!loan) return null;

const { formatAmount: formatCurrency } = useCurrency();

const getStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'active':
      return 'default';
    case 'pending_approval':
    case 'pending_disbursement':
      return 'secondary';
    case 'closed':
    case 'completed':
      return 'outline';
    case 'in_arrears':
      return 'destructive';
    case 'overpaid':
      return 'secondary';
    case 'overdue':
      return 'destructive';
    default:
      return 'secondary';
  }
};

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return <CheckCircle className="h-3 w-3" />;
      case 'pending_approval':
      case 'pending_disbursement':
        return <Clock className="h-3 w-3" />;
      case 'closed':
      case 'completed':
        return <XCircle className="h-3 w-3" />;
      case 'in_arrears':
        return <AlertTriangle className="h-3 w-3" />;
      case 'overpaid':
        return <DollarSign className="h-3 w-3" />;
      case 'overdue':
        return <AlertTriangle className="h-3 w-3" />;
      default:
        return <Clock className="h-3 w-3" />;
    }
  };

  // Fetch loan charges/fees
  const { data: loanCharges = [] } = useQuery({
    queryKey: ['loan-charges', loan?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('loan_charges')
        .select('*')
        .eq('loan_id', loan.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!loan?.id,
  });

  // Fetch loan collaterals
  const { data: loanCollaterals = [] } = useQuery({
    queryKey: ['loan-collaterals', loan?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('loan_collaterals')
        .select(`
          *,
          collateral_types(name, category)
        `)
        .eq('loan_id', loan.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!loan?.id,
  });

  // Fetch loan guarantors
  const { data: loanGuarantors = [] } = useQuery({
    queryKey: ['loan-guarantors', loan?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('loan_guarantors')
        .select('*')
        .eq('loan_id', loan.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!loan?.id,
  });

  // Fetch loan documents
  const { data: loanDocuments = [] } = useQuery({
    queryKey: ['loan-documents', loan?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('loan_documents')
        .select('*')
        .eq('loan_id', loan.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!loan?.id,
  });

  // Fetch actual loan product details
  const { data: loanProduct } = useQuery({
    queryKey: ['loan-product-details', loan?.loan_product_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('loan_products')
        .select('*')
        .eq('id', loan.loan_product_id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!loan?.loan_product_id,
  });

  // Calculate comprehensive outstanding balance = unpaid principal + unpaid interest + unpaid fees + unpaid penalties
  const outstandingBalanceCalculation = useMemo(() => {
    let unpaidPrincipal = 0;
    let unpaidInterest = 0;
    let unpaidFees = 0;
    let unpaidPenalties = 0;

    // Calculate from schedules
    const unpaidSchedules = (schedules || []).filter((s: any) => s.payment_status !== 'paid');
    unpaidPrincipal = unpaidSchedules.reduce((sum: number, s: any) => sum + (Number(s.principal_amount) - Number(s.paid_principal || 0)), 0);
    unpaidInterest = unpaidSchedules.reduce((sum: number, s: any) => sum + (Number(s.interest_amount) - Number(s.paid_interest || 0)), 0);
    unpaidFees = unpaidSchedules.reduce((sum: number, s: any) => sum + (Number(s.fee_amount) - Number(s.paid_fees || 0)), 0);

    // Add outstanding charges/fees
    const outstandingCharges = (loanCharges || []).filter((c: any) => !c.is_paid);
    unpaidFees += outstandingCharges.reduce((sum: number, c: any) => sum + Number(c.charge_amount || 0), 0);

    // Total outstanding
    const totalOutstanding = unpaidPrincipal + unpaidInterest + unpaidFees + unpaidPenalties;

    return {
      unpaidPrincipal,
      unpaidInterest,
      unpaidFees,
      unpaidPenalties,
      totalOutstanding
    };
  }, [schedules, loanCharges]);

  // Compute real loan details from schedules and payments with actual data
  const monthlyPayment = (schedules && schedules.length > 0) ? (schedules[0].total_amount || 0) : 0;
  const remainingTerm = (schedules || []).filter((s: any) => s.payment_status !== 'paid').length;
  const totalTerm = (schedules || []).length;
  const principalPaid = (payments as any[]).reduce((sum: number, p: any) => sum + (p.principal_amount || 0), 0);
  const interestPaid = (payments as any[]).reduce((sum: number, p: any) => sum + (p.interest_amount || 0), 0);
  const feesPaid = (payments as any[]).reduce((sum: number, p: any) => sum + (p.fee_amount || 0), 0);
  const totalPayments = (payments as any[]).length;
  const missedPayments = (schedules || []).filter((s: any) => s.payment_status === 'unpaid' && new Date(s.due_date) < new Date()).length;
  const latePayments = (payments as any[]).filter((p: any) => {
    const schedule = (schedules || []).find((s: any) => s.id === p.schedule_id);
    return schedule && new Date(p.payment_date) > new Date(schedule.due_date);
  }).length;
  const nextSchedule = (schedules || []).find((s: any) => s.payment_status !== 'paid' && new Date(s.due_date) >= new Date());
  const maturityDate = (schedules && schedules.length > 0) ? schedules[schedules.length - 1].due_date : null;
  const outstanding = outstandingBalanceCalculation.totalOutstanding;

  const loanDetails = {
    ...loan,
    type: loan?.loan_products?.name ?? 'Loan',
    amount: (loan as any).principal_amount ?? (loan as any).amount ?? 0,
    outstanding,
    monthlyPayment,
    remainingTerm,
    totalTerm,
    disbursementDate: (loan as any).disbursement_date ?? null,
    maturityDate,
    interestRate: (loan as any).interest_rate ?? loan?.loan_products?.default_nominal_interest_rate ?? null,
    paymentFrequency: 'Monthly',
    principalPaid,
    interestPaid,
    totalPayments,
    missedPayments,
    latePayments: 0,
    nextPayment: nextSchedule?.due_date ?? null,
    collateral: (loan as any).collateral ?? null,
    purpose: (loan as any).purpose ?? null,
    guarantor: (loan as any).guarantor ?? null,
    loanOfficer: (loan as any).loan_officer_name ?? null,
    approvalStatus: loan.status === 'pending_approval' ? (loan as any).approvalStatus ?? null : null,
    closureDetails: loan.status === 'closed' ? (loan as any).closureDetails ?? null : null,
    overdueDetails: loan.status === 'overdue' ? (loan as any).overdueDetails ?? null : null,
  };

  const paymentHistory = (payments as any[]).map((p: any) => ({
    date: p.payment_date,
    amount: p.payment_amount || 0,
    type: 'Payment',
    status: p.status || 'Paid',
    balance: 0,
  }));

  const handleClearLoan = async () => {
    const { error } = await supabase
      .from('loans')
      .update({ status: 'closed', outstanding_balance: 0 })
      .eq('id', loan.id);
    if (error) {
      toast({ title: 'Error', description: 'Failed to clear loan', variant: 'destructive' });
    } else {
      toast({ title: 'Loan Cleared', description: 'Loan marked as closed.' });
      onOpenChange(false);
    }
  };

  const handleWriteOffLoan = async () => {
    const { error } = await supabase
      .from('loans')
      .update({ status: 'written_off' })
      .eq('id', loan.id);
    if (error) {
      toast({ title: 'Error', description: 'Failed to write off loan', variant: 'destructive' });
    } else {
      toast({ title: 'Loan Written Off', description: 'Loan marked as written off.' });
      onOpenChange(false);
    }
  };

  const upcomingPayments = (schedules || [])
    .filter((s: any) => s.payment_status !== 'paid' && new Date(s.due_date) >= new Date())
    .slice(0, 3)
    .map((s: any) => ({
      date: s.due_date,
      amount: s.total_amount || 0,
      type: 'Scheduled Payment',
      status: new Date(s.due_date).toDateString() === new Date().toDateString() ? 'Due' : 'Scheduled',
    }));

  // Transaction helpers and handlers
  // Compute remaining components from unpaid schedules
  const componentTotals = useMemo(() => {
    const unpaid = (schedules || []).filter((s: any) => s.payment_status !== 'paid');
    const remainingPrincipal = unpaid.reduce((sum: number, s: any) => sum + Number(s.principal_amount || 0), 0);
    const remainingInterest = unpaid.reduce((sum: number, s: any) => sum + Number(s.interest_amount || 0), 0);
    const remainingFees = unpaid.reduce((sum: number, s: any) => sum + Number(s.fee_amount || 0), 0);
    return { remainingPrincipal, remainingInterest, remainingFees };
  }, [schedules]);

  const toISO = (d?: Date) => (d ? format(d, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'));

  const allocateByStrategy = (amount: number) => {
    let remaining = Number(amount || 0);
    let principal = 0, interest = 0, fee = 0, penalty = 0;

    const orderMap: Record<string, Array<'penalty' | 'fee' | 'interest' | 'principal'>> = {
      penalties_fees_interest_principal: ['penalty', 'fee', 'interest', 'principal'],
      interest_principal_penalties_fees: ['interest', 'principal', 'penalty', 'fee'],
      interest_penalties_fees_principal: ['interest', 'penalty', 'fee', 'principal'],
      principal_interest_fees_penalties: ['principal', 'interest', 'fee', 'penalty'],
    };
    const order = orderMap[(productConfig as any)?.repayment_strategy] || ['interest', 'fee', 'principal', 'penalty'];

    const caps: Record<'principal' | 'interest' | 'fee' | 'penalty', number> = {
      principal: componentTotals.remainingPrincipal,
      interest: componentTotals.remainingInterest,
      fee: componentTotals.remainingFees,
      penalty: 0,
    };

    for (const key of order) {
      const take = Math.min(remaining, caps[key]);
      if (key === 'principal') principal += take;
      if (key === 'interest') interest += take;
      if (key === 'fee') fee += take;
      if (key === 'penalty') penalty += take;
      remaining -= take;
      if (remaining <= 0) break;
    }

    // Any leftover goes to principal
    if (remaining > 0) principal += remaining;

    return { principal, interest, fee, penalty };
  };

  const processAndUpdateLoan = async (amount: number, dateISO: string, method: string, ref?: string) => {
    const breakdown = allocateByStrategy(amount);

    // Accounting entry
    await repayAccounting.mutateAsync({
      loan_id: loan.id,
      payment_amount: amount,
      principal_amount: breakdown.principal,
      interest_amount: breakdown.interest,
      fee_amount: breakdown.fee,
      penalty_amount: breakdown.penalty,
      payment_date: dateISO,
      payment_reference: ref,
      payment_method: method,
    } as any);

    // Payment record (best-effort)
    try {
      await processPayment.mutateAsync({
        loan_id: loan.id,
        payment_amount: amount,
        principal_amount: breakdown.principal,
        interest_amount: breakdown.interest,
        fee_amount: breakdown.fee,
        payment_method: method,
        reference_number: ref,
      } as any);
    } catch (e) {
      console.warn('Payment recording skipped:', e);
    }

    // Update loan outstanding/status
    const currentOutstanding = Number((loan as any).outstanding_balance ?? outstanding);
    const newOutstanding = currentOutstanding - amount;
    const patch: any = { outstanding_balance: Math.max(0, newOutstanding) };
    if (newOutstanding < -0.0001) patch.status = 'overpaid';
    else if (newOutstanding <= 0.0001) patch.status = 'closed';

    const { error: upErr } = await supabase.from('loans').update(patch).eq('id', loan.id);
    if (upErr) throw upErr;

    await queryClient.invalidateQueries({ queryKey: ['loans'] });
    await queryClient.invalidateQueries({ queryKey: ['client-loans'] });
    await queryClient.invalidateQueries({ queryKey: ['loan-schedules', loan.id] });
  };

  const submitRepayment = async () => {
    try {
      await processAndUpdateLoan(Number(repayAmount), toISO(repayDate), repayMethod, repayRef);
      toast({ title: 'Repayment recorded' });
      setRepayOpen(false);
      setRepayAmount(0);
      setRepayRef('');
    } catch (e: any) {
      toast({ title: 'Repayment failed', description: e.message, variant: 'destructive' });
    }
  };

  const submitEarlyRepayment = async () => {
    try {
      let payoff = Number(earlyAmount || outstanding);
      const dateISO = toISO(earlyDate);

      // If an early payoff fee is selected, charge it (income journals) and include in payoff
      if (earlyFeeId && earlyFeeAmount > 0) {
        await chargeAccounting.mutateAsync({
          loan_id: loan.id,
          charge_type: 'fee',
          amount: Number(earlyFeeAmount),
          charge_date: dateISO,
          description: 'Early repayment fee',
          fee_structure_id: earlyFeeId,
        } as any);
        payoff += Number(earlyFeeAmount);
      }

      await processAndUpdateLoan(payoff, dateISO, earlyMethod, 'EARLY-SETTLEMENT');
      toast({ title: 'Loan closed', description: 'Early repayment processed.' });
      setEarlyRepayOpen(false);
    } catch (e: any) {
      toast({ title: 'Early repayment failed', description: e.message, variant: 'destructive' });
    }
  };

  const submitWriteOff = async () => {
    try {
      const amount = Number(outstanding);
      const dateISO = toISO(writeOffDate);
      const { data: prod, error: perr } = await supabase
        .from('loan_products')
        .select('loan_portfolio_account_id, writeoff_expense_account_id, principal_payment_account_id')
        .eq('id', loan.loan_product_id)
        .single();
      if (perr) throw perr;
      if (!prod?.writeoff_expense_account_id || !prod?.loan_portfolio_account_id) {
        throw new Error('Write-off accounts not configured');
      }

      await createJournal.mutateAsync({
        transaction_date: dateISO,
        description: `Loan write-off - ${loan.loan_number || loan.id}${writeOffReason ? ` (${writeOffReason})` : ''}`,
        reference_type: 'loan_writeoff',
        reference_id: loan.id,
        lines: [
          { account_id: prod.writeoff_expense_account_id, description: 'Write-off expense', debit_amount: amount, credit_amount: 0 },
          { account_id: prod.loan_portfolio_account_id, description: 'Write-off loan portfolio', debit_amount: 0, credit_amount: amount },
        ],
      } as any);

      const { error: upErr } = await supabase
        .from('loans')
        .update({ status: 'written_off', outstanding_balance: 0 })
        .eq('id', loan.id);
      if (upErr) throw upErr;

      toast({ title: 'Loan written off' });
      setWriteOffOpen(false);
    } catch (e: any) {
      toast({ title: 'Write-off failed', description: e.message, variant: 'destructive' });
    }
  };

  const submitCharge = async () => {
    try {
      await chargeAccounting.mutateAsync({
        loan_id: loan.id,
        charge_type: 'fee',
        amount: Number(feeAmount),
        charge_date: toISO(feeDate),
        description: feeDesc || 'Loan fee charge',
        fee_structure_id: feeId || undefined,
      } as any);

      const currentOutstanding = Number((loan as any).outstanding_balance ?? outstanding);
      const { error: upErr } = await supabase
        .from('loans')
        .update({ outstanding_balance: currentOutstanding + Number(feeAmount) })
        .eq('id', loan.id);
      if (upErr) throw upErr;

      toast({ title: 'Fee added' });
      setChargeOpen(false);
      setFeeId(''); setFeeAmount(0); setFeeDesc('');
    } catch (e: any) {
      toast({ title: 'Charge failed', description: e.message, variant: 'destructive' });
    }
  };

  const submitRecovery = async () => {
    try {
      const { data: prod, error: perr } = await supabase
        .from('loan_products')
        .select('writeoff_expense_account_id, principal_payment_account_id')
        .eq('id', loan.loan_product_id)
        .single();
      if (perr) throw perr;
      if (!prod?.writeoff_expense_account_id || !prod?.principal_payment_account_id) {
        throw new Error('Recovery accounts not configured');
      }
      await createJournal.mutateAsync({
        transaction_date: toISO(recoveryDate),
        description: `Write-off recovery - ${loan.loan_number || loan.id}`,
        reference_type: 'loan_recovery',
        reference_id: loan.id,
        lines: [
          { account_id: prod.principal_payment_account_id, description: 'Recovery receipt', debit_amount: Number(recoveryAmount), credit_amount: 0 },
          { account_id: prod.writeoff_expense_account_id, description: 'Reverse write-off expense', debit_amount: 0, credit_amount: Number(recoveryAmount) },
        ],
      } as any);
      toast({ title: 'Recovery recorded' });
      setRecoveryOpen(false);
    } catch (e: any) {
      toast({ title: 'Recovery failed', description: e.message, variant: 'destructive' });
    }
  };

  const documents: any[] = [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-orange-600" />
            Loan Details - {loan?.loan_products?.name || 'Loan'}
          </DialogTitle>
          <DialogDescription>
            Comprehensive view for {clientName}'s loan {loan?.loan_number || loan?.id}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <Tabs defaultValue="overview" className="h-full">
            <TabsList className="w-full justify-start mb-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="payments" disabled={loan.status === 'pending_approval'}>Loan Transactions</TabsTrigger>
              <TabsTrigger value="schedule" disabled={loan.status === 'pending_approval' || loan.status === 'closed'}>Repayment Schedule</TabsTrigger>
              <TabsTrigger value="charges">Charges Applied</TabsTrigger>
              <TabsTrigger value="documents">Loan Documents</TabsTrigger>
              
              
              <TabsTrigger value="collateral">Collaterals</TabsTrigger>
              <TabsTrigger value="guarantors">Guarantors</TabsTrigger>
              
              
              {loan.status === 'pending_approval' && <TabsTrigger value="approval">Approval Details</TabsTrigger>}
              {loan.status === 'closed' && <TabsTrigger value="closure">Closure Details</TabsTrigger>}
              {loan.status === 'overdue' && <TabsTrigger value="recovery">Recovery</TabsTrigger>}
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Loan Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Outstanding Balance</p>
                        <p className="text-2xl font-bold text-orange-600">{formatCurrency(loanDetails.outstanding)}</p>
                      </div>
                      <DollarSign className="h-8 w-8 text-orange-600" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Monthly Payment</p>
                        <p className="text-2xl font-bold">{formatCurrency(loanDetails.monthlyPayment)}</p>
                      </div>
                      <Calendar className="h-8 w-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Remaining Term</p>
                        <p className="text-2xl font-bold">{loanDetails.remainingTerm} months</p>
                      </div>
                      <Clock className="h-8 w-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Status</p>
                        <Badge variant={getStatusColor(derived.status)} className="mt-1">
                          {getStatusIcon(derived.status)}
                          <span className="ml-1">{derived.status.replace('_', ' ').toUpperCase()}</span>
                        </Badge>
                      </div>
                      <CheckCircle className="h-8 w-8 text-primary" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">TRP (Timely Repayment)</p>
                        <p className="text-2xl font-bold">{loanTRP !== null ? `${loanTRP}%` : 'N/A'}</p>
                      </div>
                      <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {derived.status === 'in_arrears' && (
                <div className="p-4 border rounded-lg bg-destructive/10 border-destructive text-destructive-foreground mb-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="font-medium">In arrears</span>
                    <span className="text-sm">({derived.daysInArrears} days overdue)</span>
                  </div>
                </div>
              )}

              {derived.status === 'overpaid' && (
                <div className="p-4 border rounded-lg bg-muted mb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      <span className="font-medium">Overpaid</span>
                      <span className="text-sm">Excess: {formatCurrency(derived.overpaidAmount)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select onValueChange={(v) => setSelectedSavingsId(v)}>
                        <SelectTrigger className="w-56">
                          <SelectValue placeholder="Select savings account" />
                        </SelectTrigger>
                        <SelectContent>
                          {savingsAccounts.map((sa: any) => (
                            <SelectItem key={sa.id} value={sa.id}>
                              {sa.account_number} • Bal: {formatCurrency(sa.account_balance || 0)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button size="sm" onClick={handleTransferExcess} disabled={!selectedSavingsId}>
                        Transfer to savings
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Loan Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Loan Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Loan ID</span>
                        <div className="font-medium">{loanDetails.id}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Loan Type</span>
                        <div className="font-medium">{loanDetails.type}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Original Amount</span>
                        <div className="font-medium">{formatCurrency(loanDetails.amount)}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Interest Rate</span>
                        <div className="font-medium">{loanDetails.interestRate}% p.a.</div>
                      </div>
                      {loanDetails.disbursementDate && (
                        <div>
                          <span className="text-muted-foreground">Disbursement Date</span>
                          <div className="font-medium">{safeFormatDate(loanDetails.disbursementDate, 'MMM dd, yyyy')}</div>
                        </div>
                      )}
                      {loanDetails.maturityDate && (
                        <div>
                          <span className="text-muted-foreground">Maturity Date</span>
                          <div className="font-medium">{safeFormatDate(loanDetails.maturityDate, 'MMM dd, yyyy')}</div>
                        </div>
                      )}
                      <div>
                        <span className="text-muted-foreground">Payment Frequency</span>
                        <div className="font-medium">{loanDetails.paymentFrequency}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Purpose</span>
                        <div className="font-medium">{loanDetails.purpose}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Payment Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle>Payment Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Principal Paid</span>
                        <div className="font-medium text-green-600">{formatCurrency(loanDetails.principalPaid)}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Interest Paid</span>
                        <div className="font-medium">{formatCurrency(loanDetails.interestPaid)}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Total Payments</span>
                        <div className="font-medium">{loanDetails.totalPayments}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Missed Payments</span>
                        <div className="font-medium text-red-600">{loanDetails.missedPayments}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Late Payments</span>
                        <div className="font-medium text-yellow-600">{loanDetails.latePayments}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Next Payment</span>
                        <div className="font-medium">{safeFormatDate(loanDetails.nextPayment, 'MMM dd, yyyy')}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>


                {/* Process Transaction */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Process Transactions</CardTitle>
                    <CardDescription>Choose an action below. Each tab opens a focused modal.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Tabs value={processTab} onValueChange={setProcessTab} className="w-full">
                      <TabsList className="w-full grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
                        <TabsTrigger value="repayment">Repayment</TabsTrigger>
                        <TabsTrigger value="early">Early Repayment</TabsTrigger>
                        <TabsTrigger value="fee">Add Fee</TabsTrigger>
                        <TabsTrigger value="writeoff">Write Off</TabsTrigger>
                        <TabsTrigger value="transfer" disabled={derived.overpaidAmount <= 0}>Transfer Overpaid</TabsTrigger>
                        <TabsTrigger value="recovery" disabled={loan.status !== 'written_off'}>Recovery</TabsTrigger>
                      </TabsList>

                      <TabsContent value="repayment">
                        <div className="flex items-center justify-between p-3 border rounded-md">
                          <div>
                            <div className="font-medium">Standard Repayment</div>
                            <div className="text-sm text-muted-foreground">Allocate per product repayment strategy</div>
                          </div>
                          <Button onClick={() => setRepayOpen(true)}>Open</Button>
                        </div>
                      </TabsContent>

                      <TabsContent value="early">
                        <div className="flex items-center justify-between p-3 border rounded-md">
                          <div>
                            <div className="font-medium">Early Payoff</div>
                            <div className="text-sm text-muted-foreground">Select early fee and close loan</div>
                          </div>
                          <Button onClick={() => setEarlyRepayOpen(true)}>Open</Button>
                        </div>
                      </TabsContent>

                      <TabsContent value="fee">
                        <div className="flex items-center justify-between p-3 border rounded-md">
                          <div>
                            <div className="font-medium">Add Loan Fee</div>
                            <div className="text-sm text-muted-foreground">Charge product-linked fees</div>
                          </div>
                          <Button onClick={() => setChargeOpen(true)}>Open</Button>
                        </div>
                      </TabsContent>

                      <TabsContent value="writeoff">
                        <div className="flex items-center justify-between p-3 border rounded-md">
                          <div>
                            <div className="font-medium">Write Off</div>
                            <div className="text-sm text-muted-foreground">Write off outstanding balance</div>
                          </div>
                          <Button onClick={() => setWriteOffOpen(true)} variant="destructive">Open</Button>
                        </div>
                      </TabsContent>

                      <TabsContent value="transfer">
                        <div className="flex items-center justify-between p-3 border rounded-md">
                          <div>
                            <div className="font-medium">Transfer Overpaid</div>
                            <div className="text-sm text-muted-foreground">Excess: {formatCurrency(derived.overpaidAmount)}</div>
                          </div>
                          <Button onClick={() => setTransferOpen(true)} disabled={derived.overpaidAmount <= 0}>Open</Button>
                        </div>
                      </TabsContent>

                      <TabsContent value="recovery">
                        <div className="flex items-center justify-between p-3 border rounded-md">
                          <div>
                            <div className="font-medium">Recover Written-off</div>
                            <div className="text-sm text-muted-foreground">Record cash recovered post write-off</div>
                          </div>
                          <Button onClick={() => setRecoveryOpen(true)} disabled={loan.status !== 'written_off'}>Open</Button>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Transactions Tab - Statement Format */}
            <TabsContent value="payments" className="space-y-6">
              <TransactionStatement
                accountId={loanDetails.id}
                accountType="loan"
                accountNumber={loanDetails.id}
                clientName={clientName}
                accountDetails={{
                  balance: loanDetails.outstanding,
                  interestRate: loanDetails.interestRate,
                  openingDate: loanDetails.disbursementDate || undefined,
                  accountOfficer: loanDetails.loanOfficer
                }}
                showSummary={false}
              />
            </TabsContent>

            {/* Schedule Tab */}
            <TabsContent value="schedule" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Upcoming Payments
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {upcomingPayments.map((payment, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className={`w-3 h-3 rounded-full ${
                            payment.status === 'Due' ? 'bg-orange-500' : 'bg-gray-300'
                          }`} />
                          <div>
                            <div className="font-medium">{payment.type}</div>
                            <div className="text-sm text-muted-foreground">
                              {safeFormatDate(payment.date, 'MMM dd, yyyy')}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{formatCurrency(payment.amount)}</div>
                          <div className={`text-sm ${
                            payment.status === 'Due' ? 'text-orange-600' : 'text-muted-foreground'
                          }`}>
                            {payment.status}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Documents Tab */}
            <TabsContent value="documents" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Loan Documents
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {documents.length === 0 ? (
                      <div className="text-center py-12">
                        <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <div className="text-lg font-medium text-muted-foreground mb-2">
                          No loan documents found
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Documents uploaded for this loan will appear here
                        </div>
                      </div>
                    ) : (
                      documents.map((doc, index) => (
                        <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <div className="font-medium">{doc.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {doc.type} • {safeFormatDate(doc.date, 'MMM dd, yyyy')}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={doc.status === 'Signed' || doc.status === 'Verified' || doc.status === 'Active' ? 'default' : 'secondary'}>
                              {doc.status}
                            </Badge>
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </Button>
                            <Button variant="outline" size="sm">
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>


            <TabsContent value="charges" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ClipboardList className="h-5 w-5" />
                    Charges Applied
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">No charges recorded for this loan yet.</p>
                </CardContent>
              </Card>
            </TabsContent>


            <TabsContent value="collateral" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShieldX className="h-5 w-5" />
                    Collaterals Attached
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm"><span className="text-muted-foreground">Current:</span> {loanDetails.collateral || 'None recorded'}</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="guarantors" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Guarantors
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm"><span className="text-muted-foreground">Current:</span> {loanDetails.guarantor || 'None recorded'}</p>
                </CardContent>
              </Card>
            </TabsContent>



            {/* Approval Details Tab */}
            {loan.status === 'pending_approval' && (
              <TabsContent value="approval" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-yellow-600" />
                      Approval Process
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <span className="text-sm text-muted-foreground">Application Date</span>
                          <div className="font-medium">{safeFormatDate(loanDetails.approvalStatus?.submittedDate, 'MMM dd, yyyy')}</div>
                        </div>
                        <div>
                          <span className="text-sm text-muted-foreground">Current Stage</span>
                          <div className="font-medium">{loanDetails.approvalStatus?.reviewStage}</div>
                        </div>
                        <div>
                          <span className="text-sm text-muted-foreground">Assigned Approver</span>
                          <div className="font-medium">{loanDetails.approvalStatus?.approver}</div>
                        </div>
                        <div>
                          <span className="text-sm text-muted-foreground">Estimated Approval</span>
                          <div className="font-medium">{safeFormatDate(loanDetails.approvalStatus?.estimatedApproval, 'MMM dd, yyyy')}</div>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <span className="text-sm text-muted-foreground">Required Documents</span>
                          <div className="mt-2 space-y-1">
                            {loanDetails.approvalStatus?.requiredDocuments.map((doc: string, index: number) => (
                              <div key={index} className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-yellow-500" />
                                <span className="text-sm">{doc}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <span className="text-sm text-muted-foreground">Comments</span>
                          <div className="mt-1 p-3 bg-muted rounded-md text-sm">{loanDetails.approvalStatus?.comments}</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {/* Closure Details Tab */}
            {loan.status === 'closed' && (
              <TabsContent value="closure" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      Loan Closure Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <span className="text-sm text-muted-foreground">Closure Date</span>
                          <div className="font-medium">{safeFormatDate(loanDetails.closureDetails?.closureDate, 'MMM dd, yyyy')}</div>
                        </div>
                        <div>
                          <span className="text-sm text-muted-foreground">Closure Reason</span>
                          <div className="font-medium">{loanDetails.closureDetails?.closureReason}</div>
                        </div>
                        <div>
                          <span className="text-sm text-muted-foreground">Final Payment</span>
                          <div className="font-medium text-green-600">{formatCurrency(loanDetails.closureDetails?.finalPayment || 0)}</div>
                        </div>
                        <div>
                          <span className="text-sm text-muted-foreground">Closed By</span>
                          <div className="font-medium">{loanDetails.closureDetails?.closedBy}</div>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <span className="text-sm text-muted-foreground">Total Amount Paid</span>
                          <div className="font-medium text-green-600">{formatCurrency(loanDetails.closureDetails?.totalAmountPaid || 0)}</div>
                        </div>
                        <div>
                          <span className="text-sm text-muted-foreground">Completion Certificate</span>
                          <div className="flex items-center gap-2">
                            <Badge variant={loanDetails.closureDetails?.certificateGenerated ? 'default' : 'secondary'}>
                              {loanDetails.closureDetails?.certificateGenerated ? 'Generated' : 'Pending'}
                            </Badge>
                            {loanDetails.closureDetails?.certificateGenerated && (
                              <Button variant="outline" size="sm">
                                <Download className="h-4 w-4 mr-2" />
                                Download
                              </Button>
                            )}
                          </div>
                        </div>
                        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-center gap-2 text-green-800">
                            <CheckCircle className="h-4 w-4" />
                            <span className="font-medium">Loan Successfully Completed</span>
                          </div>
                          <p className="text-sm text-green-700 mt-1">
                            This loan has been fully repaid and closed successfully.
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {/* Recovery Details Tab */}
            {loan.status === 'overdue' && (
              <TabsContent value="recovery" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                      Recovery Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <span className="text-sm text-muted-foreground">Days Past Due</span>
                          <div className="font-medium text-red-600">{loanDetails.overdueDetails?.daysPastDue} days</div>
                        </div>
                        <div>
                          <span className="text-sm text-muted-foreground">Overdue Amount</span>
                          <div className="font-medium text-red-600">{formatCurrency(loanDetails.overdueDetails?.overdueAmount || 0)}</div>
                        </div>
                        <div>
                          <span className="text-sm text-muted-foreground">Penalty Charges</span>
                          <div className="font-medium text-red-600">{formatCurrency(loanDetails.overdueDetails?.penaltyCharges || 0)}</div>
                        </div>
                        <div>
                          <span className="text-sm text-muted-foreground">Last Contact</span>
                          <div className="font-medium">{safeFormatDate(loanDetails.overdueDetails?.lastContactDate, 'MMM dd, yyyy')}</div>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <span className="text-sm text-muted-foreground">Next Action</span>
                          <div className="font-medium">{loanDetails.overdueDetails?.nextAction}</div>
                        </div>
                        <div>
                          <span className="text-sm text-muted-foreground">Restructure Available</span>
                          <div className="flex items-center gap-2">
                            <Badge variant={loanDetails.overdueDetails?.restructureOption ? 'default' : 'secondary'}>
                              {loanDetails.overdueDetails?.restructureOption ? 'Yes' : 'No'}
                            </Badge>
                            {loanDetails.overdueDetails?.restructureOption && (
                              <Button variant="outline" size="sm">
                                Initiate Restructure
                              </Button>
                            )}
                          </div>
                        </div>
                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                          <div className="flex items-center gap-2 text-red-800">
                            <AlertTriangle className="h-4 w-4" />
                            <span className="font-medium">Immediate Action Required</span>
                          </div>
                          <p className="text-sm text-red-700 mt-1">
                            This loan requires immediate attention due to overdue payments.
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </div>

        {/* Payment Form Dialog */}
        <PaymentForm
          open={paymentFormOpen}
          onOpenChange={setPaymentFormOpen}
        />

        {/* Repayment Dialog */}
        <Dialog open={repayOpen} onOpenChange={setRepayOpen}>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle>Make Repayment</DialogTitle>
              <DialogDescription>Record a repayment for this loan.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Amount</Label>
                <Input type="number" value={repayAmount} onChange={(e) => setRepayAmount(Number(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select value={repayMethod} onValueChange={setRepayMethod}>
                  <SelectTrigger><SelectValue placeholder="Select method" /></SelectTrigger>
                  <SelectContent className="z-50">
                    {productPaymentTypes.length > 0 ? (
                      productPaymentTypes.map((pt: any) => (
                        <SelectItem key={pt.code} value={pt.code}>{pt.name || pt.code}</SelectItem>
                      ))
                    ) : (
                      <>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                        <SelectItem value="mpesa">M-Pesa</SelectItem>
                        <SelectItem value="cheque">Cheque</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      {repayDate ? format(repayDate, 'PPP') : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <DatePickerCalendar mode="single" selected={repayDate} onSelect={setRepayDate} className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>Reference (optional)</Label>
                <Input value={repayRef} onChange={(e) => setRepayRef(e.target.value)} />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setRepayOpen(false)}>Cancel</Button>
                <Button onClick={submitRepayment}>Submit</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Early Repayment Dialog */}
        <Dialog open={earlyRepayOpen} onOpenChange={setEarlyRepayOpen}>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle>Early Repayment</DialogTitle>
              <DialogDescription>Settle the outstanding balance and close the loan.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1">
                <Label>Outstanding</Label>
                <div className="text-lg font-semibold">{formatCurrency(outstanding)}</div>
              </div>
              <div className="space-y-2">
                <Label>Amount</Label>
                <Input type="number" value={earlyAmount || outstanding} onChange={(e) => setEarlyAmount(Number(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select value={earlyMethod} onValueChange={setEarlyMethod}>
                  <SelectTrigger><SelectValue placeholder="Select method" /></SelectTrigger>
                  <SelectContent className="z-50">
                    {productPaymentTypes.length > 0 ? (
                      productPaymentTypes.map((pt: any) => (
                        <SelectItem key={pt.code} value={pt.code}>{pt.name || pt.code}</SelectItem>
                      ))
                    ) : (
                      <>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                        <SelectItem value="mpesa">M-Pesa</SelectItem>
                        <SelectItem value="cheque">Cheque</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      {earlyDate ? format(earlyDate, 'PPP') : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <DatePickerCalendar mode="single" selected={earlyDate} onSelect={setEarlyDate} className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>Early settlement fee (optional)</Label>
                <Select value={earlyFeeId} onValueChange={setEarlyFeeId}>
                  <SelectTrigger><SelectValue placeholder="Select fee" /></SelectTrigger>
                  <SelectContent className="z-50">
                    {productFees && productFees.filter((f: any) => f.charge_time_type === 'early_settlement').length > 0 ? (
                      productFees
                        .filter((f: any) => f.charge_time_type === 'early_settlement')
                        .map((fee: any) => (
                          <SelectItem key={fee.id} value={fee.id}>{fee.name}</SelectItem>
                        ))
                    ) : (
                      <SelectItem value="none" disabled>No early settlement fees</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="rounded-md border p-3 bg-muted/30">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Base amount</span>
                  <span className="font-medium">{formatCurrency(Number(earlyAmount || outstanding))}</span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-sm text-muted-foreground">Early fee</span>
                  <span className="font-medium">{formatCurrency(Number(earlyFeeAmount || 0))}</span>
                </div>
                <Separator className="my-2" />
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">Total to pay</span>
                  <span className="text-base font-bold">{formatCurrency(Number(earlyAmount || outstanding) + Number(earlyFeeAmount || 0))}</span>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEarlyRepayOpen(false)}>Cancel</Button>
                <Button onClick={submitEarlyRepayment}>Settle & Close</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Write-Off Dialog */}
        <Dialog open={writeOffOpen} onOpenChange={setWriteOffOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-destructive">Write Off Loan</DialogTitle>
              <DialogDescription>Type WRITE-OFF to confirm. This will create write-off journal entries and mark the loan written off.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1">
                <Label>Outstanding balance to write off</Label>
                <div className="text-lg font-semibold">{formatCurrency(outstanding)}</div>
              </div>
              <div className="space-y-2">
                <Label>Write-off date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      {writeOffDate ? format(writeOffDate, 'PPP') : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <DatePickerCalendar mode="single" selected={writeOffDate} onSelect={setWriteOffDate} className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>Reason</Label>
                <Textarea value={writeOffReason} onChange={(e) => setWriteOffReason(e.target.value)} rows={3} />
              </div>
              <div className="space-y-2">
                <Label>Type WRITE-OFF to confirm</Label>
                <Input value={writeOffConfirm} onChange={(e) => setWriteOffConfirm(e.target.value)} placeholder="WRITE-OFF" />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setWriteOffOpen(false)}>Cancel</Button>
                <Button onClick={submitWriteOff} disabled={writeOffConfirm !== 'WRITE-OFF'} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Confirm Write-Off</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Add Charge/Fee Dialog */}
        <Dialog open={chargeOpen} onOpenChange={setChargeOpen}>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle>Add Loan Charge / Fee</DialogTitle>
              <DialogDescription>Pick a product-linked fee and amount.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Loan Fee</Label>
                <Select value={feeId} onValueChange={setFeeId}>
                  <SelectTrigger><SelectValue placeholder="Select fee" /></SelectTrigger>
                  <SelectContent>
                    {feeStructures.length === 0 ? (
                      <SelectItem value="none" disabled>No fees configured</SelectItem>
                    ) : (
                      feeStructures.filter((f: any) => f.fee_type === 'loan' && f.is_active).map((fee: any) => (
                        <SelectItem key={fee.id} value={fee.id}>{fee.name}</SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Amount</Label>
                <Input type="number" value={feeAmount} onChange={(e) => setFeeAmount(Number(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      {feeDate ? format(feeDate, 'PPP') : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <DatePickerCalendar mode="single" selected={feeDate} onSelect={setFeeDate} className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>Description (optional)</Label>
                <Input value={feeDesc} onChange={(e) => setFeeDesc(e.target.value)} />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setChargeOpen(false)}>Cancel</Button>
                <Button onClick={submitCharge}>Add Charge</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Transfer Overpaid Dialog */}
        <Dialog open={transferOpen} onOpenChange={setTransferOpen}>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle>Transfer Overpaid Amount</DialogTitle>
              <DialogDescription>Select a savings account to transfer {formatCurrency(derived.overpaidAmount)}.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Target Savings Account</Label>
                <Select value={selectedSavingsId ?? ''} onValueChange={setSelectedSavingsId as any}>
                  <SelectTrigger><SelectValue placeholder="Select account" /></SelectTrigger>
                  <SelectContent>
                    {savingsAccounts.map((a: any) => (
                      <SelectItem key={a.id} value={a.id}>{a.account_number} · Bal {formatCurrency(a.account_balance)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setTransferOpen(false)}>Cancel</Button>
                <Button onClick={handleTransferExcess} disabled={!selectedSavingsId || derived.overpaidAmount <= 0}>Transfer</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Recovery Dialog (written-off) */}
        <Dialog open={recoveryOpen} onOpenChange={setRecoveryOpen}>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle>Record Recovery</DialogTitle>
              <DialogDescription>Record cash recovered from a written-off loan.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Amount</Label>
                <Input type="number" value={recoveryAmount} onChange={(e) => setRecoveryAmount(Number(e.target.value))} />
              </div>
              <div className="space-y-2">
                <Label>Method</Label>
                <Select value={recoveryMethod} onValueChange={setRecoveryMethod}>
                  <SelectTrigger><SelectValue placeholder="Select method" /></SelectTrigger>
                  <SelectContent className="z-50">
                    {productPaymentTypes.length > 0 ? (
                      productPaymentTypes.map((pt: any) => (
                        <SelectItem key={pt.code} value={pt.code}>{pt.name || pt.code}</SelectItem>
                      ))
                    ) : (
                      <>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                        <SelectItem value="mpesa">M-Pesa</SelectItem>
                        <SelectItem value="cheque">Cheque</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      {recoveryDate ? format(recoveryDate, 'PPP') : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <DatePickerCalendar mode="single" selected={recoveryDate} onSelect={setRecoveryDate} className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setRecoveryOpen(false)}>Cancel</Button>
                <Button onClick={submitRecovery}>Record Recovery</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
};