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
}

const ClientDetailsPage = () => {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [client, setClient] = useState<Client | null>(null);
  const [loans, setLoans] = useState<any[]>([]);
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
    <div className="p-6 space-y-6">
      {/* Header Section */}
      <div className="bg-white border rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <div>
              <h1 className="text-2xl font-bold text-gray-700">
                {client.first_name.toUpperCase()} {client.last_name.toUpperCase()}
              </h1>
              <div className="text-sm text-muted-foreground mt-1">
                Client #: {client.client_number} | External id: {client.mifos_client_id || 'N/A'} | Staff: ADMIN
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b mb-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="flex items-center justify-between">
              <TabsList className="h-auto p-0 bg-transparent">
                <TabsTrigger value="general" className="px-4 py-2">General</TabsTrigger>
                <TabsTrigger value="identities" className="px-4 py-2">Identities</TabsTrigger>
                <TabsTrigger value="documents" className="px-4 py-2">Documents</TabsTrigger>
                <TabsTrigger value="additional-info" className="px-4 py-2">Additional Info</TabsTrigger>
                <TabsTrigger value="bank-details" className="px-4 py-2 text-blue-600">BANK ACCOUNT DETAILS</TabsTrigger>
                <TabsTrigger value="ussd-info" className="px-4 py-2">Client USSD Info</TabsTrigger>
                <TabsTrigger value="next-of-kin" className="px-4 py-2">NEXT OF KIN</TabsTrigger>
                <TabsTrigger value="notes" className="px-4 py-2">Notes</TabsTrigger>
              </TabsList>
            </div>
          </Tabs>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 mb-6">
          <Button variant="outline" size="sm">
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowNewLoan(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Loan
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowNewSavings(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Saving
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowNewShareAccount(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Share Account
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowAddCharge(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add charge
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowTransferClient(true)}>
            <ArrowRightLeft className="h-4 w-4 mr-2" />
            Transfer Client
          </Button>
          <Button variant="outline" size="sm">
            <X className="h-4 w-4 mr-2" />
            Close
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Update Default Savings
          </Button>
          <Button variant="outline" size="sm">
            <UserMinus className="h-4 w-4 mr-2" />
            Unassign Staff
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                More
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>Activate Client</DropdownMenuItem>
              <DropdownMenuItem>View Client Summary</DropdownMenuItem>
              <DropdownMenuItem>Generate Collection Sheet</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Account Overview */}
        <div className="lg:col-span-2 space-y-6">
          {/* Loan Account Overview */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Loan Account Overview</CardTitle>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowClosedLoans(!showClosedLoans)}
              >
                View Closed Loans
              </Button>
            </CardHeader>
            <CardContent>
                  {activeLoans.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <div className="space-y-2">
                        <p>No active loan accounts found</p>
                        <Button variant="outline" onClick={() => setShowNewLoan(true)}>
                          Create First Loan
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-2">Account #</th>
                            <th className="text-left p-2">Loan Account</th>
                            <th className="text-left p-2">Original Loan</th>
                            <th className="text-left p-2">Loan Balance</th>
                            <th className="text-left p-2">Amount Paid</th>
                            <th className="text-left p-2">Type</th>
                            <th className="text-left p-2">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {activeLoans.map((loan) => (
                            <tr key={loan.id} className="border-b hover:bg-muted/50">
                              <td className="p-2 font-mono text-xs">{loan.loan_number || `L-${loan.id.slice(0, 8)}`}</td>
                               <td className="p-2">
                                 <div>
                                   <div>{loan.loan_products?.name || 'Standard Loan'}</div>
                                   {loan.loan_products?.default_nominal_interest_rate && (
                                     <div className="text-xs text-muted-foreground">
                                       {loan.loan_products.default_nominal_interest_rate}% APR
                                     </div>
                                   )}
                                 </div>
                               </td>
                              <td className="p-2 font-medium">{formatCurrency(loan.principal_amount || 0)}</td>
                              <td className="p-2 font-medium text-red-600">{formatCurrency(loan.outstanding_balance || 0)}</td>
                              <td className="p-2 font-medium text-green-600">{formatCurrency((loan.principal_amount || 0) - (loan.outstanding_balance || 0))}</td>
                              <td className="p-2">{getStatusBadge(loan.status)}</td>
                              <td className="p-2">
                                <Button variant="outline" size="sm">
                                  <Eye className="h-3 w-3" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      
                      {showClosedLoans && loans.filter(loan => ['closed', 'fully_paid', 'written_off'].includes(loan.status?.toLowerCase())).length > 0 && (
                        <div className="mt-4 pt-4 border-t">
                          <h4 className="font-medium mb-2 text-muted-foreground">Closed Loans</h4>
                          <table className="w-full text-sm">
                            <tbody>
                              {loans.filter(loan => ['closed', 'fully_paid', 'written_off'].includes(loan.status?.toLowerCase())).map((loan) => (
                                <tr key={loan.id} className="border-b opacity-60">
                                  <td className="p-2 font-mono text-xs">{loan.loan_number}</td>
                                  <td className="p-2">{loan.loan_products?.name}</td>
                                  <td className="p-2">{formatCurrency(loan.principal_amount || 0)}</td>
                                  <td className="p-2">{getStatusBadge(loan.status)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
            </CardContent>
          </Card>

          {/* Savings Account Overview */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Savings Account Overview</CardTitle>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowClosedSavings(!showClosedSavings)}
              >
                View Closed Savings
              </Button>
            </CardHeader>
            <CardContent>
                  {activeSavings.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <div className="space-y-2">
                        <p>No active savings accounts found</p>
                        <Button variant="outline" onClick={() => setShowNewSavings(true)}>
                          Create First Savings Account
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-2">Account #</th>
                            <th className="text-left p-2">Saving Account</th>
                            <th className="text-left p-2">Last Active</th>
                            <th className="text-left p-2">Balance</th>
                            <th className="text-left p-2">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {activeSavings.map((account) => (
                            <tr key={account.id} className="border-b hover:bg-muted/50">
                              <td className="p-2">
                                <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                  <span className="font-mono text-xs">{account.account_number || `S-${account.id.slice(0, 8)}`}</span>
                                </div>
                              </td>
                               <td className="p-2">
                                 <div>
                                   <div>{account.savings_products?.name || 'CLIENT FUND ACCOUNT'}</div>
                                   {account.savings_products?.nominal_annual_interest_rate && (
                                     <div className="text-xs text-muted-foreground">
                                       {account.savings_products.nominal_annual_interest_rate}% APR
                                     </div>
                                   )}
                                 </div>
                               </td>
                              <td className="p-2">{format(new Date(account.updated_at || account.created_at), 'dd MMM yyyy')}</td>
                              <td className="p-2 font-medium text-green-600">{formatCurrency(account.account_balance || 0)}</td>
                              <td className="p-2">
                                <div className="flex gap-1">
                                  <Button variant="outline" size="sm" title="Deposit">
                                    <Plus className="h-3 w-3" />
                                  </Button>
                                  <Button variant="outline" size="sm" title="View Details">
                                    <Eye className="h-3 w-3" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      
                      {showClosedSavings && savings.filter(account => ['closed', 'inactive', 'dormant'].includes(account.status?.toLowerCase())).length > 0 && (
                        <div className="mt-4 pt-4 border-t">
                          <h4 className="font-medium mb-2 text-muted-foreground">Closed Savings Accounts</h4>
                          <table className="w-full text-sm">
                            <tbody>
                              {savings.filter(account => ['closed', 'inactive', 'dormant'].includes(account.status?.toLowerCase())).map((account) => (
                                <tr key={account.id} className="border-b opacity-60">
                                  <td className="p-2 font-mono text-xs">{account.account_number}</td>
                                  <td className="p-2">{account.savings_products?.name}</td>
                                  <td className="p-2">{formatCurrency(account.account_balance || 0)}</td>
                                  <td className="p-2">{getStatusBadge(account.status)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Client Profile */}
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="text-center mb-4">
                <h3 className="font-bold text-lg">{client.first_name.toUpperCase()} {client.last_name.toUpperCase()}</h3>
              </div>
              
              <div className="flex justify-center mb-6">
                <Avatar className="h-32 w-32">
                  <AvatarImage src={client.profile_picture_url || undefined} />
                  <AvatarFallback className="text-2xl">
                    {client.first_name[0]}{client.last_name[0]}
                  </AvatarFallback>
                </Avatar>
              </div>

              <div className="flex justify-center gap-2 mb-6">
                <Button variant="outline" size="sm">
                  <Plus className="h-3 w-3" />
                </Button>
                <Button variant="outline" size="sm">
                  <Edit className="h-3 w-3" />
                </Button>
                <Button variant="outline" size="sm">
                  <Eye className="h-3 w-3" />
                </Button>
              </div>

              <div className="text-center mb-4">
                <Button variant="link" className="text-blue-600">
                  View Client Signature
                </Button>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Activation date</span>
                  <span>{format(new Date(client.created_at), 'dd MMM yyyy')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Member Of</span>
                  <span>-</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Is Staff?</span>
                  <span>No</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mobile number</span>
                  <span>{client.phone || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Gender</span>
                  <span className="capitalize">{client.gender || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Client Classification</span>
                  <span>Self Employed</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date of Birth</span>
                  <span>
                    {client.date_of_birth ? format(new Date(client.date_of_birth), 'dd MMM yyyy') : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Performance History</span>
                  <span>-</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground"># of Loan Cycle</span>
                  <span>0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last loan amount</span>
                  <span>0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground"># of active loans</span>
                  <span>{activeLoans.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total savings(KES)</span>
                  <span>{calculateSavingsBalance()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground"># of active savings</span>
                  <span>{activeSavings.length}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tab Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsContent value="general">
          <ClientGeneralTab client={client} />
        </TabsContent>
        <TabsContent value="identities">
          <ClientIdentitiesTab clientId={client.id} />
        </TabsContent>
        <TabsContent value="documents">
          <ClientDocumentsTab clientId={client.id} />
        </TabsContent>
        <TabsContent value="additional-info">
          <ClientAdditionalInfoTab client={client} />
        </TabsContent>
        <TabsContent value="bank-details">
          <ClientBankDetailsTab client={client} />
        </TabsContent>
        <TabsContent value="ussd-info">
          <ClientUssdTab clientId={client.id} />
        </TabsContent>
        <TabsContent value="next-of-kin">
          <ClientNextOfKinTab client={client} />
        </TabsContent>
        <TabsContent value="notes">
          <ClientNotesTab clientId={client.id} />
        </TabsContent>
      </Tabs>

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