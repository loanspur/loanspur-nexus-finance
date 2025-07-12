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

interface SavingsDetailsDialogProps {
  savings: any;
  clientName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SavingsDetailsDialog = ({ savings, clientName, open, onOpenChange }: SavingsDetailsDialogProps) => {
  if (!savings) return null;

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
    openingDate: "2023-03-15",
    totalDeposits: 150000,
    totalWithdrawals: 5000,
    interestEarned: 5250,
    minimumBalance: 1000,
    averageBalance: 35000,
    numberOfTransactions: 25,
    lastInterestPosting: "2024-01-31",
    nextInterestPosting: "2024-02-29",
    accountOfficer: "Sarah Njeri"
  };

  const transactionHistory = [
    { date: "2024-01-28", type: "Deposit", amount: 5000, balance: 45000, method: "Cash", reference: "DEP001" },
    { date: "2024-01-25", type: "Interest", amount: 125, balance: 40125, method: "Auto", reference: "INT001" },
    { date: "2024-01-20", type: "Deposit", amount: 5000, balance: 40000, method: "Bank Transfer", reference: "DEP002" },
    { date: "2024-01-15", type: "Withdrawal", amount: 2000, balance: 35000, method: "ATM", reference: "WTH001" },
    { date: "2024-01-10", type: "Deposit", amount: 5000, balance: 37000, method: "M-Pesa", reference: "DEP003" },
  ];

  const interestHistory = [
    { month: "January 2024", rate: 3.5, amount: 125, balance: 45000 },
    { month: "December 2023", rate: 3.5, amount: 115, balance: 40000 },
    { month: "November 2023", rate: 3.5, amount: 110, balance: 38000 },
    { month: "October 2023", rate: 3.5, amount: 105, balance: 36000 },
  ];

  const documents = [
    { name: "Account Opening Form", type: "Application", date: "2023-03-15", status: "Signed" },
    { name: "Terms and Conditions", type: "Agreement", date: "2023-03-15", status: "Accepted" },
    { name: "Interest Rate Certificate", type: "Certificate", date: "2023-03-15", status: "Active" },
    { name: "Monthly Statement - Jan 2024", type: "Statement", date: "2024-01-31", status: "Generated" },
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
              <TabsTrigger value="transactions">Transactions</TabsTrigger>
              <TabsTrigger value="interest">Interest History</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
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
                        <div className="font-medium">{format(new Date(savingsDetails.openingDate), 'MMM dd, yyyy')}</div>
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
                          <div className="font-medium">{format(new Date(savingsDetails.maturityDate), 'MMM dd, yyyy')}</div>
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
                        <div className="font-medium">{format(new Date(savingsDetails.lastTransaction), 'MMM dd, yyyy')}</div>
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
                        <div className="font-medium">{format(new Date(savingsDetails.lastInterestPosting), 'MMM dd, yyyy')}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Next Interest Posting</span>
                        <div className="font-medium">{format(new Date(savingsDetails.nextInterestPosting), 'MMM dd, yyyy')}</div>
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
                    <Button variant="outline" className="w-full justify-start">
                      <Plus className="h-4 w-4 mr-2" />
                      Make Deposit
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Minus className="h-4 w-4 mr-2" />
                      Make Withdrawal
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

            {/* Transactions Tab */}
            <TabsContent value="transactions" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5" />
                    Transaction History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {transactionHistory.map((transaction, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className={`w-3 h-3 rounded-full ${
                            transaction.type === 'Deposit' || transaction.type === 'Interest' ? 'bg-green-500' : 'bg-red-500'
                          }`} />
                          <div>
                            <div className="font-medium">{transaction.type}</div>
                            <div className="text-sm text-muted-foreground">
                              {format(new Date(transaction.date), 'MMM dd, yyyy')} • {transaction.method}
                            </div>
                            <div className="text-xs text-muted-foreground">Ref: {transaction.reference}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`font-medium ${
                            transaction.type === 'Deposit' || transaction.type === 'Interest' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {transaction.type === 'Deposit' || transaction.type === 'Interest' ? '+' : '-'}{formatCurrency(transaction.amount)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Balance: {formatCurrency(transaction.balance)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
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
          </Tabs>
        </div>

        <Separator />

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button>
            Edit Account
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};