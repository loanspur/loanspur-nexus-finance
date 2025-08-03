import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DashboardKPIs } from "@/components/dashboard/DashboardKPIs";
import { useClientDashboardData } from "@/hooks/useDashboardData";
import { useCurrency } from "@/contexts/CurrencyContext";
import { 
  CreditCard, 
  PiggyBank, 
  Upload, 
  Download, 
  DollarSign,
  Calendar,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  User,
  FileText,
  Phone,
  Mail,
  MapPin,
  Edit
} from "lucide-react";

const ClientDashboard = () => {
  const { data: clientData, isLoading } = useClientDashboardData();
  const { formatAmount } = useCurrency();

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
      {/* Client Profile Header */}
      <Card className="shadow-card border-none bg-gradient-subtle">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20 border-2 border-primary/20">
                <AvatarImage src="/placeholder.svg" />
                <AvatarFallback className="text-lg bg-primary/10 text-primary">
                  CL
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  Client Dashboard
                </h1>
                <p className="text-muted-foreground">Welcome to your LoanSpur portal</p>
                <Badge 
                  variant={summary.repaymentRate >= 90 ? "default" : "secondary"}
                  className="mt-2 flex items-center gap-1 w-fit"
                >
                  <CheckCircle className="h-3 w-3" />
                  {summary.repaymentRate >= 90 ? "Good Standing" : "Review Needed"}
                </Badge>
              </div>
            </div>
            
            <div className="flex-1">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">client@example.com</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">+254 700 000 000</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    Nairobi, Kenya
                  </span>
                </div>
              </div>
            </div>

            <Button variant="outline" size="sm" className="w-fit">
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Financial Overview */}
      <DashboardKPIs kpis={kpis} />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Quick Actions - Smaller Card */}
        <Card className="shadow-card">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-2">
              {quickActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <Button 
                    key={index}
                    variant={action.variant}
                    size="sm"
                    className="justify-start h-auto p-3 group"
                    onClick={action.action}
                  >
                    <div className="flex items-center gap-2 text-left w-full">
                      <Icon className="h-4 w-4 text-primary flex-shrink-0" />
                      <span className="text-sm font-medium">{action.title}</span>
                    </div>
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Recent Transactions - Spans 2 columns */}
        <Card className="shadow-card lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>Your latest transactions and account activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {transactions && transactions.length > 0 ? (
                transactions.slice(0, 4).map((transaction, index) => {
                  const Icon = getTransactionIcon(transaction.transaction_type);
                  return (
                    <div key={index} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/30 transition-colors">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">
                          {transaction.transaction_type.split('_').map(word => 
                            word.charAt(0).toUpperCase() + word.slice(1)
                          ).join(' ')}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(transaction.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className={`font-medium text-sm ${getTransactionColor(transaction.transaction_type, transaction.amount)}`}>
                          {formatAmount(Math.abs(transaction.amount))}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {transaction.payment_status}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <AlertCircle className="h-6 w-6 mx-auto mb-2" />
                  <p className="text-sm">No recent transactions</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Account Summary Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Loans Card */}
        {loans && loans.length > 0 && (
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Loan Accounts
              </CardTitle>
              <CardDescription>Your current loans and balances</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {loans.map((loan, index) => (
                  <div key={index} className="p-4 border rounded-lg bg-card">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="font-medium">Loan #{loan.loan_number}</div>
                        <div className="text-sm text-muted-foreground">
                          Principal: {formatAmount(loan.principal_amount)}
                        </div>
                      </div>
                      <Badge variant={loan.status === 'active' ? 'default' : 'secondary'}>
                        {loan.status}
                      </Badge>
                    </div>
                    <div className="text-xl font-semibold text-primary">
                      {formatAmount(loan.outstanding_balance || 0)}
                    </div>
                    <div className="text-sm text-muted-foreground">Outstanding Balance</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Savings Card */}
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
              <div className="space-y-3">
                {savingsAccounts.map((account, index) => (
                  <div key={index} className="p-4 border rounded-lg bg-card">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="font-medium">Account #{account.account_number}</div>
                        <div className="text-sm text-muted-foreground">
                          Interest Earned: {formatAmount(account.interest_earned || 0)}
                        </div>
                      </div>
                      <Badge variant={account.is_active ? 'default' : 'secondary'}>
                        {account.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <div className="text-xl font-semibold text-success">
                      {formatAmount(account.account_balance || 0)}
                    </div>
                    <div className="text-sm text-muted-foreground">Available Balance</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Documents Card */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Documents
            </CardTitle>
            <CardDescription>Your uploaded documents and status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
                    <FileText className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium text-sm">Identity Document</div>
                    <div className="text-xs text-muted-foreground">National ID / Passport</div>
                  </div>
                </div>
                <Badge variant="default" className="text-xs">Verified</Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
                    <FileText className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium text-sm">Proof of Income</div>
                    <div className="text-xs text-muted-foreground">Salary slip / Bank statement</div>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs">Pending</Badge>
              </div>

              <Button variant="outline" size="sm" className="w-full mt-3">
                <Upload className="h-4 w-4 mr-2" />
                Upload Document
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ClientDashboard;