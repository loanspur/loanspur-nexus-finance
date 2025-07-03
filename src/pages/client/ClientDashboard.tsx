import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DashboardKPIs } from "@/components/dashboard/DashboardKPIs";
import { useClientDashboardData } from "@/hooks/useDashboardData";
import { 
  CreditCard, 
  PiggyBank, 
  Upload, 
  Download, 
  DollarSign,
  Calendar,
  TrendingUp,
  AlertCircle,
  CheckCircle
} from "lucide-react";

const ClientDashboard = () => {
  const { data: clientData, isLoading } = useClientDashboardData();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!clientData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">No Client Data Found</h2>
          <p className="text-muted-foreground">Please contact your financial institution.</p>
        </div>
      </div>
    );
  }

  const { summary, transactions, loans, savingsAccounts } = clientData;

  const kpis = [
    {
      title: "Loan Balance",
      value: summary.totalLoanBalance,
      description: "Outstanding amount",
      format: 'currency' as const,
      trend: 'stable' as const,
    },
    {
      title: "Savings Balance",
      value: summary.totalSavingsBalance,
      description: "Total savings",
      format: 'currency' as const,
      trend: 'up' as const,
    },
    {
      title: "Next Payment",
      value: summary.nextPayment,
      description: summary.nextPaymentDate ? `Due: ${new Date(summary.nextPaymentDate).toLocaleDateString()}` : "No upcoming payment",
      format: 'currency' as const,
      trend: 'stable' as const,
    },
    {
      title: "Repayment Rate",
      value: summary.repaymentRate,
      description: "Timely payments",
      format: 'percentage' as const,
      trend: summary.repaymentRate >= 90 ? 'up' as const : 'down' as const,
    }
  ];

  const quickActions = [
    {
      title: "Make Payment",
      description: "Pay your loan via M-Pesa",
      icon: DollarSign,
      variant: "default" as const,
      action: () => console.log("Make payment"),
    },
    {
      title: "Deposit Savings",
      description: "Add money to your savings",
      icon: PiggyBank,
      variant: "outline" as const,
      action: () => console.log("Deposit savings"),
    },
    {
      title: "Upload Documents",
      description: "Submit required documents",
      icon: Upload,
      variant: "outline" as const,
      action: () => console.log("Upload documents"),
    },
    {
      title: "Download Statement",
      description: "Get your account statement",
      icon: Download,
      variant: "outline" as const,
      action: () => console.log("Download statement"),
    },
  ];

  const getTransactionIcon = (type: string) => {
    if (type.includes('loan')) return CreditCard;
    if (type.includes('savings')) return PiggyBank;
    return DollarSign;
  };

  const getTransactionColor = (type: string, amount: number) => {
    if (amount > 0) return 'text-success';
    return 'text-primary';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Account</h1>
          <p className="text-muted-foreground">Welcome to your LoanSpur client portal</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge 
            variant={summary.repaymentRate >= 90 ? "default" : "secondary"}
            className="flex items-center gap-1"
          >
            <CheckCircle className="h-3 w-3" />
            {summary.repaymentRate >= 90 ? "Good Standing" : "Review Needed"}
          </Badge>
        </div>
      </div>

      <DashboardKPIs kpis={kpis} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Quick Actions
            </CardTitle>
            <CardDescription>Common tasks you can perform</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3">
              {quickActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <Button 
                    key={index}
                    variant={action.variant}
                    className="justify-start h-auto p-4 group"
                    onClick={action.action}
                  >
                    <div className="flex items-center gap-3 text-left w-full">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors flex items-center justify-center">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium">{action.title}</div>
                        <div className="text-xs text-muted-foreground">{action.description}</div>
                      </div>
                    </div>
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Recent Transactions
            </CardTitle>
            <CardDescription>Your latest account activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {transactions && transactions.length > 0 ? (
                transactions.slice(0, 5).map((transaction, index) => {
                  const Icon = getTransactionIcon(transaction.transaction_type);
                  return (
                    <div key={index} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">
                          {transaction.transaction_type.split('_').map(word => 
                            word.charAt(0).toUpperCase() + word.slice(1)
                          ).join(' ')}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(transaction.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-medium ${getTransactionColor(transaction.transaction_type, transaction.amount)}`}>
                          ${Math.abs(transaction.amount).toLocaleString()}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {transaction.payment_status}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                  <p>No recent transactions</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Account Summary Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {loans && loans.length > 0 && (
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Active Loans
              </CardTitle>
              <CardDescription>Your current loan accounts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {loans.map((loan, index) => (
                  <div key={index} className="p-3 border rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-medium">Loan #{loan.loan_number}</div>
                        <div className="text-sm text-muted-foreground">
                          Principal: ${loan.principal_amount.toLocaleString()}
                        </div>
                      </div>
                      <Badge variant={loan.status === 'active' ? 'default' : 'secondary'}>
                        {loan.status}
                      </Badge>
                    </div>
                    <div className="text-lg font-semibold text-primary">
                      ${(loan.outstanding_balance || 0).toLocaleString()} remaining
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {savingsAccounts && savingsAccounts.length > 0 && (
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PiggyBank className="h-5 w-5" />
                Savings Accounts
              </CardTitle>
              <CardDescription>Your savings account balances</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {savingsAccounts.map((account, index) => (
                  <div key={index} className="p-3 border rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-medium">Account #{account.account_number}</div>
                        <div className="text-sm text-muted-foreground">
                          Interest: ${(account.interest_earned || 0).toLocaleString()}
                        </div>
                      </div>
                      <Badge variant={account.is_active ? 'default' : 'secondary'}>
                        {account.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <div className="text-lg font-semibold text-success">
                      ${(account.account_balance || 0).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ClientDashboard;