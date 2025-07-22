import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  StickyNote,
  Check,
  Edit2
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
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
import { useToast } from "@/hooks/use-toast";
import { useProcessLoanDisbursement } from "@/hooks/useLoanManagement";

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
  tenant_id: string;
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
  const processDisbursement = useProcessLoanDisbursement();
  
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
  
  // Account Detail Modals
  const [showLoanDetailsModal, setShowLoanDetailsModal] = useState(false);
  const [showSavingsDetailsModal, setShowSavingsDetailsModal] = useState(false);
  const [showAllLoansModal, setShowAllLoansModal] = useState(false);
  const [showAllSavingsModal, setShowAllSavingsModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  
  // Loan Action Modal State
  const [showLoanActionModal, setShowLoanActionModal] = useState(false);
  const [selectedLoanItem, setSelectedLoanItem] = useState<any>(null);
  const [actionDate, setActionDate] = useState<Date | undefined>(new Date());
  const [disbursementMethod, setDisbursementMethod] = useState("cash");
  const [receiptNumber, setReceiptNumber] = useState("");

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

      // Fetch loans with better error handling and retry logic
      let loansData = null;
      let loansError = null;
      
      for (let attempt = 0; attempt < 3; attempt++) {
        const { data, error } = await supabase
          .from('loans')
          .select(`
            *,
            loan_products!inner (
              name,
              short_name,
              default_nominal_interest_rate
            )
          `)
          .eq('client_id', clientId)
          .order('created_at', { ascending: false });
          
        if (!error) {
          loansData = data;
          break;
        }
        
        loansError = error;
        if (attempt < 2) {
          // Wait a bit before retrying
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

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

      // Also fetch loan applications with retry logic
      let applicationsData = null;
      let applicationsError = null;
      
      for (let attempt = 0; attempt < 3; attempt++) {
        const { data, error } = await supabase
          .from('loan_applications')
          .select(`
            *,
            loan_products!inner (
              name,
              short_name,
              default_nominal_interest_rate
            )
          `)
          .eq('client_id', clientId)
          .order('created_at', { ascending: false });
          
        if (!error) {
          applicationsData = data;
          break;
        }
        
        applicationsError = error;
        if (attempt < 2) {
          // Wait a bit before retrying
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

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
        {/* Client Header Section */}
        <div className="bg-white rounded-xl border border-border/50 shadow-sm overflow-hidden">
          {/* Top Row - Client Info with Avatar on far right */}
          <div className="bg-gradient-to-r from-primary to-primary/80 p-8 text-white">
            <div className="flex items-center justify-between">
              {/* Left: Client Info and Status */}
              <div className="flex-1">
                <h1 className="text-2xl font-semibold mb-2">
                  {client.first_name} {client.last_name}
                </h1>
                <div className="flex items-center gap-4 text-white/90 text-sm mb-3">
                  <span>Client #{client.client_number}</span>
                  <span>•</span>
                  <span>ID: {client.mifos_client_id || 'N/A'}</span>
                  <span>•</span>
                  <span>Staff: ADMIN</span>
                </div>
                
                {/* Client Details Grid */}
                <div className="grid grid-cols-3 gap-6 mb-3">
                  <div className="space-y-1">
                    {client.phone && (
                      <div className="flex items-center gap-2 text-white/90 text-sm">
                        <Phone className="h-4 w-4" />
                        <span>{client.phone}</span>
                      </div>
                    )}
                    {client.email && (
                      <div className="flex items-center gap-2 text-white/90 text-sm">
                        <span>📧</span>
                        <span>{client.email}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-white/90 text-sm">
                      <span>📅</span>
                      <span>Joined {format(new Date(client.created_at), 'dd MMM yyyy')}</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    {client.occupation && (
                      <div className="flex items-center gap-2 text-white/90 text-sm">
                        <Building className="h-4 w-4" />
                        <span>{client.occupation}</span>
                      </div>
                    )}
                    {client.national_id && (
                      <div className="flex items-center gap-2 text-white/90 text-sm">
                        <IdCard className="h-4 w-4" />
                        <span>{client.national_id}</span>
                      </div>
                    )}
                    {client.gender && (
                      <div className="flex items-center gap-2 text-white/90 text-sm">
                        <span>👤</span>
                        <span className="capitalize">{client.gender}</span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-white/90 text-sm">
                      <CreditCard className="h-4 w-4" />
                      <span>{activeLoans.length} Active Loans</span>
                    </div>
                    <div className="flex items-center gap-2 text-white/90 text-sm">
                      <PiggyBank className="h-4 w-4" />
                      <span>{formatCurrency(calculateSavingsBalance())} Savings</span>
                    </div>
                    <div className="flex items-center gap-2 text-white/90 text-sm">
                      <Building className="h-4 w-4" />
                      <span>{activeSavings.length} Savings Accounts</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/30">
                    {client.approval_status || 'approved'}
                  </Badge>
                  <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/30">
                    {client.kyc_status || 'completed'}
                  </Badge>
                </div>
              </div>

              {/* Far Right: Client Avatar */}
              <Avatar className="h-20 w-20 border-4 border-white/20 shadow-lg">
                <AvatarImage src={client.profile_picture_url || ""} />
                <AvatarFallback className="bg-white/10 text-xl font-semibold text-white">
                  {client.first_name[0]}{client.last_name[0]}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>

          {/* Action Buttons Row */}
          <div className="p-6 bg-white border-t border-border/20">
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <Button onClick={() => setShowNewLoan(true)} className="bg-gradient-primary">
                  <CreditCard className="h-4 w-4 mr-2" />
                  New Loan
                </Button>
                <Button onClick={() => setShowNewSavings(true)} className="bg-gradient-secondary">
                  <PiggyBank className="h-4 w-4 mr-2" />
                  New Savings
                </Button>
                <Button onClick={() => setShowNewShareAccount(true)} variant="outline">
                  <Share className="h-4 w-4 mr-2" />
                  Share Account
                </Button>
                <Button onClick={() => setShowAddCharge(true)} variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Charge
                </Button>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4 mr-2" />
                    More Actions
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setShowTransferClient(true)}>
                    <ArrowRightLeft className="h-4 w-4 mr-2" />
                    Transfer Client
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive">
                    <UserMinus className="h-4 w-4 mr-2" />
                    Close Client
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Accounts Overview Section - Full Width */}
        <div className="bg-white rounded-xl border border-border/50 shadow-sm overflow-hidden">
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  
                  {/* Loans Overview */}
                  <Card className="card-enhanced shadow-elevated">
                    <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2 text-primary">
                          <CreditCard className="h-5 w-5" />
                          Loan Accounts ({activeLoans.length})
                        </CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {formatCurrency(calculateLoanBalance())} Outstanding
                          </Badge>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setShowClosedLoans(!showClosedLoans)}
                            className="text-xs"
                          >
                            {showClosedLoans ? 'Hide' : 'Show'} Closed
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4">
                      {allVisibleItems.length === 0 ? (
                        <div className="text-center py-6">
                          <CreditCard className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground mb-3">No loan accounts</p>
                          <Button onClick={() => setShowNewLoan(true)} size="sm" className="bg-gradient-primary">
                            <Plus className="h-4 w-4 mr-1" />
                            New Loan
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {allVisibleItems.slice(0, 3).map((item) => (
                            <div 
                              key={item.id} 
                              className="flex items-center justify-between p-3 bg-muted/30 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                              onClick={() => {
                                setSelectedAccount(item);
                                setShowLoanDetailsModal(true);
                              }}
                            >
                              <div className="flex-1">
                                <div className="font-medium text-sm">
                                  {item.loan_products?.name || 'Standard Loan'}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {item.type === 'application' 
                                    ? item.application_number 
                                    : item.loan_number || `L-${item.id.slice(0, 8)}`
                                  }
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-medium text-sm">
                                  {formatCurrency(
                                    item.type === 'application' 
                                      ? item.requested_amount || 0 
                                      : item.principal_amount || 0
                                  )}
                                </div>
                                <Badge className={
                                  item.status === 'active' ? 'bg-green-100 text-green-800 text-xs' :
                                  item.status === 'pending' ? 'bg-yellow-100 text-yellow-800 text-xs' :
                                  'bg-gray-100 text-gray-800 text-xs'
                                }>
                                  {item.status}
                                </Badge>
                              </div>
                            </div>
                          ))}
                          {allVisibleItems.length > 3 && (
                            <div className="text-center pt-2">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-xs"
                                onClick={() => setShowAllLoansModal(true)}
                              >
                                +{allVisibleItems.length - 3} more loans
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Savings Overview */}
                  <Card className="card-enhanced shadow-elevated">
                    <CardHeader className="bg-gradient-to-r from-accent/5 to-accent/10 border-b">
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2 text-accent">
                          <PiggyBank className="h-5 w-5" />
                          Savings Accounts ({activeSavings.length})
                        </CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {formatCurrency(calculateSavingsBalance())} Total
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
                    <CardContent className="p-4">
                      {activeSavings.length === 0 ? (
                        <div className="text-center py-6">
                          <PiggyBank className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground mb-3">No savings accounts</p>
                          <Button onClick={() => setShowNewSavings(true)} size="sm" className="bg-gradient-secondary">
                            <Plus className="h-4 w-4 mr-1" />
                            New Savings
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {activeSavings.slice(0, 3).map((account) => (
                            <div 
                              key={account.id} 
                              className="flex items-center justify-between p-3 bg-muted/30 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                              onClick={() => {
                                setSelectedAccount(account);
                                setShowSavingsDetailsModal(true);
                              }}
                            >
                              <div className="flex-1">
                                <div className="font-medium text-sm">
                                  {account.savings_products?.name || 'Savings Account'}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {account.account_number}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-medium text-sm">
                                  {formatCurrency(account.account_balance || 0)}
                                </div>
                                <div className="flex items-center gap-1">
                                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                  <span className="text-xs text-muted-foreground">Active</span>
                                </div>
                              </div>
                            </div>
                          ))}
                          {activeSavings.length > 3 && (
                            <div className="text-center pt-2">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-xs"
                                onClick={() => setShowAllSavingsModal(true)}
                              >
                                +{activeSavings.length - 3} more accounts
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>

        {/* Client Details Tab Section */}
        <div className="bg-white rounded-xl border border-border/50 shadow-sm overflow-hidden">
          <div className="p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="h-auto p-0 bg-transparent w-full justify-start">
                <div className="flex overflow-x-auto scrollbar-hide gap-1">
                  {shouldShowTab('general', client, loans, savings) && (
                    <TabsTrigger value="general" className="whitespace-nowrap px-4 py-3 text-sm font-medium text-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg border border-transparent data-[state=active]:border-primary transition-all">
                      <Info className="h-4 w-4 mr-2" />
                      General
                    </TabsTrigger>
                  )}
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
              
              {/* Tab Content */}
              <div className="mt-6">
                <TabsContent value="general" className="mt-0">
                  <ClientGeneralTab client={client} />
                </TabsContent>
                <TabsContent value="identities" className="mt-0">
                  <ClientIdentitiesTab clientId={client.id} />
                </TabsContent>
                <TabsContent value="documents" className="mt-0">
                  <ClientDocumentsTab clientId={client.id} />
                </TabsContent>
                <TabsContent value="bank-details" className="mt-0">
                  <ClientBankDetailsTab client={client} />
                </TabsContent>
                <TabsContent value="next-of-kin" className="mt-0">
                  <ClientNextOfKinTab client={client} />
                </TabsContent>
                <TabsContent value="additional-info" className="mt-0">
                  <ClientAdditionalInfoTab client={client} />
                </TabsContent>
                <TabsContent value="notes" className="mt-0">
                  <ClientNotesTab clientId={client.id} />
                </TabsContent>
              </div>
            </Tabs>
          </div>
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

      {/* Loan Action Modal */}
      <Dialog open={showLoanActionModal} onOpenChange={setShowLoanActionModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              {selectedLoanItem?.status === 'approved' ? 'Disburse Loan Account' : 
               selectedLoanItem?.type === 'application' ? 'Loan Application Details' : 'Loan Account Details'}
            </DialogTitle>
          </DialogHeader>

          {selectedLoanItem && (
            <div className="space-y-6">
              {/* Enhanced Disbursement Form for Approved Loans */}
              {selectedLoanItem?.status === 'approved' ? (
                <div className="space-y-6">
                  {/* Disbursement Method Selection */}
                  <div className="space-y-4 p-4 border rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50">
                    <h4 className="font-semibold text-blue-900 flex items-center gap-2">
                      <DollarSign className="h-5 w-5" />
                      Select Disbursement Method
                    </h4>
                    <RadioGroup value={disbursementMethod} onValueChange={setDisbursementMethod} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-white/60 transition-colors">
                        <RadioGroupItem value="savings" id="savings" />
                        <Label htmlFor="savings" className="flex items-center gap-2 font-medium cursor-pointer">
                          <PiggyBank className="h-4 w-4 text-blue-600" />
                          Transfer to Savings
                        </Label>
                      </div>
                      <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-white/60 transition-colors">
                        <RadioGroupItem value="bank" id="bank" />
                        <Label htmlFor="bank" className="flex items-center gap-2 font-medium cursor-pointer">
                          <Building className="h-4 w-4 text-purple-600" />
                          Bank Transfer
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Disbursement Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">
                        Disbursement Date<span className="text-red-500">*</span>
                      </Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !actionDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {actionDate ? format(actionDate, "dd MMM yyyy") : <span>Pick a date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={actionDate}
                            onSelect={setActionDate}
                            initialFocus
                            className={cn("p-3 pointer-events-auto")}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">
                        Disbursement Amount<span className="text-red-500">*</span>
                      </Label>
                      <Input
                        type="text"
                        value={formatCurrency(selectedLoanItem.type === 'application' 
                          ? selectedLoanItem.requested_amount || 0 
                          : selectedLoanItem.principal_amount || 0)}
                        disabled
                        className="bg-muted/30 font-semibold text-lg"
                      />
                    </div>
                  </div>

                  {/* Method-specific Fields */}
                  {disbursementMethod === 'savings' && (
                    <div className="p-4 border rounded-lg bg-blue-50">
                      <div className="flex items-center gap-2 mb-3">
                        <PiggyBank className="h-5 w-5 text-blue-600" />
                        <h5 className="font-medium text-blue-900">Savings Account Transfer</h5>
                      </div>
                      <p className="text-sm text-blue-700 mb-3">
                        Funds will be automatically transferred to the client's active savings account.
                        A unique transaction receipt will be generated.
                      </p>
                      <div className="bg-blue-100 p-3 rounded border border-blue-200">
                        <p className="text-xs text-blue-800">
                          <strong>Auto-generated Receipt:</strong> SAV-{Date.now().toString().slice(-6)}-{Math.random().toString(36).substr(2, 4).toUpperCase()}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Button 
                      onClick={() => setShowLoanActionModal(false)} 
                      variant="outline"
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button 
                      className="flex-1 bg-gradient-primary"
                      onClick={() => {
                        if (disbursementMethod === 'savings') {
                          processDisbursement.mutate({
                            loan_application_id: selectedLoanItem.id,
                            disbursed_amount: selectedLoanItem.requested_amount || selectedLoanItem.principal_amount || 0,
                            disbursement_date: actionDate?.toISOString() || new Date().toISOString(),
                            disbursement_method: 'transfer_to_savings'
                          });
                        }
                        setShowLoanActionModal(false);
                      }}
                    >
                      <DollarSign className="h-4 w-4 mr-2" />
                      Process Disbursement
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm text-muted-foreground">Product</Label>
                      <p className="font-medium">{selectedLoanItem.loan_products?.name || 'Standard Loan'}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Amount</Label>
                      <p className="font-medium">
                        {formatCurrency(selectedLoanItem.type === 'application' 
                          ? selectedLoanItem.requested_amount || 0 
                          : selectedLoanItem.principal_amount || 0
                        )}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Status</Label>
                      <p className="font-medium capitalize">{selectedLoanItem.status}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Date</Label>
                      <p className="font-medium">
                        {format(new Date(selectedLoanItem.type === 'application' 
                          ? selectedLoanItem.submitted_at || selectedLoanItem.created_at
                          : selectedLoanItem.created_at
                        ), 'dd MMM yyyy')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <Button onClick={() => setShowLoanActionModal(false)} variant="outline" className="flex-1">
                      Close
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Account Details Modals */}
      {/* Loan Details Modal */}
      <Dialog open={showLoanDetailsModal} onOpenChange={setShowLoanDetailsModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Loan Account Details
            </DialogTitle>
          </DialogHeader>
          {selectedAccount && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Product</Label>
                  <p className="font-medium">{selectedAccount.loan_products?.name || 'Standard Loan'}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Account Number</Label>
                  <p className="font-medium">
                    {selectedAccount.type === 'application' 
                      ? selectedAccount.application_number 
                      : selectedAccount.loan_number || `L-${selectedAccount.id.slice(0, 8)}`
                    }
                  </p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Amount</Label>
                  <p className="font-medium">
                    {formatCurrency(selectedAccount.type === 'application' 
                      ? selectedAccount.requested_amount || 0 
                      : selectedAccount.principal_amount || 0
                    )}
                  </p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Status</Label>
                  <Badge className={
                    selectedAccount.status === 'active' ? 'bg-green-100 text-green-800' :
                    selectedAccount.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }>
                    {selectedAccount.status}
                  </Badge>
                </div>
                {selectedAccount.type !== 'application' && (
                  <>
                    <div>
                      <Label className="text-sm text-muted-foreground">Outstanding Balance</Label>
                      <p className="font-medium">{formatCurrency(selectedAccount.outstanding_balance || 0)}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Interest Rate</Label>
                      <p className="font-medium">{selectedAccount.nominal_annual_interest_rate || selectedAccount.loan_products?.default_nominal_interest_rate || 0}%</p>
                    </div>
                  </>
                )}
                <div>
                  <Label className="text-sm text-muted-foreground">Date Created</Label>
                  <p className="font-medium">
                    {format(new Date(selectedAccount.created_at), 'dd MMM yyyy')}
                  </p>
                </div>
                {selectedAccount.type === 'application' && selectedAccount.requested_term && (
                  <div>
                    <Label className="text-sm text-muted-foreground">Requested Term</Label>
                    <p className="font-medium">{selectedAccount.requested_term} months</p>
                  </div>
                )}
              </div>
              
              <div className="flex gap-3 pt-4">
                <Button onClick={() => setShowLoanDetailsModal(false)} variant="outline" className="flex-1">
                  Close
                </Button>
                {selectedAccount.status === 'approved' && (
                  <Button 
                    onClick={() => {
                      setSelectedLoanItem(selectedAccount);
                      setShowLoanDetailsModal(false);
                      setShowLoanActionModal(true);
                    }} 
                    className="flex-1 bg-gradient-primary"
                  >
                    <DollarSign className="h-4 w-4 mr-2" />
                    Process Disbursement
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Savings Details Modal */}
      <Dialog open={showSavingsDetailsModal} onOpenChange={setShowSavingsDetailsModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PiggyBank className="h-5 w-5" />
              Savings Account Details
            </DialogTitle>
          </DialogHeader>
          {selectedAccount && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Product</Label>
                  <p className="font-medium">{selectedAccount.savings_products?.name || 'Savings Account'}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Account Number</Label>
                  <p className="font-medium">{selectedAccount.account_number}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Current Balance</Label>
                  <p className="font-medium">{formatCurrency(selectedAccount.account_balance || 0)}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Available Balance</Label>
                  <p className="font-medium">{formatCurrency(selectedAccount.available_balance || 0)}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Interest Rate</Label>
                  <p className="font-medium">{selectedAccount.savings_products?.nominal_annual_interest_rate || 0}%</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Interest Earned</Label>
                  <p className="font-medium">{formatCurrency(selectedAccount.interest_earned || 0)}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Opened Date</Label>
                  <p className="font-medium">
                    {format(new Date(selectedAccount.opened_date || selectedAccount.created_at), 'dd MMM yyyy')}
                  </p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Status</Label>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">Active</span>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3 pt-4">
                <Button onClick={() => setShowSavingsDetailsModal(false)} variant="outline" className="flex-1">
                  Close
                </Button>
                <Button variant="outline" className="flex-1">
                  <Eye className="h-4 w-4 mr-2" />
                  View Transactions
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* All Loans Modal */}
      <Dialog open={showAllLoansModal} onOpenChange={setShowAllLoansModal}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              All Loan Accounts ({allVisibleItems.length})
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {allVisibleItems.map((item) => (
              <div 
                key={item.id} 
                className="flex items-center justify-between p-4 bg-muted/30 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => {
                  setSelectedAccount(item);
                  setShowAllLoansModal(false);
                  setShowLoanDetailsModal(true);
                }}
              >
                <div className="flex-1">
                  <div className="font-medium">
                    {item.loan_products?.name || 'Standard Loan'}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {item.type === 'application' 
                      ? item.application_number 
                      : item.loan_number || `L-${item.id.slice(0, 8)}`
                    }
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Created: {format(new Date(item.created_at), 'dd MMM yyyy')}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">
                    {formatCurrency(
                      item.type === 'application' 
                        ? item.requested_amount || 0 
                        : item.principal_amount || 0
                    )}
                  </div>
                  {item.type !== 'application' && (
                    <div className="text-sm text-muted-foreground">
                      Outstanding: {formatCurrency(item.outstanding_balance || 0)}
                    </div>
                  )}
                  <Badge className={
                    item.status === 'active' ? 'bg-green-100 text-green-800 text-xs' :
                    item.status === 'pending' ? 'bg-yellow-100 text-yellow-800 text-xs' :
                    'bg-gray-100 text-gray-800 text-xs'
                  }>
                    {item.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-3 pt-4 border-t">
            <Button onClick={() => setShowAllLoansModal(false)} variant="outline" className="flex-1">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* All Savings Modal */}
      <Dialog open={showAllSavingsModal} onOpenChange={setShowAllSavingsModal}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PiggyBank className="h-5 w-5" />
              All Savings Accounts ({activeSavings.length})
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {activeSavings.map((account) => (
              <div 
                key={account.id} 
                className="flex items-center justify-between p-4 bg-muted/30 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => {
                  setSelectedAccount(account);
                  setShowAllSavingsModal(false);
                  setShowSavingsDetailsModal(true);
                }}
              >
                <div className="flex-1">
                  <div className="font-medium">
                    {account.savings_products?.name || 'Savings Account'}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {account.account_number}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Opened: {format(new Date(account.opened_date || account.created_at), 'dd MMM yyyy')}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">
                    {formatCurrency(account.account_balance || 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Available: {formatCurrency(account.available_balance || 0)}
                  </div>
                  <div className="flex items-center gap-1 justify-end">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-xs text-muted-foreground">Active</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-3 pt-4 border-t">
            <Button onClick={() => setShowAllSavingsModal(false)} variant="outline" className="flex-1">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClientDetailsPage;
