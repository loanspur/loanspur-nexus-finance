import { useState, useMemo } from "react";
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
import { QuickPaymentForm } from "@/components/forms/QuickPaymentForm";
import { LoanCalculatorDialog } from "@/components/forms/LoanCalculatorDialog";
import { TransactionStatement } from "@/components/statements/TransactionStatement";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { useLoanSchedules } from "@/hooks/useLoanManagement";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

  // Derived status: in_arrears and overpaid
  const { data: schedules = [] } = useLoanSchedules(loan?.id);

  const { data: payments = [] } = useQuery({
    queryKey: ['loan-payments', loan?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('loan_payments')
        .select('payment_amount, payment_date')
        .eq('loan_id', loan.id);
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
        .select('account_balance')
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
        });
      if (txErr) throw txErr;

      toast({ title: 'Excess transferred', description: 'Overpaid amount transferred to savings.' });
      setTransferOpen(false);
      setSelectedSavingsId(null);
    } catch (e: any) {
      toast({ title: 'Transfer failed', description: e.message || 'Could not transfer excess.', variant: 'destructive' });
    }
  };

  if (!loan) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
    }).format(amount);
  };

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

  // Mock data for comprehensive loan details
  const loanDetails = {
    ...loan,
    disbursementDate: loan.status === 'pending_approval' ? null : "2023-06-15",
    maturityDate: loan.status === 'closed' ? "2024-12-15" : "2025-06-15",
    interestRate: 12.5,
    paymentFrequency: "Monthly",
    remainingTerm: loan.status === 'closed' ? 0 : 18,
    totalTerm: 24,
    principalPaid: loan.amount - loan.outstanding,
    interestPaid: 25000,
    totalPayments: loan.status === 'pending_approval' ? 0 : 15,
    missedPayments: loan.status === 'pending_approval' ? 0 : 1,
    latePayments: loan.status === 'pending_approval' ? 0 : 2,
    collateral: "Vehicle - Toyota Corolla 2020",
    purpose: "Business expansion",
    guarantor: "Mary Wanjiku",
    loanOfficer: "John Kamau",
    
    // Status-specific details
    approvalStatus: loan.status === 'pending_approval' ? {
      submittedDate: "2024-01-15",
      reviewStage: "Credit Assessment",
      approver: "Jane Smith",
      estimatedApproval: "2024-01-25",
      requiredDocuments: ["Income verification", "Collateral valuation"],
      comments: "Pending final credit check and collateral verification"
    } : null,
    
    closureDetails: loan.status === 'closed' ? {
      closureDate: "2024-12-15",
      closureReason: "Fully repaid",
      finalPayment: 12500,
      totalAmountPaid: 300000,
      closedBy: "John Kamau",
      certificateGenerated: true
    } : null,
    
    overdueDetails: loan.status === 'overdue' ? {
      daysPastDue: 15,
      overdueAmount: 12500,
      penaltyCharges: 1250,
      lastContactDate: "2024-01-20",
      nextAction: "Field visit scheduled",
      restructureOption: true
    } : null
  };

  const paymentHistory = loan.status === 'pending_approval' ? [] : [
    { date: "2024-01-15", amount: 12500, type: "Regular Payment", status: "Paid", balance: 75000 },
    { date: "2023-12-15", amount: 12500, type: "Regular Payment", status: "Paid", balance: 87500 },
    { date: "2023-11-15", amount: 0, type: "Regular Payment", status: "Missed", balance: 87500 },
    { date: "2023-10-20", amount: 12500, type: "Regular Payment", status: "Late (5 days)", balance: 87500 },
    { date: "2023-09-15", amount: 12500, type: "Regular Payment", status: "Paid", balance: 100000 },
  ];

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

  const upcomingPayments = loan.status === 'pending_approval' || loan.status === 'closed' ? [] : [
    { date: "2024-02-15", amount: 12500, type: "Regular Payment", status: "Due" },
    { date: "2024-03-15", amount: 12500, type: "Regular Payment", status: "Scheduled" },
    { date: "2024-04-15", amount: 12500, type: "Regular Payment", status: "Scheduled" },
  ];

  const documents = [
    { name: "Loan Agreement", type: "Contract", date: "2023-06-15", status: loan.status === 'pending_approval' ? "Pending" : "Signed" },
    { name: "Collateral Valuation", type: "Valuation", date: "2023-06-10", status: loan.status === 'pending_approval' ? "Under Review" : "Verified" },
    { name: "Income Verification", type: "Financial", date: "2023-06-08", status: "Verified" },
    { name: "Insurance Certificate", type: "Insurance", date: "2023-06-12", status: loan.status === 'closed' ? "Expired" : "Active" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-orange-600" />
            Loan Details - {loanDetails.type}
          </DialogTitle>
          <DialogDescription>
            Comprehensive view for {clientName}'s loan account {loanDetails.id}
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
              <TabsTrigger value="repay" disabled={loan.status !== 'active'}>Make Repayment</TabsTrigger>
              <TabsTrigger value="accruals">Accruals</TabsTrigger>
              <TabsTrigger value="collateral">Collaterals</TabsTrigger>
              <TabsTrigger value="guarantors">Guarantors</TabsTrigger>
              <TabsTrigger value="clear" disabled={loan.status !== 'active'}>Clear Loan</TabsTrigger>
              <TabsTrigger value="writeoff" disabled={loan.status === 'closed'}>Write Off</TabsTrigger>
              {loan.status === 'pending_approval' && <TabsTrigger value="approval">Approval Details</TabsTrigger>}
              {loan.status === 'closed' && <TabsTrigger value="closure">Closure Details</TabsTrigger>}
              {loan.status === 'overdue' && <TabsTrigger value="recovery">Recovery</TabsTrigger>}
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Loan Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

                {/* Collateral & Guarantor */}
                <Card>
                  <CardHeader>
                    <CardTitle>Security & Guarantor</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <span className="text-sm text-muted-foreground">Collateral</span>
                      <div className="font-medium">{loanDetails.collateral}</div>
                    </div>
                    <Separator />
                    <div>
                      <span className="text-sm text-muted-foreground">Guarantor</span>
                      <div className="font-medium">{loanDetails.guarantor}</div>
                    </div>
                    <Separator />
                    <div>
                      <span className="text-sm text-muted-foreground">Loan Officer</span>
                      <div className="font-medium">{loanDetails.loanOfficer}</div>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => setPaymentFormOpen(true)}
                    >
                      <DollarSign className="h-4 w-4 mr-2" />
                      Record Payment
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => setCalculatorOpen(true)}
                    >
                      <Calculator className="h-4 w-4 mr-2" />
                      Calculate Payment
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => {
                        import('@/lib/statement-generator').then(({ generateLoanStatement }) => {
                          generateLoanStatement({
                            loan,
                            clientName,
                            paymentHistory,
                            loanDetails
                          });
                        });
                      }}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Statement
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <FileText className="h-4 w-4 mr-2" />
                      Generate Report
                    </Button>
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
                    {documents.map((doc, index) => (
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
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* New CTA Tabs */}
            <TabsContent value="repay" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Make Loan Repayment
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => setPaymentFormOpen(true)} className="bg-gradient-primary">Open Payment Form</Button>
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

            <TabsContent value="accruals" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5" />
                    Accruals
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">View accruals in Accounting &gt; Accruals. Per-loan accruals can be added in future.</p>
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

            <TabsContent value="clear" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    Clear Loan
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">Mark loan as fully paid and close the account.</p>
                  <Button onClick={handleClearLoan} variant="outline">Clear Loan</Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="writeoff" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    Write Off Loan
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">Write off the remaining balance and mark the loan as written off.</p>
                  <Button onClick={handleWriteOffLoan} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Write Off</Button>
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
        <QuickPaymentForm
          open={paymentFormOpen}
          onOpenChange={setPaymentFormOpen}
          type="loan_payment"
          accountId={loanDetails.id}
          clientName={clientName}
          maxAmount={loanDetails.outstanding}
        />

        {/* Loan Calculator Dialog */}
        <LoanCalculatorDialog
          open={calculatorOpen}
          onOpenChange={setCalculatorOpen}
          loanData={{
            amount: loanDetails.amount,
            interestRate: loanDetails.interestRate,
            termMonths: loanDetails.totalTerm,
          }}
        />
      </DialogContent>
    </Dialog>
  );
};