import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { 
  Clock, 
  CheckCircle, 
  Banknote, 
  Search, 
  Eye,
  CreditCard
} from "lucide-react";
import { useLoanApplications } from "@/hooks/useLoanManagement";
import { LoanStatusBadge } from "./LoanStatusBadge";
import { BulkLoanActions } from "./BulkLoanActions";
import { LoanWorkflowDialog } from "./LoanWorkflowDialog";
import { format } from "date-fns";

export const LoanListTabs = () => {
  const { data: loanApplications, isLoading } = useLoanApplications();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedApplication, setSelectedApplication] = useState<any>(null);
  const [isWorkflowDialogOpen, setIsWorkflowDialogOpen] = useState(false);

  // Filter applications based on search criteria
  const filteredApplications = loanApplications?.filter((app: any) => {
    const matchesSearch = searchTerm === "" || 
      app.application_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${app.clients?.first_name} ${app.clients?.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.loan_products?.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  }) || [];

  // Group applications by status
  const pendingApprovalLoans = filteredApplications.filter((app: any) => 
    ['pending', 'under_review'].includes(app.status)
  );
  
  const pendingDisbursementLoans = filteredApplications.filter((app: any) => 
    ['approved', 'pending_disbursement'].includes(app.status)
  );
  
  const disbursedLoans = filteredApplications.filter((app: any) => 
    app.status === 'disbursed'
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
    }).format(amount);
  };

  const handleViewApplication = (application: any) => {
    setSelectedApplication(application);
    setIsWorkflowDialogOpen(true);
  };

  const renderLoansTable = (loans: any[]) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Application #</TableHead>
          <TableHead>Client</TableHead>
          <TableHead>Product</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Term</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {loans.map((loan: any) => (
          <TableRow key={loan.id}>
            <TableCell>
              <div className="font-medium">{loan.application_number}</div>
            </TableCell>
            <TableCell>
              <div className="text-sm">
                {loan.clients?.first_name} {loan.clients?.last_name}
              </div>
              <div className="text-xs text-muted-foreground">
                {loan.clients?.client_number}
              </div>
            </TableCell>
            <TableCell>
              <div className="text-sm">{loan.loan_products?.name}</div>
            </TableCell>
            <TableCell>
              <div className="font-medium text-primary">
                {formatCurrency(loan.requested_amount)}
              </div>
            </TableCell>
            <TableCell>
              <div className="text-sm">{loan.requested_term} months</div>
            </TableCell>
            <TableCell>
              <LoanStatusBadge status={loan.status} />
            </TableCell>
            <TableCell>
              <div className="text-sm text-muted-foreground">
                {format(new Date(loan.created_at), 'MMM dd, yyyy')}
              </div>
            </TableCell>
            <TableCell>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleViewApplication(loan)}
                className="flex items-center gap-1"
              >
                <Eye className="h-3 w-3" />
                View
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  const renderEmptyState = (icon: React.ReactNode, title: string, description: string) => (
    <div className="text-center py-8">
      <div className="mx-auto mb-4 text-muted-foreground">{icon}</div>
      <h3 className="text-lg font-medium mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search loans..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Approval</p>
                <p className="text-2xl font-bold text-yellow-600">{pendingApprovalLoans.length}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Disbursement</p>
                <p className="text-2xl font-bold text-green-600">{pendingDisbursementLoans.length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Disbursed</p>
                <p className="text-2xl font-bold text-blue-600">{disbursedLoans.length}</p>
              </div>
              <Banknote className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Loan Tabs */}
      <Tabs defaultValue="pending-approval" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending-approval" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Pending Approval ({pendingApprovalLoans.length})
          </TabsTrigger>
          <TabsTrigger value="pending-disbursement" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Pending Disbursement ({pendingDisbursementLoans.length})
          </TabsTrigger>
          <TabsTrigger value="disbursed" className="flex items-center gap-2">
            <Banknote className="h-4 w-4" />
            Disbursed ({disbursedLoans.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending-approval" className="space-y-6">
          {pendingApprovalLoans.length > 0 && (
            <BulkLoanActions 
              loans={pendingApprovalLoans} 
              actionType="approve"
              onSuccess={() => {
                // Refetch data or handle success
              }}
            />
          )}
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Loans Pending Approval
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="text-muted-foreground">Loading loans...</div>
                </div>
              ) : pendingApprovalLoans.length > 0 ? (
                renderLoansTable(pendingApprovalLoans)
              ) : (
                renderEmptyState(
                  <Clock className="h-12 w-12" />,
                  "No loans pending approval",
                  "All loan applications have been processed or no applications exist."
                )
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending-disbursement" className="space-y-6">
          {pendingDisbursementLoans.length > 0 && (
            <BulkLoanActions 
              loans={pendingDisbursementLoans} 
              actionType="disburse"
              onSuccess={() => {
                // Refetch data or handle success
              }}
            />
          )}
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Loans Pending Disbursement
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="text-muted-foreground">Loading loans...</div>
                </div>
              ) : pendingDisbursementLoans.length > 0 ? (
                renderLoansTable(pendingDisbursementLoans)
              ) : (
                renderEmptyState(
                  <CheckCircle className="h-12 w-12" />,
                  "No loans pending disbursement",
                  "No approved loans are waiting for disbursement."
                )
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="disbursed" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Banknote className="h-5 w-5" />
                Disbursed Loans
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="text-muted-foreground">Loading loans...</div>
                </div>
              ) : disbursedLoans.length > 0 ? (
                renderLoansTable(disbursedLoans)
              ) : (
                renderEmptyState(
                  <Banknote className="h-12 w-12" />,
                  "No disbursed loans",
                  "No loans have been disbursed yet."
                )
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Loan Workflow Dialog */}
      {selectedApplication && (
        <LoanWorkflowDialog
          loanApplication={selectedApplication}
          open={isWorkflowDialogOpen}
          onOpenChange={setIsWorkflowDialogOpen}
          onSuccess={() => {
            setIsWorkflowDialogOpen(false);
            setSelectedApplication(null);
          }}
        />
      )}
    </div>
  );
};