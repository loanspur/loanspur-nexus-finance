import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  CreditCard, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Eye, 
  Plus,
  Filter,
  TrendingUp,
  DollarSign
} from "lucide-react";
import { format } from "date-fns";
import { LoanStatusBadge } from "@/components/loan/LoanStatusBadge";
import { getDerivedLoanStatus } from "@/lib/loan-status";
import { useCurrency } from "@/contexts/CurrencyContext";

interface LoanAccount {
  id: string;
  type: 'loan' | 'application';
  display_name: string;
  identifier: string;
  amount: number;
  outstanding?: number | null;
  status: string;
  date: string;
  date_label: string;
  loan_products?: {
    name: string;
    interest_rate: number;
  };
}

interface LoanAccountStatusViewProps {
  accounts: LoanAccount[];
  onViewDetails: (account: LoanAccount) => void;
  onNewApplication: () => void;
  onApprove?: (account: LoanAccount) => void;
  onReject?: (account: LoanAccount) => void;
  hideClosedAccounts?: boolean;
  onToggleClosedAccounts?: () => void;
}

export const LoanAccountStatusView = ({
  accounts,
  onViewDetails,
  onNewApplication,
  onApprove,
  onReject,
  hideClosedAccounts = false,
  onToggleClosedAccounts
}: LoanAccountStatusViewProps) => {
  const [filterStatus, setFilterStatus] = useState<string>('all');

const { formatAmount: formatCurrency } = useCurrency();

  const getStatusBadge = (status: string, type: 'loan' | 'application') => {
    const statusLower = status.toLowerCase();
    
    if (type === 'application') {
      switch (statusLower) {
        case 'pending':
          return <Badge variant="outline" className="border-yellow-500 text-yellow-600"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
        case 'pending_approval':
          return <Badge variant="outline" className="border-blue-500 text-blue-600"><Clock className="w-3 h-3 mr-1" />Under Review</Badge>;
        case 'pending_disbursement':
          return <Badge variant="outline" className="border-green-500 text-green-600"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
        case 'approved':
          return <Badge variant="outline" className="border-green-500 text-green-600"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
        case 'rejected':
          return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
        case 'withdrawn':
          return <Badge variant="outline" className="border-gray-500 text-gray-600"><XCircle className="w-3 h-3 mr-1" />Withdrawn</Badge>;
        default:
          return <Badge variant="outline" className="capitalize">{status}</Badge>;
      }
    } else {
      switch (statusLower) {
        case 'active':
          return <Badge variant="outline" className="border-green-500 text-green-600"><TrendingUp className="w-3 h-3 mr-1" />Active</Badge>;
        case 'pending_approval':
          return <Badge variant="outline" className="border-blue-500 text-blue-600"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
        case 'overdue':
          return <Badge variant="destructive" className="bg-red-600 hover:bg-red-700"><AlertTriangle className="w-3 h-3 mr-1" />Overdue</Badge>;
        case 'closed':
        case 'fully_paid':
          return <Badge variant="outline" className="border-gray-500 text-gray-600"><CheckCircle className="w-3 h-3 mr-1" />Closed</Badge>;
        case 'written_off':
          return <Badge variant="destructive" className="bg-red-600 hover:bg-red-700"><AlertTriangle className="w-3 h-3 mr-1" />Written Off</Badge>;
        default:
          return <Badge variant="outline" className="capitalize">{status}</Badge>;
      }
    }
  };

  const accountsWithDerived = accounts.map((a) => ({ ...a, __derived: getDerivedLoanStatus(a) }));

  const filteredAccounts = accountsWithDerived.filter(account => {
    if (filterStatus === 'all') return true;
    return account.__derived.status === filterStatus;
  });

  const statusCounts = {
    active: accountsWithDerived.filter(a => a.__derived.status === 'active').length,
    pending: accountsWithDerived.filter(a => ['pending', 'pending_approval', 'under_review'].includes(a.__derived.status)).length,
    overdue: accountsWithDerived.filter(a => a.__derived.status === 'in_arrears').length,
    closed: accountsWithDerived.filter(a => ['closed', 'fully_paid', 'rejected', 'withdrawn'].includes(a.__derived.status)).length,
  };

  return (
    <div className="space-y-6">
      {/* Status Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilterStatus('active')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active</p>
                <p className="text-2xl font-bold text-success">{statusCounts.active}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilterStatus('pending')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-warning">{statusCounts.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-warning" />
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilterStatus('overdue')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Overdue</p>
                <p className="text-2xl font-bold text-destructive">{statusCounts.overdue}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilterStatus('closed')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Closed</p>
                <p className="text-2xl font-bold text-muted-foreground">{statusCounts.closed}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Loan Accounts List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Loan Accounts & Applications
              </CardTitle>
              <CardDescription>
                {filteredAccounts.length} of {accounts.length} items
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFilterStatus('all')}
                className={filterStatus === 'all' ? 'bg-muted' : ''}
              >
                <Filter className="h-4 w-4 mr-2" />
                All
              </Button>
              {onToggleClosedAccounts && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onToggleClosedAccounts}
                >
                  {hideClosedAccounts ? 'Show' : 'Hide'} Closed
                </Button>
              )}
              <Button size="sm" onClick={onNewApplication}>
                <Plus className="h-4 w-4 mr-2" />
                New Application
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredAccounts.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No accounts found</p>
              <p className="text-sm">
                {filterStatus === 'all' 
                  ? 'Create a loan application to get started' 
                  : `No ${filterStatus} accounts found`
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAccounts.map((account) => (
                <div 
                  key={`${account.type}-${account.id}`} 
                  className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div>
                          <h4 className="font-medium">{account.display_name}</h4>
                          <p className="text-sm text-muted-foreground font-mono">{account.identifier}</p>
                        </div>
                        <LoanStatusBadge status={getDerivedLoanStatus(account).status} size="sm" />
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Amount</p>
                          <p className="font-medium">{formatCurrency(account.amount)}</p>
                        </div>
                        {account.outstanding !== null && (
                          <div>
                            <p className="text-muted-foreground">Outstanding</p>
                            <p className="font-medium text-destructive">{formatCurrency(account.outstanding || 0)}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-muted-foreground">{account.date_label}</p>
                          <p className="font-medium">{format(new Date(account.date), 'MMM dd, yyyy')}</p>
                        </div>
                        {account.loan_products && (
                          <div>
                            <p className="text-muted-foreground">Interest Rate</p>
                            <p className="font-medium">{account.loan_products.interest_rate}%</p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onViewDetails(account)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};