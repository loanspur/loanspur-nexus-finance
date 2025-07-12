import { useState } from "react";
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
  Calculator
} from "lucide-react";
import { format } from "date-fns";
import { QuickPaymentForm } from "@/components/forms/QuickPaymentForm";
import { LoanCalculatorDialog } from "@/components/forms/LoanCalculatorDialog";

interface LoanDetailsDialogProps {
  loan: any;
  clientName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const LoanDetailsDialog = ({ loan, clientName, open, onOpenChange }: LoanDetailsDialogProps) => {
  const [paymentFormOpen, setPaymentFormOpen] = useState(false);
  const [calculatorOpen, setCalculatorOpen] = useState(false);
  
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
      case 'overdue':
        return <AlertTriangle className="h-3 w-3" />;
      default:
        return <Clock className="h-3 w-3" />;
    }
  };

  // Mock data for comprehensive loan details
  const loanDetails = {
    ...loan,
    disbursementDate: "2023-06-15",
    maturityDate: "2025-06-15",
    interestRate: 12.5,
    paymentFrequency: "Monthly",
    remainingTerm: 18,
    totalTerm: 24,
    principalPaid: loan.amount - loan.outstanding,
    interestPaid: 25000,
    totalPayments: 15,
    missedPayments: 1,
    latePayments: 2,
    collateral: "Vehicle - Toyota Corolla 2020",
    purpose: "Business expansion",
    guarantor: "Mary Wanjiku",
    loanOfficer: "John Kamau"
  };

  const paymentHistory = [
    { date: "2024-01-15", amount: 12500, type: "Regular Payment", status: "Paid", balance: 75000 },
    { date: "2023-12-15", amount: 12500, type: "Regular Payment", status: "Paid", balance: 87500 },
    { date: "2023-11-15", amount: 0, type: "Regular Payment", status: "Missed", balance: 87500 },
    { date: "2023-10-20", amount: 12500, type: "Regular Payment", status: "Late (5 days)", balance: 87500 },
    { date: "2023-09-15", amount: 12500, type: "Regular Payment", status: "Paid", balance: 100000 },
  ];

  const upcomingPayments = [
    { date: "2024-02-15", amount: 12500, type: "Regular Payment", status: "Due" },
    { date: "2024-03-15", amount: 12500, type: "Regular Payment", status: "Scheduled" },
    { date: "2024-04-15", amount: 12500, type: "Regular Payment", status: "Scheduled" },
  ];

  const documents = [
    { name: "Loan Agreement", type: "Contract", date: "2023-06-15", status: "Signed" },
    { name: "Collateral Valuation", type: "Valuation", date: "2023-06-10", status: "Verified" },
    { name: "Income Verification", type: "Financial", date: "2023-06-08", status: "Verified" },
    { name: "Insurance Certificate", type: "Insurance", date: "2023-06-12", status: "Active" },
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
              <TabsTrigger value="payments">Payment History</TabsTrigger>
              <TabsTrigger value="schedule">Schedule</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
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
                        <Badge variant={getStatusColor(loanDetails.status)} className="mt-1">
                          {getStatusIcon(loanDetails.status)}
                          <span className="ml-1">{loanDetails.status}</span>
                        </Badge>
                      </div>
                      <CheckCircle className="h-8 w-8 text-primary" />
                    </div>
                  </CardContent>
                </Card>
              </div>

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
                      <div>
                        <span className="text-muted-foreground">Disbursement Date</span>
                        <div className="font-medium">{format(new Date(loanDetails.disbursementDate), 'MMM dd, yyyy')}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Maturity Date</span>
                        <div className="font-medium">{format(new Date(loanDetails.maturityDate), 'MMM dd, yyyy')}</div>
                      </div>
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
                        <div className="font-medium">{format(new Date(loanDetails.nextPayment), 'MMM dd, yyyy')}</div>
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
                    <Button variant="outline" className="w-full justify-start">
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

            {/* Payment History Tab */}
            <TabsContent value="payments" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5" />
                    Payment History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {paymentHistory.map((payment, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className={`w-3 h-3 rounded-full ${
                            payment.status === 'Paid' ? 'bg-green-500' : 
                            payment.status === 'Missed' ? 'bg-red-500' : 'bg-yellow-500'
                          }`} />
                          <div>
                            <div className="font-medium">{payment.type}</div>
                            <div className="text-sm text-muted-foreground">
                              {format(new Date(payment.date), 'MMM dd, yyyy')}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{formatCurrency(payment.amount)}</div>
                          <div className={`text-sm ${
                            payment.status === 'Paid' ? 'text-green-600' : 
                            payment.status === 'Missed' ? 'text-red-600' : 'text-yellow-600'
                          }`}>
                            {payment.status}
                          </div>
                        </div>
                        <div className="text-right text-sm text-muted-foreground">
                          Balance: {formatCurrency(payment.balance)}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
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
                              {format(new Date(payment.date), 'MMM dd, yyyy')}
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
                              {doc.type} • {format(new Date(doc.date), 'MMM dd, yyyy')}
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