import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { LoanStatusBadge } from "./LoanStatusBadge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  CreditCard, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Banknote, 
  Search, 
  Filter,
  Eye,
  FileText,
  AlertCircle
} from "lucide-react";
import { useLoanApplications } from "@/hooks/useLoanManagement";
import { LoanWorkflowDialog } from "./LoanWorkflowDialog";
import { format } from "date-fns";

interface LoanWorkflowManagementProps {
  clientId?: string;
  viewMode?: 'all' | 'client';
}

export const LoanWorkflowManagement = ({ clientId, viewMode = 'all' }: LoanWorkflowManagementProps) => {
  const { data: loanApplications, isLoading } = useLoanApplications();
  const [selectedApplication, setSelectedApplication] = useState<any>(null);
  const [isWorkflowDialogOpen, setIsWorkflowDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("pending");

  // Filter applications based on client and other criteria
  const filteredApplications = loanApplications?.filter((app: any) => {
    if (clientId && app.client_id !== clientId) return false;
    
    const matchesSearch = searchTerm === "" || 
      app.application_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${app.clients?.first_name} ${app.clients?.last_name}`.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || app.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  }) || [];

  // Group applications by status
  const groupedApplications = {
    pending: filteredApplications.filter((app: any) => 
      ['pending', 'under_review'].includes(app.status)
    ),
    approved: filteredApplications.filter((app: any) => 
      ['approved', 'pending_disbursement'].includes(app.status)
    ),
    active: filteredApplications.filter((app: any) => 
      app.status === 'disbursed'
    ),
    rejected: filteredApplications.filter((app: any) => 
      ['rejected', 'withdrawn'].includes(app.status)
    )
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
      case 'under_review':
        return <Clock className="h-4 w-4" />;
      case 'approved':
      case 'pending_disbursement':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'disbursed':
        return <Banknote className="h-4 w-4 text-success" />;
      case 'rejected':
      case 'withdrawn':
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'secondary';
      case 'under_review':
        return 'outline';
      case 'approved':
      case 'pending_disbursement':
        return 'default';
      case 'disbursed':
        return 'default';
      case 'rejected':
      case 'withdrawn':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

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

  const getNextAction = (status: string) => {
    switch (status) {
      case 'pending':
      case 'under_review':
        return 'Review Application';
      case 'approved':
      case 'pending_disbursement':
        return 'Process Disbursement';
      case 'disbursed':
        return 'View Details';
      case 'rejected':
        return 'View Decision';
      default:
        return 'View Application';
    }
  };

  const renderApplicationsTable = (applications: any[]) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Application #</TableHead>
          {viewMode === 'all' && <TableHead>Client</TableHead>}
          <TableHead>Product</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Term</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {applications.map((app: any) => (
          <TableRow key={app.id}>
            <TableCell>
              <div className="font-medium">{app.application_number}</div>
            </TableCell>
            {viewMode === 'all' && (
              <TableCell>
                <div className="text-sm">
                  {app.clients?.first_name} {app.clients?.last_name}
                </div>
              </TableCell>
            )}
            <TableCell>
              <div className="text-sm">{app.loan_products?.name}</div>
            </TableCell>
            <TableCell>
              <div className="font-medium text-primary">
                {formatCurrency(app.requested_amount)}
              </div>
            </TableCell>
            <TableCell>
              <div className="text-sm">{app.requested_term} months</div>
            </TableCell>
            <TableCell>
              <LoanStatusBadge status={app.status} />
            </TableCell>
            <TableCell>
              <div className="text-sm text-muted-foreground">
                {format(new Date(app.created_at), 'MMM dd, yyyy')}
              </div>
            </TableCell>
            <TableCell>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleViewApplication(app)}
                className="flex items-center gap-1"
              >
                <Eye className="h-3 w-3" />
                {getNextAction(app.status)}
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Loan Workflow Management
            </CardTitle>
            <CardDescription>
              {viewMode === 'client' 
                ? "Manage loan applications for this client" 
                : "Manage all loan applications and workflow processes"
              }
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Search and Filter Controls */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search applications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="under_review">Under Review</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="pending_disbursement">Pending Disbursement</SelectItem>
              <SelectItem value="disbursed">Disbursed</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Review</p>
                  <p className="text-2xl font-bold text-warning">{groupedApplications.pending.length}</p>
                </div>
                <Clock className="h-8 w-8 text-warning" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Approved</p>
                  <p className="text-2xl font-bold text-success">{groupedApplications.approved.length}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-success" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active</p>
                  <p className="text-2xl font-bold text-primary">{groupedApplications.active.length}</p>
                </div>
                <Banknote className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Rejected</p>
                  <p className="text-2xl font-bold text-destructive">{groupedApplications.rejected.length}</p>
                </div>
                <XCircle className="h-8 w-8 text-destructive" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Workflow Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="pending" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Pending ({groupedApplications.pending.length})
            </TabsTrigger>
            <TabsTrigger value="approved" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Approved ({groupedApplications.approved.length})
            </TabsTrigger>
            <TabsTrigger value="active" className="flex items-center gap-2">
              <Banknote className="h-4 w-4" />
              Active ({groupedApplications.active.length})
            </TabsTrigger>
            <TabsTrigger value="rejected" className="flex items-center gap-2">
              <XCircle className="h-4 w-4" />
              Rejected ({groupedApplications.rejected.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <div className="text-muted-foreground">Loading applications...</div>
              </div>
            ) : groupedApplications.pending.length > 0 ? (
              renderApplicationsTable(groupedApplications.pending)
            ) : (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No pending applications</h3>
                <p className="text-muted-foreground">All applications have been processed.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="approved" className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <div className="text-muted-foreground">Loading applications...</div>
              </div>
            ) : groupedApplications.approved.length > 0 ? (
              renderApplicationsTable(groupedApplications.approved)
            ) : (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No approved applications</h3>
                <p className="text-muted-foreground">No applications are ready for disbursement.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="active" className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <div className="text-muted-foreground">Loading applications...</div>
              </div>
            ) : groupedApplications.active.length > 0 ? (
              renderApplicationsTable(groupedApplications.active)
            ) : (
              <div className="text-center py-8">
                <Banknote className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No active loans</h3>
                <p className="text-muted-foreground">No loans have been disbursed yet.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="rejected" className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <div className="text-muted-foreground">Loading applications...</div>
              </div>
            ) : groupedApplications.rejected.length > 0 ? (
              renderApplicationsTable(groupedApplications.rejected)
            ) : (
              <div className="text-center py-8">
                <XCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No rejected applications</h3>
                <p className="text-muted-foreground">No applications have been rejected.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>

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
    </Card>
  );
};