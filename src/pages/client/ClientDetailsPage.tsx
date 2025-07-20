import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { 
  Edit, 
  Plus, 
  CreditCard, 
  PiggyBank, 
  Share, 
  DollarSign, 
  ArrowRightLeft, 
  X, 
  Settings, 
  UserMinus, 
  ChevronDown,
  Eye,
  FileText,
  IdCard,
  Info,
  Building,
  Phone,
  StickyNote
} from "lucide-react";
import { ClientGeneralTab } from "@/components/client/tabs/ClientGeneralTab";
import { ClientIdentitiesTab } from "@/components/client/tabs/ClientIdentitiesTab";
import { ClientDocumentsTab } from "@/components/client/tabs/ClientDocumentsTab";
import { ClientAdditionalInfoTab } from "@/components/client/tabs/ClientAdditionalInfoTab";
import { ClientBankDetailsTab } from "@/components/client/tabs/ClientBankDetailsTab";
import { ClientUssdTab } from "@/components/client/tabs/ClientUssdTab";
import { ClientNextOfKinTab } from "@/components/client/tabs/ClientNextOfKinTab";
import { ClientNotesTab } from "@/components/client/tabs/ClientNotesTab";
import { NewLoanDialog } from "@/components/client/dialogs/NewLoanDialog";
import { NewSavingsDialog } from "@/components/client/dialogs/NewSavingsDialog";
import { NewShareAccountDialog } from "@/components/client/dialogs/NewShareAccountDialog";
import { AddChargeDialog } from "@/components/client/dialogs/AddChargeDialog";
import { TransferClientDialog } from "@/components/client/dialogs/TransferClientDialog";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface Client {
  id: string;
  client_number: string;
  first_name: string;
  last_name: string;
  email?: string | null;
  phone?: string | null;
  national_id?: string | null;
  date_of_birth?: string | null;
  gender?: string | null;
  address?: any;
  occupation?: string | null;
  monthly_income?: number | null;
  profile_picture_url?: string | null;
  is_active: boolean;
  approval_status?: string | null;
  kyc_status?: string | null;
  timely_repayment_rate?: number | null;
  created_at: string;
  mifos_client_id?: number | null;
  employer_name?: string | null;
  business_name?: string | null;
}

// Helper function to determine which tabs to show based on captured data
const shouldShowTab = (tabName: string, client: Client, loans: any[], savings: any[]) => {
  // Account opening stage tabs - always show if client exists
  const accountOpeningTabs = ['general', 'identities', 'documents', 'bank-details', 'next-of-kin', 'notes'];
  
  if (accountOpeningTabs.includes(tabName)) {
    return true;
  }
  
  // Additional tabs - only show if there's actual data
  switch (tabName) {
    case 'loans':
      return loans.length > 0;
    case 'savings':
      return savings.length > 0;
    case 'additional-info':
      // Show if client has employment or business information
      return client.employer_name || client.business_name || client.occupation;
    default:
      return false;
  }
};

