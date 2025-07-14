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
import { TransactionStatement } from "@/components/statements/TransactionStatement";

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
              <TabsTrigger value="payments" disabled={loan.status === 'pending_approval'}>Payment History</TabsTrigger>
              <TabsTrigger value="schedule" disabled={loan.status === 'pending_approval' || loan.status === 'closed'}>Schedule</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
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
                      {loanDetails.disbursementDate && (
                        <div>
                          <span className="text-muted-foreground">Disbursement Date</span>
                          <div className="font-medium">{format(new Date(loanDetails.disbursementDate), 'MMM dd, yyyy')}</div>
                        </div>
                      )}
                      {loanDetails.maturityDate && (
                        <div>
                          <span className="text-muted-foreground">Maturity Date</span>
                          <div className="font-medium">{format(new Date(loanDetails.maturityDate), 'MMM dd, yyyy')}</div>
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

            {/* Payment History Tab - Statement Format */}
            <TabsContent value="payments" className="space-y-6">
              <TransactionStatement
                transactions={paymentHistory.map(payment => ({
                  date: payment.date,
                  type: payment.type,
                  amount: payment.amount,
                  balance: payment.balance,
                  reference: `PAY${payment.date.replace(/-/g, '')}`,
                  status: payment.status,
                  description: payment.type === 'Regular Payment' ? 'Monthly loan payment' : payment.type
                }))}
                accountType="loan"
                accountNumber={loanDetails.id}
                clientName={clientName}
                accountDetails={{
                  balance: loanDetails.outstanding,
                  interestRate: loanDetails.interestRate,
                  openingDate: loanDetails.disbursementDate || undefined,
                  accountOfficer: loanDetails.loanOfficer
                }}
                statementPeriod={{
                  from: paymentHistory.length > 0 ? paymentHistory[paymentHistory.length - 1].date : new Date().toISOString(),
                  to: paymentHistory.length > 0 ? paymentHistory[0].date : new Date().toISOString()
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
                          <div className="font-medium">{format(new Date(loanDetails.approvalStatus?.submittedDate || ''), 'MMM dd, yyyy')}</div>
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
                          <div className="font-medium">{format(new Date(loanDetails.approvalStatus?.estimatedApproval || ''), 'MMM dd, yyyy')}</div>
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
                          <div className="font-medium">{format(new Date(loanDetails.closureDetails?.closureDate || ''), 'MMM dd, yyyy')}</div>
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
                          <div className="font-medium">{format(new Date(loanDetails.overdueDetails?.lastContactDate || ''), 'MMM dd, yyyy')}</div>
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