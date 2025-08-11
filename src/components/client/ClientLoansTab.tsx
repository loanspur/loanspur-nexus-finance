import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Plus, 
  Eye, 
  CreditCard, 
  DollarSign, 
  CheckCircle,
  Clock,
  AlertTriangle
} from "lucide-react";
import { format } from "date-fns";
import { LoanStatusBadge } from "@/components/loan/LoanStatusBadge";
import { getDerivedLoanStatus } from "@/lib/loan-status";
import { useCurrency } from "@/contexts/CurrencyContext";

interface ClientLoansTabProps {
  loans: any[];
  loanApplications: any[];
  showClosedLoans: boolean;
  onToggleClosedLoans: () => void;
  onNewLoan: () => void;
  onViewLoanDetails: (loan: any) => void;
  onProcessDisbursement: (loan: any) => void;
  onLoanWorkflow: (loan: any) => void;
}

export const ClientLoansTab = ({
  loans,
  loanApplications,
  showClosedLoans,
  onToggleClosedLoans,
  onNewLoan,
  onViewLoanDetails,
  onProcessDisbursement,
  onLoanWorkflow
}: ClientLoansTabProps) => {
  const { formatAmount } = useCurrency();
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
  const getVisibleLoansAndApplications = () => {
    const rejectedClosedStatuses = ['rejected', 'closed'];
    
    if (showClosedLoans) {
      // Show only rejected/closed loans and applications
      const filteredLoans = loans.filter(loan => rejectedClosedStatuses.includes(loan.status?.toLowerCase()));
      const filteredApplications = loanApplications.filter(app => rejectedClosedStatuses.includes(app.status?.toLowerCase()));
      return { loans: filteredLoans, applications: filteredApplications };
    } else {
      // Show all except rejected/closed loans and applications
      const filteredLoans = loans.filter(loan => !rejectedClosedStatuses.includes(loan.status?.toLowerCase()));
      const filteredApplications = loanApplications.filter(app => !rejectedClosedStatuses.includes(app.status?.toLowerCase()));
      return { loans: filteredLoans, applications: filteredApplications };
    }
  };

  const { loans: visibleLoans, applications: visibleApplications } = getVisibleLoansAndApplications();
  
  // Deduplicate: if an approved/pending_disbursement loan exists for an application, show only the application row
  const applicationIds = new Set(visibleApplications.map((a) => a.id));
  const dedupedLoans = visibleLoans.filter((loan) => {
    const status = (loan.status || '').toLowerCase();
    if (['approved', 'pending_disbursement'].includes(status) && loan.application_id && applicationIds.has(loan.application_id)) {
      return false; // hide duplicate loan record to keep one source of truth
    }
    return true;
  });
  
  // Combine loans and applications for single row display
  const allVisibleItems = [
    ...visibleApplications.map(app => ({ ...app, type: 'application' })),
    ...dedupedLoans.map(loan => ({ ...loan, type: 'loan' }))
  ];

  const getStatusBadge = (status: string, type: 'loan' | 'application') => {
    const statusLower = status.toLowerCase();
    
    if (type === 'application') {
      switch (statusLower) {
        case 'pending':
          return <Badge variant="outline" className="border-yellow-500 text-yellow-600"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
        case 'pending_approval':
          return <Badge variant="outline" className="border-blue-500 text-blue-600"><Clock className="w-3 h-3 mr-1" />Under Review</Badge>;
        case 'pending_disbursement':
        case 'approved':
          return <Badge variant="outline" className="border-green-500 text-green-600"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
        case 'rejected':
          return <Badge variant="destructive">Rejected</Badge>;
        default:
          return <Badge variant="outline" className="capitalize">{status}</Badge>;
      }
    } else {
      switch (statusLower) {
        case 'active':
          return <Badge variant="outline" className="border-green-500 text-green-600">Active</Badge>;
        case 'disbursed':
          // Treat disbursed as active for viewing and actions
          return <Badge variant="outline" className="border-green-500 text-green-600">Active</Badge>;
        case 'overdue':
          return <Badge variant="destructive" className="bg-red-600 hover:bg-red-700"><AlertTriangle className="w-3 h-3 mr-1" />Overdue</Badge>;
        case 'closed':
        case 'fully_paid':
          return <Badge variant="outline" className="border-gray-500 text-gray-600">Closed</Badge>;
        default:
          return <Badge variant="outline" className="capitalize">{status}</Badge>;
      }
    }
  };

  const getItemActions = (item: any) => {
    const actions = [];

    if (item.type === 'application') {
      if (['pending', 'pending_approval'].includes(item.status?.toLowerCase())) {
        actions.push(
          <Button 
            key="workflow"
            size="sm" 
            variant="outline"
            onClick={() => onLoanWorkflow(item)}
            className="border-blue-500 text-blue-600 hover:bg-blue-50"
          >
            <CheckCircle className="h-4 w-4 mr-1" />
            Review
          </Button>
        );
      }
      
      if (['approved', 'pending_disbursement'].includes(item.status?.toLowerCase())) {
        actions.push(
          <Button 
            key="disburse"
            size="sm"
            onClick={() => onProcessDisbursement(item)}
            className="bg-gradient-primary"
          >
            <DollarSign className="h-4 w-4 mr-1" />
            Disburse
          </Button>
        );
      }
    }

    // Show view button for both loans and applications
    actions.push(
      <Button 
        key="view"
        size="sm" 
        variant="outline"
        onClick={() => onViewLoanDetails(item)}
      >
        <Eye className="h-4 w-4" />
      </Button>
    );

    return actions;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Loans Overview
              </CardTitle>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="show-closed-loans"
                  checked={showClosedLoans}
                  onCheckedChange={onToggleClosedLoans}
                />
                <Label htmlFor="show-closed-loans" className="text-sm">
                  Show closed/rejected
                </Label>
              </div>
              <Button onClick={onNewLoan} className="bg-gradient-primary">
                <Plus className="h-4 w-4 mr-2" />
                New Loan Application
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {allVisibleItems.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No loan accounts found</p>
              <p className="text-sm">Create a loan application to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {allVisibleItems.map((item) => (
                <div 
                  key={`${item.type}-${item.id}`} 
                  className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div>
                          <h4 className="font-medium">
                            {item.loan_products?.name || 'Standard Loan'}
                          </h4>
                          <p className="text-sm text-muted-foreground font-mono">
                            {item.type === 'application' 
                              ? item.application_number 
                              : item.loan_number || `L-${item.id.slice(0, 8)}`
                            }
                          </p>
                        </div>
                        <LoanStatusBadge status={getDerivedLoanStatus(item).status} size="sm" />
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Amount</p>
                          <p className="font-medium">
                            {formatAmount(
                              item.type === 'application' 
                                ? item.requested_amount || 0 
                                : item.principal_amount || 0
                            )}
                          </p>
                        </div>
                        {item.type === 'loan' && item.outstanding_balance !== null && (
                          <div>
                            <p className="text-muted-foreground">Outstanding</p>
                            <p className="font-medium text-destructive">
                              {formatAmount(item.outstanding_balance || 0)}
                            </p>
                          </div>
                        )}
                        <div>
                          <p className="text-muted-foreground">
                            {item.type === 'application' ? 'Applied' : 'Created'}
                          </p>
                          <p className="font-medium">
                            {safeFormatDate(
                              item.type === 'application' 
                                ? (item.submitted_at || item.created_at)
                                : item.created_at,
                              'MMM dd, yyyy'
                            )}
                          </p>
                        </div>
                        {item.loan_products && (
                          <div>
                            <p className="text-muted-foreground">Interest Rate</p>
                            <p className="font-medium">
                              {item.loan_products.default_nominal_interest_rate}%
                            </p>
                          </div>
                        )}
                        {/* Show processing info for applications */}
                        {item.type === 'application' && item.reviewed_by_profile && (
                          <div>
                            <p className="text-muted-foreground">Reviewed By</p>
                            <p className="font-medium text-xs">
                              {item.reviewed_by_profile.first_name} {item.reviewed_by_profile.last_name}
                            </p>
                          </div>
                        )}
                        {/* Show processing info for loans */}
                        {item.type === 'loan' && item.approved_by_profile && (
                          <div>
                            <p className="text-muted-foreground">Approved By</p>
                            <p className="font-medium text-xs">
                              {item.approved_by_profile.first_name} {item.approved_by_profile.last_name}
                            </p>
                          </div>
                        )}
                        {item.type === 'loan' && item.loan_disbursements?.[0]?.disbursed_by_profile && (
                          <div>
                            <p className="text-muted-foreground">Disbursed By</p>
                            <p className="font-medium text-xs">
                              {item.loan_disbursements[0].disbursed_by_profile.first_name} {item.loan_disbursements[0].disbursed_by_profile.last_name}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {getItemActions(item)}
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