const ClientDetailsPage = () => {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [client, setClient] = useState<Client | null>(null);
  const [loans, setLoans] = useState<any[]>([]);
  const [loanApplications, setLoanApplications] = useState<any[]>([]);
  const [savings, setSavings] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("general");
  const [loading, setLoading] = useState(true);
  
  // Dialog states
  const [showNewLoan, setShowNewLoan] = useState(false);
  const [showNewSavings, setShowNewSavings] = useState(false);
  const [showNewShareAccount, setShowNewShareAccount] = useState(false);
  const [showAddCharge, setShowAddCharge] = useState(false);
  const [showTransferClient, setShowTransferClient] = useState(false);
  const [showClosedLoans, setShowClosedLoans] = useState(false);
  const [showClosedSavings, setShowClosedSavings] = useState(false);

  useEffect(() => {
    if (clientId) {
      fetchClientData();
    }
  }, [clientId]);

  const fetchClientData = async () => {
    if (!clientId) return;

    setLoading(true);
    try {
      // Fetch client details
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .maybeSingle();

      if (clientError) throw clientError;
      if (!clientData) {
        toast({
          title: "Error",
          description: "Client not found",
          variant: "destructive"
        });
        return;
      }

      // Fetch loans with better error handling
      const { data: loansData, error: loansError } = await supabase
        .from('loans')
        .select(`
          *,
          loan_products (
            name,
            short_name,
            default_nominal_interest_rate
          )
        `)
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (loansError) {
        console.error('Error fetching loans:', loansError);
      }

      // Fetch savings accounts with better error handling
      const { data: savingsData, error: savingsError } = await supabase
        .from('savings_accounts')
        .select(`
          *,
          savings_products (
            name,
            short_name,
            nominal_annual_interest_rate
          )
        `)
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (savingsError) {
        console.error('Error fetching savings:', savingsError);
      }

      // Also fetch loan applications
      const { data: applicationsData, error: applicationsError } = await supabase
        .from('loan_applications')
        .select(`
          *,
          loan_products (
            name,
            short_name,
            default_nominal_interest_rate
          )
        `)
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (applicationsError) {
        console.error('Error fetching loan applications:', applicationsError);
      }

      setClient(clientData);
      setLoans(loansData || []);
      setSavings(savingsData || []);
      setLoanApplications(applicationsData || []);
      
      console.log('Fetched data:', {
        client: clientData,
        loans: loansData?.length || 0,
        savings: savingsData?.length || 0,
        applications: applicationsData?.length || 0
      });
      
    } catch (error) {
      console.error('Error fetching client data:', error);
      toast({
        title: "Error",
        description: "Failed to load client data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getStatusBadge = (status: string | null) => {
    if (!status) return <Badge variant="outline">Unknown</Badge>;
    
    switch (status.toLowerCase()) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'suspended':
        return <Badge className="bg-red-100 text-red-800">Suspended</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const calculateLoanBalance = () => {
    return loans.reduce((sum, loan) => sum + (loan.outstanding_balance || 0), 0);
  };

  const calculateSavingsBalance = () => {
    return savings.reduce((sum, account) => sum + (account.account_balance || 0), 0);
  };

  // Group loans by status
  const groupLoansByStatus = () => {
    const grouped = loans.reduce((acc, loan) => {
      const status = loan.status || 'unknown';
      if (!acc[status]) {
        acc[status] = [];
      }
      acc[status].push(loan);
      return acc;
    }, {} as Record<string, any[]>);
    return grouped;
  };

  // Filter loans and applications based on toggle state
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
  
  // Combine loans and applications for single row display
  const allVisibleItems = [
    ...visibleApplications.map(app => ({ ...app, type: 'application' })),
    ...visibleLoans.map(loan => ({ ...loan, type: 'loan' }))
  ];

  const activeLoans = loans.filter(loan => {
    const closedStatuses = ['closed', 'fully_paid', 'written_off', 'rejected'];
    return !closedStatuses.includes(loan.status?.toLowerCase());
  });

  const activeSavings = savings.filter(account => {
    const closedStatuses = ['closed', 'inactive', 'dormant'];
    return !closedStatuses.includes(account.status?.toLowerCase());
  });

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-muted-foreground">Loading client details...</div>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Client not found</h2>
          <Button onClick={() => navigate('/tenant/clients')}>
            Back to Clients
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Modern Header with Client Info */}
        <div className="card-enhanced rounded-xl overflow-hidden">
          {/* Header Background with Gradient */}
          <div className="bg-gradient-primary p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <Avatar className="h-16 w-16 border-2 border-white/20">
                  <AvatarImage src={client.profile_picture_url || ""} />
                  <AvatarFallback className="bg-white/10 text-lg font-semibold">
                    {client.first_name[0]}{client.last_name[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-3xl font-heading font-bold">
                    {client.first_name} {client.last_name}
                  </h1>
                  <div className="flex items-center gap-4 mt-2 text-white/80">
                    <span className="text-sm">Client #{client.client_number}</span>
                    <span className="text-sm">•</span>
                    <span className="text-sm">ID: {client.mifos_client_id || 'N/A'}</span>
                    <span className="text-sm">•</span>
                    <span className="text-sm">Staff: ADMIN</span>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    {getStatusBadge(client.approval_status)}
                    <Badge variant="outline" className="bg-white/10 border-white/20 text-white">
                      {client.kyc_status}
                    </Badge>
                  </div>
                </div>
              </div>
              
              {/* Quick Actions */}
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" className="bg-white/20 border-white/30 text-white hover:bg-white/30 font-medium">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="secondary" size="sm" className="bg-white/20 border-white/30 text-white hover:bg-white/30 font-medium">
                      Actions
                      <ChevronDown className="h-4 w-4 ml-2" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-card border shadow-floating">
                    <DropdownMenuItem onClick={() => setShowTransferClient(true)}>
                      <ArrowRightLeft className="h-4 w-4 mr-2" />
                      Transfer Client
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Settings className="h-4 w-4 mr-2" />
                      Update Default Savings
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <UserMinus className="h-4 w-4 mr-2" />
                      Unassign Staff
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>

          {/* Quick Stats Dashboard */}
          <div className="p-6 bg-white">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 rounded-lg bg-gradient-to-br from-banking-primary/5 to-banking-secondary/5 border border-banking-primary/10">
                <DollarSign className="h-8 w-8 mx-auto mb-2 text-banking-primary" />
                <div className="text-2xl font-bold text-banking-primary">
                  {formatCurrency(calculateLoanBalance())}
                </div>
                <div className="text-xs text-muted-foreground">Total Loan Balance</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-gradient-to-br from-banking-accent/5 to-banking-emerald/5 border border-banking-accent/10">
                <PiggyBank className="h-8 w-8 mx-auto mb-2 text-banking-accent" />
                <div className="text-2xl font-bold text-banking-accent">
                  {formatCurrency(calculateSavingsBalance())}
                </div>
                <div className="text-xs text-muted-foreground">Total Savings</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-gradient-to-br from-banking-gold/5 to-warning/5 border border-banking-gold/10">
                <CreditCard className="h-8 w-8 mx-auto mb-2 text-banking-gold" />
                <div className="text-2xl font-bold text-banking-gold">{loans.length}</div>
                <div className="text-xs text-muted-foreground">Active Loans</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-gradient-to-br from-info/5 to-banking-secondary/5 border border-info/10">
                <Building className="h-8 w-8 mx-auto mb-2 text-banking-secondary" />
                <div className="text-2xl font-bold text-banking-secondary">{savings.length}</div>
                <div className="text-xs text-muted-foreground">Savings Accounts</div>
              </div>
            </div>
          </div>

          {/* Navigation Tabs and Action Buttons Combined */}
          <div className="px-6 border-b border-border bg-muted/30">
            <div className="flex items-center justify-between py-3 gap-4">
              {/* Navigation Tabs */}
              <div className="flex-1 min-w-0">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="h-auto p-0 bg-transparent w-full justify-start">
                    <div className="flex overflow-x-auto scrollbar-hide gap-1">
                      {shouldShowTab('identities', client, loans, savings) && (
                        <TabsTrigger value="identities" className="whitespace-nowrap px-4 py-3 text-sm font-medium text-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg border border-transparent data-[state=active]:border-primary transition-all">
                          <IdCard className="h-4 w-4 mr-2" />
                          Identity
                        </TabsTrigger>
                      )}
                      {shouldShowTab('documents', client, loans, savings) && (
                        <TabsTrigger value="documents" className="whitespace-nowrap px-4 py-3 text-sm font-medium text-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg border border-transparent data-[state=active]:border-primary transition-all">
                          <FileText className="h-4 w-4 mr-2" />
                          Documents
                        </TabsTrigger>
                      )}
                      {shouldShowTab('bank-details', client, loans, savings) && (
                        <TabsTrigger value="bank-details" className="whitespace-nowrap px-4 py-3 text-sm font-medium text-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg border border-transparent data-[state=active]:border-primary transition-all">
                          <Building className="h-4 w-4 mr-2" />
                          Bank Details
                        </TabsTrigger>
                      )}
                      {shouldShowTab('next-of-kin', client, loans, savings) && (
                        <TabsTrigger value="next-of-kin" className="whitespace-nowrap px-4 py-3 text-sm font-medium text-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg border border-transparent data-[state=active]:border-primary transition-all">
                          <Phone className="h-4 w-4 mr-2" />
                          Next of Kin
                        </TabsTrigger>
                      )}
                      {shouldShowTab('additional-info', client, loans, savings) && (
                        <TabsTrigger value="additional-info" className="whitespace-nowrap px-4 py-3 text-sm font-medium text-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg border border-transparent data-[state=active]:border-primary transition-all">
                          <Info className="h-4 w-4 mr-2" />
                          Additional Info
                        </TabsTrigger>
                      )}
                      {shouldShowTab('notes', client, loans, savings) && (
                        <TabsTrigger value="notes" className="whitespace-nowrap px-4 py-3 text-sm font-medium text-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg border border-transparent data-[state=active]:border-primary transition-all">
                          <StickyNote className="h-4 w-4 mr-2" />
                          Notes
                        </TabsTrigger>
                      )}
                    </div>
                  </TabsList>
                </Tabs>
              </div>

              {/* Quick Action Buttons */}
              <div className="flex-shrink-0">
                <div className="flex gap-2">
                  <Button onClick={() => setShowNewLoan(true)} size="sm" className="bg-primary text-primary-foreground hover:bg-primary-hover transition-all duration-300">
                    <Plus className="h-4 w-4 mr-1" />
                    New Loan
                  </Button>
                  <Button onClick={() => setShowNewSavings(true)} size="sm" className="bg-success text-success-foreground hover:opacity-90 transition-all duration-300">
                    <Plus className="h-4 w-4 mr-1" />
                    New Savings
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left Column - Account Overview */}
          <div className="xl:col-span-2 space-y-6">
            {/* Loan Account Overview */}
            <Card className="card-enhanced shadow-elevated">
              <CardHeader className="bg-gradient-to-r from-banking-primary/5 to-banking-secondary/5 border-b">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-banking-primary">
                    <CreditCard className="h-5 w-5" />
                    Loan Accounts Overview
                  </CardTitle>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowClosedLoans(!showClosedLoans)}
                    className="text-xs"
                  >
                    {showClosedLoans ? 'Hide' : 'Show'} Rejected
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {allVisibleItems.length === 0 ? (
                  <div className="text-center py-8">
                    <CreditCard className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">No Loan Accounts</h3>
                    <p className="text-muted-foreground mb-4">This client has no loan accounts or applications yet.</p>
                    <Button onClick={() => setShowNewLoan(true)} className="bg-gradient-primary">
                      <Plus className="h-4 w-4 mr-2" />
                      Create New Loan
                    </Button>
                  </div>
                ) : (
                  <div className="rounded-lg border overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-muted/50">
                           <tr>
                             <th className="text-left p-4 font-medium">Account #</th>
                             <th className="text-left p-4 font-medium">Product</th>
                             <th className="text-left p-4 font-medium">Amount</th>
                             <th className="text-left p-4 font-medium">Status</th>
                             <th className="text-left p-4 font-medium">Date</th>
                             <th className="text-left p-4 font-medium">Actions</th>
                           </tr>
                        </thead>
                        <tbody>
                          {allVisibleItems.map((item) => (
                            <tr key={item.id} className="border-t hover:bg-muted/30 transition-colors">
                              <td className="p-4">
                                <div className="font-mono text-sm font-medium">
                                  {item.type === 'application' 
                                    ? item.application_number 
                                    : item.loan_number || `L-${item.id.slice(0, 8)}`
                                  }
                                </div>
                                <div className="text-xs text-muted-foreground capitalize">
                                  {item.type}
                                </div>
                              </td>
                              <td className="p-4">
                                <div>
                                  <div className="font-medium">
                                    {item.loan_products?.name || 'Standard Loan'}
                                  </div>
                                  {item.loan_products?.default_nominal_interest_rate && (
                                    <div className="text-sm text-muted-foreground">
                                      {item.loan_products.default_nominal_interest_rate}% APR
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="p-4 font-medium">
                                {formatCurrency(
                                  item.type === 'application' 
                                    ? item.requested_amount || 0 
                                    : item.principal_amount || 0
                                )}
                              </td>
                               <td className="p-4">
                                 <Badge 
                                   className={
                                     item.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                     item.status === 'approved' ? 'bg-green-100 text-green-800' :
                                     item.status === 'active' ? 'bg-green-100 text-green-800' :
                                     item.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                     item.status === 'closed' ? 'bg-gray-100 text-gray-800' :
                                     'bg-gray-100 text-gray-800'
                                   }
                                 >
                                   {item.status}
                                 </Badge>
                               </td>
                              <td className="p-4 text-sm">
                                {format(
                                  new Date(
                                    item.type === 'application' 
                                      ? item.submitted_at || item.created_at
                                      : item.created_at
                                  ), 
                                  'dd MMM yyyy'
                                )}
                              </td>
                              <td className="p-4">
                                <Button variant="outline" size="sm" className="hover:bg-banking-primary hover:text-white">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Savings Account Overview */}
            <Card className="card-enhanced shadow-elevated">
              <CardHeader className="bg-gradient-to-r from-banking-accent/5 to-banking-emerald/5 border-b">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-banking-accent">
                    <PiggyBank className="h-5 w-5" />
                    Savings Accounts Overview
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="status-success">
                      {activeSavings.length} Active
                    </Badge>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setShowClosedSavings(!showClosedSavings)}
                      className="text-xs"
                    >
                      {showClosedSavings ? 'Hide' : 'Show'} Closed
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {activeSavings.length === 0 ? (
                  <div className="text-center py-12">
                    <PiggyBank className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">No Savings Accounts</h3>
                    <p className="text-muted-foreground mb-4">Create the first savings account to get started</p>
                    <Button onClick={() => setShowNewSavings(true)} className="bg-gradient-success">
                      <Plus className="h-4 w-4 mr-2" />
                      Create First Savings Account
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="rounded-lg border overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-muted/50">
                            <tr>
                              <th className="text-left p-4 font-medium">Account</th>
                              <th className="text-left p-4 font-medium">Product</th>
                              <th className="text-left p-4 font-medium">Last Activity</th>
                              <th className="text-left p-4 font-medium">Balance</th>
                              <th className="text-left p-4 font-medium">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {activeSavings.map((account) => (
                              <tr key={account.id} className="border-t hover:bg-muted/30 transition-colors">
                                <td className="p-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-3 h-3 bg-success rounded-full"></div>
                                    <span className="font-mono text-sm font-medium">
                                      {account.account_number || `S-${account.id.slice(0, 8)}`}
                                    </span>
                                  </div>
                                </td>
                                <td className="p-4">
                                  <div>
                                    <div className="font-medium">
                                      {account.savings_products?.name || 'CLIENT FUND ACCOUNT'}
                                    </div>
                                    {account.savings_products?.nominal_annual_interest_rate && (
                                      <div className="text-sm text-muted-foreground">
                                        {account.savings_products.nominal_annual_interest_rate}% APR
                                      </div>
                                    )}
                                  </div>
                                </td>
                                <td className="p-4 text-sm">
                                  {format(new Date(account.updated_at || account.created_at), 'dd MMM yyyy')}
                                </td>
                                <td className="p-4 font-bold text-success text-lg">
                                  {formatCurrency(account.account_balance || 0)}
                                </td>
                                <td className="p-4">
                                  <div className="flex gap-2">
                                    <Button variant="outline" size="sm" title="Deposit" className="hover:bg-banking-accent hover:text-white">
                                      <Plus className="h-4 w-4" />
                                    </Button>
                                    <Button variant="outline" size="sm" title="View Details" className="hover:bg-banking-primary hover:text-white">
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    
                    {showClosedSavings && savings.filter(account => ['closed', 'inactive', 'dormant'].includes(account.status?.toLowerCase())).length > 0 && (
                      <div className="mt-6 pt-6 border-t">
                        <h4 className="font-semibold mb-4 text-muted-foreground flex items-center gap-2">
                          <X className="h-4 w-4" />
                          Closed Savings Accounts
                        </h4>
                        <div className="rounded-lg border overflow-hidden opacity-60">
                          <table className="w-full">
                            <tbody>
                              {savings.filter(account => ['closed', 'inactive', 'dormant'].includes(account.status?.toLowerCase())).map((account) => (
                                <tr key={account.id} className="border-t">
                                  <td className="p-4 font-mono text-sm">{account.account_number}</td>
                                  <td className="p-4">{account.savings_products?.name}</td>
                                  <td className="p-4 font-medium">{formatCurrency(account.account_balance || 0)}</td>
                                  <td className="p-4">{getStatusBadge(account.status)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Client Profile */}
          <div className="space-y-6">
            <Card className="card-enhanced shadow-elevated">
              <CardContent className="p-6">
                <div className="text-center space-y-6">
                  <div>
                    <h3 className="text-xl font-bold text-banking-primary mb-2">
                      {client.first_name} {client.last_name}
                    </h3>
                    <p className="text-muted-foreground">Client Profile</p>
                  </div>
                  
                  <Avatar className="h-24 w-24 mx-auto border-4 border-banking-primary/20">
                    <AvatarImage src={client.profile_picture_url || ""} />
                    <AvatarFallback className="bg-gradient-primary text-white text-xl">
                      {client.first_name[0]}{client.last_name[0]}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex justify-center gap-2">
                    <Button variant="outline" size="sm" className="hover:bg-banking-primary hover:text-white">
                      <Plus className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" className="hover:bg-banking-primary hover:text-white">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" className="hover:bg-banking-primary hover:text-white">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>

                  <Button variant="link" className="text-banking-primary hover:text-banking-primary/80">
                    View Client Signature
                  </Button>
                </div>

                <div className="mt-6 pt-6 border-t space-y-4">
                  <div className="grid grid-cols-1 gap-3 text-sm">
                    <div className="flex justify-between items-center p-2 rounded bg-muted/30">
                      <span className="text-muted-foreground">Activation Date</span>
                      <span className="font-medium">{format(new Date(client.created_at), 'dd MMM yyyy')}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded">
                      <span className="text-muted-foreground">Mobile Number</span>
                      <span className="font-medium">{client.phone || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded bg-muted/30">
                      <span className="text-muted-foreground">Gender</span>
                      <span className="font-medium capitalize">{client.gender || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded">
                      <span className="text-muted-foreground">Date of Birth</span>
                      <span className="font-medium">
                        {client.date_of_birth ? format(new Date(client.date_of_birth), 'dd MMM yyyy') : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded bg-muted/30">
                      <span className="text-muted-foreground">Active Loans</span>
                      <Badge className="status-info">{activeLoans.length}</Badge>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded">
                      <span className="text-muted-foreground">Total Savings</span>
                      <span className="font-bold text-success">{formatCurrency(calculateSavingsBalance())}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded bg-muted/30">
                      <span className="text-muted-foreground">Active Savings</span>
                      <Badge className="status-success">{activeSavings.length}</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Tab Content */}
        <div className="mt-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsContent value="general" className="mt-6">
              <Card className="card-enhanced shadow-elevated">
                <CardContent className="p-6">
                  <ClientGeneralTab client={client} />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="identities" className="mt-6">
              <Card className="card-enhanced shadow-elevated">
                <CardContent className="p-6">
                  <ClientIdentitiesTab clientId={client.id} />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="documents" className="mt-6">
              <Card className="card-enhanced shadow-elevated">
                <CardContent className="p-6">
                  <ClientDocumentsTab clientId={client.id} />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="additional-info" className="mt-6">
              <Card className="card-enhanced shadow-elevated">
                <CardContent className="p-6">
                  <ClientAdditionalInfoTab client={client} />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="bank-details" className="mt-6">
              <Card className="card-enhanced shadow-elevated">
                <CardContent className="p-6">
                  <ClientBankDetailsTab client={client} />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="ussd-info" className="mt-6">
              <Card className="card-enhanced shadow-elevated">
                <CardContent className="p-6">
                  <ClientUssdTab clientId={client.id} />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="next-of-kin" className="mt-6">
              <Card className="card-enhanced shadow-elevated">
                <CardContent className="p-6">
                  <ClientNextOfKinTab client={client} />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="notes" className="mt-6">
              <Card className="card-enhanced shadow-elevated">
                <CardContent className="p-6">
                  <ClientNotesTab clientId={client.id} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Dialogs */}
      <NewLoanDialog
        open={showNewLoan}
        onOpenChange={setShowNewLoan}
        clientId={client.id}
      />
      <NewSavingsDialog
        open={showNewSavings}
        onOpenChange={setShowNewSavings}
        clientId={client.id}
      />
      <NewShareAccountDialog
        open={showNewShareAccount}
        onOpenChange={setShowNewShareAccount}
        clientId={client.id}
      />
      <AddChargeDialog
        open={showAddCharge}
        onOpenChange={setShowAddCharge}
        clientId={client.id}
      />
      <TransferClientDialog
        open={showTransferClient}
        onOpenChange={setShowTransferClient}
        client={client}
      />
    </div>
  );
};

export default ClientDetailsPage;