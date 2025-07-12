import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  CreditCard, 
  Eye, 
  Download, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  XCircle,
  FileText,
  Calendar,
  TrendingUp,
  AlertTriangle
} from "lucide-react";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';

const ClientLoansPage = () => {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState("created");

  // Fetch loan applications for this client
  const { data: loanApplications = [], isLoading } = useQuery({
    queryKey: ['client-loan-applications', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      
      const { data, error } = await supabase
        .from('loan_applications')
        .select(`
          *,
          loan_products(name, short_name, min_nominal_interest_rate, max_nominal_interest_rate)
        `)
        .eq('client_id', profile.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.id,
  });

  // Fetch actual loans for this client
  const { data: loans = [] } = useQuery({
    queryKey: ['client-loans', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      
      const { data, error } = await supabase
        .from('loans')
        .select(`
          *,
          loan_products(name, short_name),
          loan_schedules(*)
        `)
        .eq('client_id', profile.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.id,
  });

  // Categorize loans by status
  const createdLoans = loans.filter(loan => ['approved', 'active', 'disbursed', 'pending_disbursement'].includes(loan.status));
  const pendingLoans = loanApplications.filter(app => ['pending', 'under_review'].includes(app.status));
  const closedLoans = loans.filter(loan => ['closed', 'written_off', 'fully_paid', 'rejected', 'withdrawn'].includes(loan.status));

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'under_review':
        return <Badge variant="outline" className="text-blue-600 border-blue-600"><Eye className="w-3 h-3 mr-1" />Under Review</Badge>;
      case 'approved':
        return <Badge variant="default" className="bg-green-600"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'active':
        return <Badge variant="default"><TrendingUp className="w-3 h-3 mr-1" />Active</Badge>;
      case 'disbursed':
        return <Badge variant="default" className="bg-blue-600"><DollarSign className="w-3 h-3 mr-1" />Disbursed</Badge>;
      case 'pending_disbursement':
        return <Badge variant="outline" className="text-blue-600 border-blue-600"><Clock className="w-3 h-3 mr-1" />Pending Disbursement</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      case 'withdrawn':
        return <Badge variant="outline" className="text-gray-600 border-gray-600"><XCircle className="w-3 h-3 mr-1" />Withdrawn</Badge>;
      case 'closed':
        return <Badge variant="secondary"><CheckCircle className="w-3 h-3 mr-1" />Closed</Badge>;
      case 'fully_paid':
        return <Badge variant="secondary" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Fully Paid</Badge>;
      case 'written_off':
        return <Badge variant="destructive"><AlertTriangle className="w-3 h-3 mr-1" />Written Off</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getActionButtons = (loan: any, type: 'loan' | 'application') => {
    const buttons = [];
    
    if (type === 'application') {
      switch (loan.status) {
        case 'pending':
          buttons.push(
            <Button key="cancel" variant="outline" size="sm" className="text-red-600 hover:text-red-700">
              <XCircle className="w-4 h-4 mr-1" />
              Cancel
            </Button>
          );
          break;
        case 'under_review':
          buttons.push(
            <Button key="documents" variant="outline" size="sm">
              <FileText className="w-4 h-4 mr-1" />
              Add Documents
            </Button>
          );
          break;
        case 'approved':
          buttons.push(
            <Button key="accept" size="sm">
              <CheckCircle className="w-4 h-4 mr-1" />
              Accept Offer
            </Button>
          );
          break;
      }
    } else {
      switch (loan.status) {
        case 'active':
        case 'disbursed':
          buttons.push(
            <Button key="payment" size="sm">
              <DollarSign className="w-4 h-4 mr-1" />
              Make Payment
            </Button>
          );
          buttons.push(
            <Button key="schedule" variant="outline" size="sm">
              <Calendar className="w-4 h-4 mr-1" />
              View Schedule
            </Button>
          );
          break;
        case 'pending_disbursement':
          buttons.push(
            <Button key="track" variant="outline" size="sm">
              <Clock className="w-4 h-4 mr-1" />
              Track Disbursement
            </Button>
          );
          break;
      }
    }

    // Common actions for all types
    buttons.push(
      <Button key="view" variant="outline" size="sm">
        <Eye className="w-4 h-4 mr-1" />
        View Details
      </Button>
    );

    if (type === 'loan' || loan.status === 'approved') {
      buttons.push(
        <Button key="download" variant="outline" size="sm">
          <Download className="w-4 h-4 mr-1" />
          Download
        </Button>
      );
    }

    return buttons;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">My Loans</h1>
        <p className="text-muted-foreground">View and manage your loan accounts and applications</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="created" className="relative">
            Created Loans
            {createdLoans.length > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 px-2 text-xs">
                {createdLoans.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="pending" className="relative">
            Pending Applications
            {pendingLoans.length > 0 && (
              <Badge variant="outline" className="ml-2 h-5 px-2 text-xs text-yellow-600 border-yellow-600">
                {pendingLoans.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="closed" className="relative">
            Closed Loans
            {closedLoans.length > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 px-2 text-xs">
                {closedLoans.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Created Loans Tab */}
        <TabsContent value="created" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-green-600" />
                Active & Approved Loans
              </CardTitle>
              <CardDescription>Your current loan accounts and disbursed loans</CardDescription>
            </CardHeader>
            <CardContent>
              {createdLoans.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No active loans found</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Loan Number</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Principal Amount</TableHead>
                      <TableHead>Outstanding Balance</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Disbursement Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {createdLoans.map((loan) => (
                      <TableRow key={loan.id}>
                        <TableCell className="font-medium">{loan.loan_number}</TableCell>
                        <TableCell>{loan.loan_products?.name || 'N/A'}</TableCell>
                        <TableCell>KES {loan.principal_amount?.toLocaleString()}</TableCell>
                        <TableCell>
                          <span className="font-medium text-primary">
                            KES {(loan.outstanding_balance || loan.principal_amount)?.toLocaleString()}
                          </span>
                        </TableCell>
                        <TableCell>{getStatusBadge(loan.status)}</TableCell>
                        <TableCell>
                          {loan.disbursement_date ? format(new Date(loan.disbursement_date), 'MMM dd, yyyy') : 'Pending'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            {getActionButtons(loan, 'loan')}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pending Applications Tab */}
        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-yellow-600" />
                Pending Loan Applications
              </CardTitle>
              <CardDescription>Your loan applications under review or pending approval</CardDescription>
            </CardHeader>
            <CardContent>
              {pendingLoans.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No pending applications</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Application Number</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Requested Amount</TableHead>
                      <TableHead>Purpose</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Applied Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingLoans.map((application) => (
                      <TableRow key={application.id}>
                        <TableCell className="font-medium">{application.application_number}</TableCell>
                        <TableCell>{application.loan_products?.name || 'N/A'}</TableCell>
                        <TableCell>KES {application.requested_amount?.toLocaleString()}</TableCell>
                        <TableCell className="capitalize">{application.purpose?.replace(/_/g, ' ')}</TableCell>
                        <TableCell>{getStatusBadge(application.status)}</TableCell>
                        <TableCell>{format(new Date(application.created_at), 'MMM dd, yyyy')}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            {getActionButtons(application, 'application')}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Closed Loans Tab */}
        <TabsContent value="closed" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-gray-600" />
                Closed & Completed Loans
              </CardTitle>
              <CardDescription>Your fully paid and closed loan accounts</CardDescription>
            </CardHeader>
            <CardContent>
              {closedLoans.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No closed loans found</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Loan Number</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Principal Amount</TableHead>
                      <TableHead>Total Paid</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Closed Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {closedLoans.map((loan) => (
                      <TableRow key={loan.id}>
                        <TableCell className="font-medium">{loan.loan_number}</TableCell>
                        <TableCell>{loan.loan_products?.name || 'N/A'}</TableCell>
                        <TableCell>KES {loan.principal_amount?.toLocaleString()}</TableCell>
                         <TableCell>
                           <span className="font-medium text-green-600">
                             KES {loan.principal_amount?.toLocaleString()}
                           </span>
                         </TableCell>
                         <TableCell>{getStatusBadge(loan.status)}</TableCell>
                         <TableCell>
                           {loan.updated_at ? format(new Date(loan.updated_at), 'MMM dd, yyyy') : 'N/A'}
                         </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            {getActionButtons(loan, 'loan')}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ClientLoansPage;