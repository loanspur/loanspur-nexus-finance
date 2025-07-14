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
  PiggyBank, 
  Calendar, 
  DollarSign, 
  FileText, 
  History,
  CheckCircle,
  Clock,
  XCircle,
  TrendingUp,
  Download,
  Eye,
  Plus,
  Minus
} from "lucide-react";
import { format } from "date-fns";
import { QuickPaymentForm } from "@/components/forms/QuickPaymentForm";
import { TransactionStatement } from "@/components/statements/TransactionStatement";
import { SavingsTransactionForm } from "@/components/forms/SavingsTransactionForm";

interface SavingsDetailsDialogProps {
  savings: any;
  clientName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SavingsDetailsDialog = ({ savings, clientName, open, onOpenChange }: SavingsDetailsDialogProps) => {
  const [transactionFormOpen, setTransactionFormOpen] = useState(false);
  
  if (!savings) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
    }).format(amount);
  };

  const formatDate = (dateValue: string | null | undefined) => {
    if (!dateValue) return 'N/A';
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return 'N/A';
    return format(date, 'MMM dd, yyyy');
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'default';
      case 'pending_approval':
        return 'secondary';
      case 'closed':
      case 'matured':
        return 'outline';
      case 'dormant':
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
        return <Clock className="h-3 w-3" />;
      case 'closed':
      case 'matured':
        return <XCircle className="h-3 w-3" />;
      default:
        return <Clock className="h-3 w-3" />;
    }
  };

  // Mock data for comprehensive savings details
  const savingsDetails = {
    ...savings,
    openingDate: savings.status === 'pending_approval' ? null : "2023-03-15",
    totalDeposits: savings.status === 'pending_approval' ? 0 : 150000,
    totalWithdrawals: savings.status === 'pending_approval' ? 0 : 5000,
    interestEarned: savings.status === 'pending_approval' ? 0 : 5250,
    minimumBalance: 1000,
    averageBalance: savings.status === 'pending_approval' ? 0 : 35000,
    numberOfTransactions: savings.status === 'pending_approval' ? 0 : 25,
    lastInterestPosting: savings.status === 'pending_approval' ? null : "2024-01-31",
    nextInterestPosting: savings.status === 'pending_approval' ? null : "2024-02-29",
    accountOfficer: "Sarah Njeri",
    
    // Status-specific details
    approvalStatus: savings.status === 'pending_approval' ? {
      submittedDate: "2024-01-15",
      reviewStage: "Documentation Review",
      approver: "Jane Smith",
      estimatedApproval: "2024-01-22",
      requiredDocuments: ["ID verification", "Initial deposit"],
      comments: "Waiting for initial deposit confirmation"
    } : null,
    
    closureDetails: savings.status === 'closed' ? {
      closureDate: "2024-12-15",
      closureReason: "Customer request",
      finalBalance: 0,
      transferredTo: "Primary Checking Account",
      closedBy: "Sarah Njeri",
      certificateGenerated: true
    } : null,
    
    maturityDetails: savings.status === 'matured' && savings.type === 'Fixed Deposit' ? {
      maturityDate: "2024-03-15",
      maturityAmount: 125000,
      interestEarned: 25000,
      renewalOption: true,
      autoRenewal: false
    } : null
  };

  const transactionHistory = savings.status === 'pending_approval' ? [] : [
    { date: "2024-01-28", type: "Deposit", amount: 5000, balance: 45000, method: "Cash", reference: "DEP001" },
    { date: "2024-01-25", type: "Interest", amount: 125, balance: 40125, method: "Auto", reference: "INT001" },
    { date: "2024-01-20", type: "Deposit", amount: 5000, balance: 40000, method: "Bank Transfer", reference: "DEP002" },
    { date: "2024-01-15", type: "Withdrawal", amount: 2000, balance: 35000, method: "ATM", reference: "WTH001" },
    { date: "2024-01-10", type: "Deposit", amount: 5000, balance: 37000, method: "M-Pesa", reference: "DEP003" },
  ];

  const interestHistory = savings.status === 'pending_approval' ? [] : [
    { month: "January 2024", rate: 3.5, amount: 125, balance: 45000 },
    { month: "December 2023", rate: 3.5, amount: 115, balance: 40000 },
    { month: "November 2023", rate: 3.5, amount: 110, balance: 38000 },
    { month: "October 2023", rate: 3.5, amount: 105, balance: 36000 },
  ];

  const documents = [
    { name: "Account Opening Form", type: "Application", date: "2023-03-15", status: savings.status === 'pending_approval' ? "Pending" : "Signed" },
    { name: "Terms and Conditions", type: "Agreement", date: "2023-03-15", status: savings.status === 'pending_approval' ? "Under Review" : "Accepted" },
    { name: "Interest Rate Certificate", type: "Certificate", date: "2023-03-15", status: savings.status === 'closed' ? "Expired" : "Active" },
    { name: "Monthly Statement - Jan 2024", type: "Statement", date: "2024-01-31", status: savings.status === 'pending_approval' ? "Not Available" : "Generated" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PiggyBank className="h-5 w-5 text-green-600" />
            Savings Account Details - {savingsDetails.type}
          </DialogTitle>
          <DialogDescription>
            Comprehensive view for {clientName}'s savings account {savingsDetails.id}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <Tabs defaultValue="overview" className="h-full">
            <TabsList className="w-full justify-start mb-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="transactions" disabled={savings.status === 'pending_approval'}>Transactions</TabsTrigger>
              <TabsTrigger value="interest" disabled={savings.status === 'pending_approval'}>Interest History</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              {savings.status === 'pending_approval' && <TabsTrigger value="approval">Approval Details</TabsTrigger>}
              {savings.status === 'closed' && <TabsTrigger value="closure">Closure Details</TabsTrigger>}
              {savings.status === 'matured' && <TabsTrigger value="maturity">Maturity Details</TabsTrigger>}
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Account Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Current Balance</p>
                        <p className="text-2xl font-bold text-green-600">{formatCurrency(savingsDetails.balance)}</p>
                      </div>
                      <DollarSign className="h-8 w-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Interest Rate</p>
                        <p className="text-2xl font-bold">{savingsDetails.interestRate}%</p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Interest Earned</p>
                        <p className="text-2xl font-bold text-green-500">{formatCurrency(savingsDetails.interestEarned)}</p>
                      </div>
                      <Plus className="h-8 w-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Status</p>
                        <Badge variant={getStatusColor(savingsDetails.status)} className="mt-1">
                          {getStatusIcon(savingsDetails.status)}
                          <span className="ml-1">{savingsDetails.status}</span>
                        </Badge>
                      </div>
                      <CheckCircle className="h-8 w-8 text-primary" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Account Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Account Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Account ID</span>
                        <div className="font-medium">{savingsDetails.id}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Account Type</span>
                        <div className="font-medium">{savingsDetails.type}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Opening Date</span>
                        <div className="font-medium">{formatDate(savingsDetails.openingDate)}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Interest Rate</span>
                        <div className="font-medium">{savingsDetails.interestRate}% p.a.</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Minimum Balance</span>
                        <div className="font-medium">{formatCurrency(savingsDetails.minimumBalance)}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Monthly Contribution</span>
                        <div className="font-medium">{formatCurrency(savingsDetails.monthlyContribution)}</div>
                      </div>
                      {savingsDetails.type === 'Fixed Deposit' && savingsDetails.maturityDate && (
                        <div>
                          <span className="text-muted-foreground">Maturity Date</span>
                          <div className="font-medium">{formatDate(savingsDetails.maturityDate)}</div>
                        </div>
                      )}
                      <div>
                        <span className="text-muted-foreground">Account Officer</span>
                        <div className="font-medium">{savingsDetails.accountOfficer}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Transaction Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle>Transaction Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Total Deposits</span>
                        <div className="font-medium text-green-600">{formatCurrency(savingsDetails.totalDeposits)}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Total Withdrawals</span>
                        <div className="font-medium text-red-600">{formatCurrency(savingsDetails.totalWithdrawals)}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Interest Earned</span>
                        <div className="font-medium text-blue-600">{formatCurrency(savingsDetails.interestEarned)}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Average Balance</span>
                        <div className="font-medium">{formatCurrency(savingsDetails.averageBalance)}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Total Transactions</span>
                        <div className="font-medium">{savingsDetails.numberOfTransactions}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Last Transaction</span>
                        <div className="font-medium">{formatDate(savingsDetails.lastTransaction)}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Interest Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Interest Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Current Rate</span>
                        <div className="font-medium">{savingsDetails.interestRate}% p.a.</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Total Interest Earned</span>
                        <div className="font-medium text-green-600">{formatCurrency(savingsDetails.interestEarned)}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Last Interest Posting</span>
                        <div className="font-medium">{formatDate(savingsDetails.lastInterestPosting)}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Next Interest Posting</span>
                        <div className="font-medium">{formatDate(savingsDetails.nextInterestPosting)}</div>
                      </div>
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
                      onClick={() => setTransactionFormOpen(true)}
                    >
                      <DollarSign className="h-4 w-4 mr-2" />
                      New Transaction
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => {
                        import('@/lib/statement-generator').then(({ generateSavingsStatement }) => {
                          generateSavingsStatement({
                            savings,
                            clientName,
                            transactionHistory,
                            savingsDetails
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
            <TabsContent value="transactions" className="space-y-6">
              <TransactionStatement
                transactions={transactionHistory.map(transaction => ({
                  date: transaction.date,
                  type: transaction.type,
                  amount: transaction.amount,
                  balance: transaction.balance,
                  method: transaction.method,
                  reference: transaction.reference,
                  description: transaction.type === 'Interest' ? 'Monthly interest posting' : undefined
                }))}
                accountType="savings"
                accountNumber={savingsDetails.id}
                clientName={clientName}
                accountDetails={{
                  balance: savingsDetails.balance,
                  interestRate: savingsDetails.interestRate,
                  openingDate: savingsDetails.openingDate || undefined,
                  accountOfficer: savingsDetails.accountOfficer
                }}
                statementPeriod={{
                  from: transactionHistory.length > 0 ? transactionHistory[transactionHistory.length - 1].date : new Date().toISOString(),
                  to: transactionHistory.length > 0 ? transactionHistory[0].date : new Date().toISOString()
                }}
              />
            </TabsContent>

            {/* Interest History Tab */}
            <TabsContent value="interest" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Interest History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {interestHistory.map((interest, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="w-3 h-3 rounded-full bg-blue-500" />
                          <div>
                            <div className="font-medium">{interest.month}</div>
                            <div className="text-sm text-muted-foreground">
                              Rate: {interest.rate}% p.a.
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-blue-600">
                            +{formatCurrency(interest.amount)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            On: {formatCurrency(interest.balance)}
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
                    Account Documents
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
                          <Badge variant={doc.status === 'Signed' || doc.status === 'Accepted' || doc.status === 'Active' || doc.status === 'Generated' ? 'default' : 'secondary'}>
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
            {savings.status === 'pending_approval' && (
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
                          <div className="font-medium">{format(new Date(savingsDetails.approvalStatus?.submittedDate || ''), 'MMM dd, yyyy')}</div>
                        </div>
                        <div>
                          <span className="text-sm text-muted-foreground">Current Stage</span>
                          <div className="font-medium">{savingsDetails.approvalStatus?.reviewStage}</div>
                        </div>
                        <div>
                          <span className="text-sm text-muted-foreground">Assigned Approver</span>
                          <div className="font-medium">{savingsDetails.approvalStatus?.approver}</div>
                        </div>
                        <div>
                          <span className="text-sm text-muted-foreground">Estimated Approval</span>
                          <div className="font-medium">{format(new Date(savingsDetails.approvalStatus?.estimatedApproval || ''), 'MMM dd, yyyy')}</div>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <span className="text-sm text-muted-foreground">Required Documents</span>
                          <div className="mt-2 space-y-1">
                            {savingsDetails.approvalStatus?.requiredDocuments.map((doc: string, index: number) => (
                              <div key={index} className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-yellow-500" />
                                <span className="text-sm">{doc}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <span className="text-sm text-muted-foreground">Comments</span>
                          <div className="mt-1 p-3 bg-muted rounded-md text-sm">{savingsDetails.approvalStatus?.comments}</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {/* Closure Details Tab */}
            {savings.status === 'closed' && (
              <TabsContent value="closure" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <XCircle className="h-5 w-5 text-gray-600" />
                      Account Closure Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <span className="text-sm text-muted-foreground">Closure Date</span>
                          <div className="font-medium">{format(new Date(savingsDetails.closureDetails?.closureDate || ''), 'MMM dd, yyyy')}</div>
                        </div>
                        <div>
                          <span className="text-sm text-muted-foreground">Closure Reason</span>
                          <div className="font-medium">{savingsDetails.closureDetails?.closureReason}</div>
                        </div>
                        <div>
                          <span className="text-sm text-muted-foreground">Final Balance</span>
                          <div className="font-medium">{formatCurrency(savingsDetails.closureDetails?.finalBalance || 0)}</div>
                        </div>
                        <div>
                          <span className="text-sm text-muted-foreground">Closed By</span>
                          <div className="font-medium">{savingsDetails.closureDetails?.closedBy}</div>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <span className="text-sm text-muted-foreground">Amount Transferred</span>
                          <div className="font-medium">{savingsDetails.closureDetails?.transferredTo}</div>
                        </div>
                        <div>
                          <span className="text-sm text-muted-foreground">Closure Certificate</span>
                          <div className="flex items-center gap-2">
                            <Badge variant={savingsDetails.closureDetails?.certificateGenerated ? 'default' : 'secondary'}>
                              {savingsDetails.closureDetails?.certificateGenerated ? 'Generated' : 'Pending'}
                            </Badge>
                            {savingsDetails.closureDetails?.certificateGenerated && (
                              <Button variant="outline" size="sm">
                                <Download className="h-4 w-4 mr-2" />
                                Download
                              </Button>
                            )}
                          </div>
                        </div>
                        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                          <div className="flex items-center gap-2 text-gray-800">
                            <XCircle className="h-4 w-4" />
                            <span className="font-medium">Account Closed</span>
                          </div>
                          <p className="text-sm text-gray-700 mt-1">
                            This savings account has been permanently closed.
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {/* Maturity Details Tab */}
            {savings.status === 'matured' && (
              <TabsContent value="maturity" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-blue-600" />
                      Maturity Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <span className="text-sm text-muted-foreground">Maturity Date</span>
                          <div className="font-medium">{format(new Date(savingsDetails.maturityDetails?.maturityDate || ''), 'MMM dd, yyyy')}</div>
                        </div>
                        <div>
                          <span className="text-sm text-muted-foreground">Maturity Amount</span>
                          <div className="font-medium text-green-600">{formatCurrency(savingsDetails.maturityDetails?.maturityAmount || 0)}</div>
                        </div>
                        <div>
                          <span className="text-sm text-muted-foreground">Interest Earned</span>
                          <div className="font-medium text-blue-600">{formatCurrency(savingsDetails.maturityDetails?.interestEarned || 0)}</div>
                        </div>
                        <div>
                          <span className="text-sm text-muted-foreground">Renewal Available</span>
                          <div className="font-medium">{savingsDetails.maturityDetails?.renewalOption ? 'Yes' : 'No'}</div>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <span className="text-sm text-muted-foreground">Auto Renewal</span>
                          <div className="font-medium">{savingsDetails.maturityDetails?.autoRenewal ? 'Enabled' : 'Disabled'}</div>
                        </div>
                        <div className="space-y-2">
                          <span className="text-sm text-muted-foreground">Actions</span>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              Renew Fixed Deposit
                            </Button>
                            <Button variant="outline" size="sm">
                              Withdraw Amount
                            </Button>
                          </div>
                        </div>
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-center gap-2 text-blue-800">
                            <TrendingUp className="h-4 w-4" />
                            <span className="font-medium">Fixed Deposit Matured</span>
                          </div>
                          <p className="text-sm text-blue-700 mt-1">
                            Your fixed deposit has reached maturity. Choose to renew or withdraw.
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

        {/* Savings Transaction Form */}
        <SavingsTransactionForm
          open={transactionFormOpen}
          onOpenChange={setTransactionFormOpen}
          savingsAccount={{
            id: savings?.id || "",
            account_balance: savings?.account_balance || 0,
            savings_products: savings?.savings_products,
            account_number: savings?.account_number || "",
          }}
          onSuccess={() => {
            setTransactionFormOpen(false);
            // Refresh savings data
            console.log("Transaction completed, refreshing data...");
          }}
        />
      </DialogContent>
    </Dialog>
  );
};