import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Edit, 
  CreditCard, 
  PiggyBank, 
  UserMinus, 
  FileText,
  IdCard,
  Info,
  Building,
  Phone,
  StickyNote,
  Building2,
  Users,
  ArrowRightLeft,
} from "lucide-react";
import { ClientGeneralTab } from "@/components/client/tabs/ClientGeneralTab";
import { ClientDocumentsTab } from "@/components/client/tabs/ClientDocumentsTab";
import { ClientEmploymentTab } from "@/components/client/tabs/ClientEmploymentTab";
import { ClientBusinessTab } from "@/components/client/tabs/ClientBusinessTab";
import { ClientSavingsTab } from "@/components/client/tabs/ClientSavingsTab";
import { ClientTransferTab } from "@/components/client/tabs/ClientTransferTab";
import { ClientLoanOfficerTab } from "@/components/client/tabs/ClientLoanOfficerTab";
import { ClientGroupsTab } from "@/components/client/tabs/ClientGroupsTab";

import { AddSavingsAccountDialog } from "@/components/client/AddSavingsAccountDialog";
import { SavingsAccountDetailsDialog } from "@/components/savings/SavingsAccountDetailsDialog";
import { ClientBankDetailsTab } from "@/components/client/tabs/ClientBankDetailsTab";
import { ClientUssdTab } from "@/components/client/tabs/ClientUssdTab";
import { ClientNextOfKinTab } from "@/components/client/tabs/ClientNextOfKinTab";
import { ClientNotesTab } from "@/components/client/tabs/ClientNotesTab";
import { NewLoanDialog } from "@/components/client/dialogs/NewLoanDialog";
import { NewSavingsDialog } from "@/components/client/dialogs/NewSavingsDialog";
// Using enhanced workflow dialog
import { useCurrency } from "@/contexts/CurrencyContext";
import { EnhancedLoanWorkflowDialog } from "@/components/loan/EnhancedLoanWorkflowDialog";
import { LoanDisbursementDialog } from "@/components/loan/LoanDisbursementDialog";
import { LoanDetailsDialog } from "@/components/loan/LoanDetailsDialog";
import { ClientHeader } from "@/components/client/ClientHeader";
import { ClientLoansTab } from "@/components/client/ClientLoansTab";
import { EditClientForm } from "@/components/forms/EditClientForm";
import { ClientIdentifiersTab } from "@/components/client/tabs/ClientIdentifiersTab";
import { EditBankDetailsDialog } from "@/components/client/dialogs/EditBankDetailsDialog";
import { EditEmploymentDialog } from "@/components/client/dialogs/EditEmploymentDialog";
import { EditBusinessDialog } from "@/components/client/dialogs/EditBusinessDialog";
import { EditNextOfKinDialog } from "@/components/client/dialogs/EditNextOfKinDialog";
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
  job_title?: string | null;
  business_type?: string | null;
  tenant_id: string;
  office_id?: string | null;
  loan_officer_id?: string | null;
}

// Helper function to determine which tabs to show based on captured data
const shouldShowTab = (tabName: string, client: Client, loans: any[], savings: any[]) => {
  // All tabs should be shown with equal priority
  return true;
};

const ClientDetailsPageRefactored = () => {
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
  // Header extras
  const [officeName, setOfficeName] = useState<string | null>(null);
  const [loanOfficerName, setLoanOfficerName] = useState<string | null>(null);
  const [clientTRP, setClientTRP] = useState<number | null>(null);
  
  // Dialog states
  const [showNewLoan, setShowNewLoan] = useState(false);
  const [showNewSavings, setShowNewSavings] = useState(false);
  const [showAddSavingsAccount, setShowAddSavingsAccount] = useState(false);
  const [showSavingsAccountDetails, setShowSavingsAccountDetails] = useState(false);
  const [selectedSavingsAccount, setSelectedSavingsAccount] = useState<any>(null);
  // Removed unwanted dialog states
  const [showClosedLoans, setShowClosedLoans] = useState(false);
  const [showClosedSavings, setShowClosedSavings] = useState(false);
  
  // Modal states for all tabs
  const [showEditClientModal, setShowEditClientModal] = useState(false);
  const [showIdentitiesModal, setShowIdentitiesModal] = useState(false);
  const [showDocumentsModal, setShowDocumentsModal] = useState(false);
  const [showBankDetailsModal, setShowBankDetailsModal] = useState(false);
  const [showEmploymentModal, setShowEmploymentModal] = useState(false);
  const [showBusinessModal, setShowBusinessModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showLoanOfficerModal, setShowLoanOfficerModal] = useState(false);
  const [showGroupsModal, setShowGroupsModal] = useState(false);
  const [showNextOfKinModal, setShowNextOfKinModal] = useState(false);
  const [showCloseClientModal, setShowCloseClientModal] = useState(false);
  
  // Workflow states
  const [showLoanWorkflowModal, setShowLoanWorkflowModal] = useState(false);
  const [showDisbursementModal, setShowDisbursementModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [selectedLoanForWorkflow, setSelectedLoanForWorkflow] = useState<any>(null);
  const [showLoanDetailsModal, setShowLoanDetailsModal] = useState(false);
  const [selectedLoanForDetails, setSelectedLoanForDetails] = useState<any>(null);

  useEffect(() => {
    if (clientId) {
      fetchClientData();
    }
  }, [clientId]);

  // Real-time subscription for loan and savings updates
  useEffect(() => {
    if (!clientId) return;

    const channel = supabase
      .channel('client-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'loans',
          filter: `client_id=eq.${clientId}`
        },
        (payload) => {
          console.log('Loan updated for client:', payload);
          fetchClientData(); // Refresh all data to get updated loan status
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'savings_accounts',
          filter: `client_id=eq.${clientId}`
        },
        (payload) => {
          console.log('Savings account updated for client:', payload);
          fetchClientData(); // Refresh all data to get updated savings
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'savings_transactions',
          filter: `savings_account_id=in.(${savings.map(s => s.id).join(',')})`
        },
        (payload) => {
          console.log('Savings transaction updated for client:', payload);
          fetchClientData(); // Refresh to show new transactions/balances
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [clientId, savings]);

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

    // Enrich: fetch office and loan officer names for header
    let officeNameLocal: string | null = null;
    let loanOfficerNameLocal: string | null = null;
    if (clientData.office_id) {
      const { data: office } = await supabase
        .from('offices')
        .select('office_name')
        .eq('id', clientData.office_id)
        .maybeSingle();
      officeNameLocal = office?.office_name || null;
    }
    if (clientData.loan_officer_id) {
      const { data: officer } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', clientData.loan_officer_id)
        .maybeSingle();
      loanOfficerNameLocal = officer ? `${officer.first_name || ''} ${officer.last_name || ''}`.trim() || null : null;
    }

    setOfficeName(officeNameLocal);
    setLoanOfficerName(loanOfficerNameLocal);

      // Fetch loans with better error handling
      const { data: loansData, error: loansError } = await supabase
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

      if (loansError) {
        console.error('Error fetching loans:', loansError);
      }

      // Fetch savings accounts
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

      // Fetch loan applications
      const { data: applicationsData, error: applicationsError } = await supabase
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

      if (applicationsError) {
        console.error('Error fetching loan applications:', applicationsError);
      }

      setClient(clientData);
      setLoans(loansData || []);
      setSavings(savingsData || []);
      setLoanApplications(applicationsData || []);

      // Compute average TRP across all client loans
      let trpValue: number | null = null;
      try {
        if (loansData && loansData.length > 0) {
          const loanIds = loansData.map((l: any) => l.id);
          const { data: sch, error: schErr } = await supabase
            .from('loan_schedules')
            .select('loan_id, due_date, total_amount, payment_status')
            .in('loan_id', loanIds);
          const { data: pays, error: payErr } = await supabase
            .from('loan_payments')
            .select('loan_id, payment_date, payment_amount')
            .in('loan_id', loanIds);
          if (schErr) throw schErr;
          if (payErr) throw payErr;

          const schedulesByLoan = new Map<string, any[]>();
          (sch || []).forEach((s: any) => {
            const arr = schedulesByLoan.get(s.loan_id) || [];
            arr.push(s);
            schedulesByLoan.set(s.loan_id, arr);
          });
          const paymentsByLoan = new Map<string, any[]>();
          (pays || []).forEach((p: any) => {
            const arr = paymentsByLoan.get(p.loan_id) || [];
            arr.push(p);
            paymentsByLoan.set(p.loan_id, arr);
          });

          const calcTrp = (schedules: any[], payments: any[]) => {
            try {
              const today = new Date();
              const dueSchedules = (schedules || [])
                .filter((s: any) => s?.due_date && new Date(s.due_date) <= today)
                .sort((a: any, b: any) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
              if (dueSchedules.length === 0) return 100;

              const orderedPayments = (payments || [])
                .filter((p: any) => p?.payment_date)
                .sort((a: any, b: any) => new Date(a.payment_date).getTime() - new Date(b.payment_date).getTime())
                .map((p: any) => ({ date: new Date(p.payment_date), amount: Number(p.payment_amount || 0) }));

              let payIdx = 0;
              let cumulativePaid = 0;
              const advanceTo = (upTo: Date) => {
                while (payIdx < orderedPayments.length && orderedPayments[payIdx].date <= upTo) {
                  cumulativePaid += orderedPayments[payIdx].amount;
                  payIdx++;
                }
                return cumulativePaid;
              };

              let timely = 0;
              let requiredCumulative = 0;
              for (const s of dueSchedules) {
                requiredCumulative += Number(s.total_amount || 0);
                const paidByDue = advanceTo(new Date(s.due_date));
                if (paidByDue + 0.0001 >= requiredCumulative) timely++;
              }
              return Math.round((timely / dueSchedules.length) * 100);
            } catch {
              return null;
            }
          };

          const trps: number[] = [];
          for (const l of loansData) {
            const s = schedulesByLoan.get(l.id) || [];
            const p = paymentsByLoan.get(l.id) || [];
            const t = calcTrp(s, p);
            if (t !== null && !isNaN(t)) trps.push(t);
          }
          if (trps.length > 0) {
            trpValue = Math.round(trps.reduce((a, b) => a + b, 0) / trps.length);
          }
        }
      } catch (e) {
        console.warn('Failed to compute client TRP', e);
      }
      setClientTRP(trpValue);
      
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

const { formatAmount: formatCurrency } = useCurrency();

  const calculateSavingsBalance = () => {
    return savings.reduce((sum, account) => sum + (account.account_balance || 0), 0);
  };

  const calculateLoanBalances = () => {
    return loans.reduce((sum, loan) => sum + (loan.principal_amount || 0), 0);
  };

  const activeLoans = loans.filter(loan => {
    const closedStatuses = ['closed', 'fully_paid', 'written_off', 'rejected'];
    return !closedStatuses.includes(loan.status?.toLowerCase());
  });

  const activeSavings = savings.filter(account => {
    const closedStatuses = ['closed', 'inactive', 'dormant'];
    return !closedStatuses.includes(account.status?.toLowerCase());
  });

  // Unified loans count (dedupe applications vs. approved/pending_disbursement loans)
  const rejectedClosedStatuses = ['rejected', 'closed'];
  const visibleLoans = showClosedLoans
    ? loans.filter(l => rejectedClosedStatuses.includes(l.status?.toLowerCase()))
    : loans.filter(l => !rejectedClosedStatuses.includes(l.status?.toLowerCase()));
  const visibleApplications = showClosedLoans
    ? loanApplications.filter(a => rejectedClosedStatuses.includes(a.status?.toLowerCase()))
    : loanApplications.filter(a => !rejectedClosedStatuses.includes(a.status?.toLowerCase()));
  const applicationIds = new Set(visibleApplications.map(a => a.id));
  const dedupedLoans = visibleLoans.filter((loan) => {
    const status = (loan.status || '').toLowerCase();
    if (['approved', 'pending_disbursement'].includes(status) && loan.application_id && applicationIds.has(loan.application_id)) {
      return false;
    }
    return true;
  });
  const loansDisplayCount = visibleApplications.length + dedupedLoans.length;


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
          <ClientHeader 
            client={client}
            loanBalance={calculateLoanBalances()}
            savingsBalance={calculateSavingsBalance()}
            officeName={officeName}
            loanOfficerName={loanOfficerName}
            trp={clientTRP ?? undefined}
          />

          {/* Action Menu Bar */}
          <div className="px-8 py-4 border-t bg-muted/20">
            <div className="flex items-center gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={() => setShowEditClientModal(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Client
               </Button>
               <Button variant="outline" size="sm" onClick={() => setShowIdentitiesModal(true)}>
                 <IdCard className="h-4 w-4 mr-2" />
                 Identifiers
               </Button>
               <Button variant="outline" size="sm" onClick={() => setShowDocumentsModal(true)}>
                 <FileText className="h-4 w-4 mr-2" />
                 Documents
               </Button>
               <Button variant="outline" size="sm" onClick={() => setShowBankDetailsModal(true)}>
                 <Building className="h-4 w-4 mr-2" />
                 Bank Details
               </Button>
               <Button variant="outline" size="sm" onClick={() => setShowEmploymentModal(true)}>
                 <Building2 className="h-4 w-4 mr-2" />
                 Employment
               </Button>
               <Button variant="outline" size="sm" onClick={() => setShowBusinessModal(true)}>
                 <Building2 className="h-4 w-4 mr-2" />
                 Business
               </Button>
               <Button variant="outline" size="sm" onClick={() => setShowTransferModal(true)}>
                 <ArrowRightLeft className="h-4 w-4 mr-2" />
                 Transfer
               </Button>
               <Button variant="outline" size="sm" onClick={() => setShowLoanOfficerModal(true)}>
                 <Users className="h-4 w-4 mr-2" />
                 Loan Officer
               </Button>
               <Button variant="outline" size="sm" onClick={() => setShowGroupsModal(true)}>
                 <Users className="h-4 w-4 mr-2" />
                 Groups
               </Button>
               <Button variant="outline" size="sm" onClick={() => setShowNextOfKinModal(true)}>
                 <Phone className="h-4 w-4 mr-2" />
                 Next of Kin
               </Button>
               <Button variant="outline" size="sm" onClick={() => setShowCloseClientModal(true)}>
                 <UserMinus className="h-4 w-4 mr-2" />
                 Close Client
               </Button>
            </div>
          </div>
        </div>

        {/* Client Details Tab Section */}
        <div className="bg-white rounded-xl border border-border/50 shadow-sm overflow-hidden">
          <div className="p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="h-auto p-0 bg-transparent w-full justify-start">
                <div className="flex overflow-x-auto scrollbar-hide gap-1">
                  <TabsTrigger value="general" className="whitespace-nowrap px-4 py-3 text-sm font-medium text-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg border border-transparent data-[state=active]:border-primary transition-all">
                    <Info className="h-4 w-4 mr-2" />
                    General
                  </TabsTrigger>
                  <TabsTrigger value="loans" className="whitespace-nowrap px-4 py-3 text-sm font-medium text-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg border border-transparent data-[state=active]:border-primary transition-all">
                    <CreditCard className="h-4 w-4 mr-2" />
                    Loans ({loansDisplayCount})
                  </TabsTrigger>
                  <TabsTrigger value="savings" className="whitespace-nowrap px-4 py-3 text-sm font-medium text-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg border border-transparent data-[state=active]:border-primary transition-all">
                    <PiggyBank className="h-4 w-4 mr-2" />
                    Savings ({activeSavings.length})
                  </TabsTrigger>
                  <TabsTrigger value="notes" className="whitespace-nowrap px-4 py-3 text-sm font-medium text-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg border border-transparent data-[state=active]:border-primary transition-all">
                    <StickyNote className="h-4 w-4 mr-2" />
                    Notes
                  </TabsTrigger>
                </div>
              </TabsList>
              
              {/* Tab Content */}
              <div className="mt-6">
                <TabsContent value="general" className="mt-0">
                  <ClientGeneralTab client={client} />
                </TabsContent>
                <TabsContent value="loans" className="mt-0">
                  <ClientLoansTab
                    loans={loans}
                    loanApplications={loanApplications}
                    showClosedLoans={showClosedLoans}
                    onToggleClosedLoans={() => setShowClosedLoans(!showClosedLoans)}
                    onNewLoan={() => setShowNewLoan(true)}
                    onViewLoanDetails={(loan) => {
                      if (loan?.type === 'loan') {
                        setSelectedLoanForDetails(loan);
                        setShowLoanDetailsModal(true);
                      } else {
                        setSelectedLoanForWorkflow(loan);
                        setShowLoanWorkflowModal(true);
                      }
                    }}
                    onProcessDisbursement={(loan) => {
                      setSelectedAccount(loan);
                      setShowDisbursementModal(true);
                    }}
                    onLoanWorkflow={(loan) => {
                      setSelectedLoanForWorkflow(loan);
                      setShowLoanWorkflowModal(true);
                    }}
                  />
                </TabsContent>
                <TabsContent value="next-of-kin" className="mt-0">
                  <ClientNextOfKinTab client={client} onEdit={() => setShowNextOfKinModal(true)} />
                </TabsContent>
                <TabsContent value="savings" className="mt-0">
                  <ClientSavingsTab 
                    savings={savings}
                    formatCurrency={formatCurrency}
                    showClosedAccounts={showClosedSavings}
                    onToggleClosedAccounts={() => setShowClosedSavings(!showClosedSavings)}
                    onNewSavingsAccount={() => setShowAddSavingsAccount(true)}
                    onViewAccountDetails={(account) => {
                      setSelectedSavingsAccount(account);
                      setShowSavingsAccountDetails(true);
                    }}
                  />
                </TabsContent>
                <TabsContent value="employment" className="mt-0">
                  <ClientEmploymentTab client={client} onEdit={() => setShowEmploymentModal(true)} />
                </TabsContent>
                <TabsContent value="business" className="mt-0">
                  <ClientBusinessTab client={client} onEdit={() => setShowBusinessModal(true)} />
                </TabsContent>
                <TabsContent value="transfer" className="mt-0">
                  <ClientTransferTab client={client} />
                </TabsContent>
                <TabsContent value="loan-officer" className="mt-0">
                  <ClientLoanOfficerTab client={client} />
                </TabsContent>
                <TabsContent value="groups" className="mt-0">
                  <ClientGroupsTab client={client} />
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
        onApplicationCreated={(application) => {
          setShowNewLoan(false);
          setSelectedLoanForWorkflow(application);
          setShowLoanWorkflowModal(true);
          fetchClientData();
        }}
      />
      <NewSavingsDialog
        open={showNewSavings}
        onOpenChange={setShowNewSavings}
        clientId={client.id}
      />
      <AddSavingsAccountDialog
        open={showAddSavingsAccount}
        onOpenChange={setShowAddSavingsAccount}
        clientId={client.id}
        clientName={`${client.first_name} ${client.last_name}`}
        onSuccess={fetchClientData}
      />
      {selectedSavingsAccount && (
        <SavingsAccountDetailsDialog
          open={showSavingsAccountDetails}
          onOpenChange={setShowSavingsAccountDetails}
          account={selectedSavingsAccount}
        />
      )}
      {selectedLoanForWorkflow && (
        <EnhancedLoanWorkflowDialog
          open={showLoanWorkflowModal}
          onOpenChange={setShowLoanWorkflowModal}
          loanApplication={selectedLoanForWorkflow}
          onSuccess={fetchClientData}
        />
      )}
      {selectedLoanForDetails && (
        <LoanDetailsDialog
          loan={selectedLoanForDetails}
          clientName={`${client.first_name} ${client.last_name}`}
          open={showLoanDetailsModal}
          onOpenChange={(open) => {
            setShowLoanDetailsModal(open);
            if (!open) setSelectedLoanForDetails(null);
          }}
        />
      )}
      {selectedAccount && (
        <LoanDisbursementDialog
          open={showDisbursementModal}
          onOpenChange={setShowDisbursementModal}
          loanData={selectedAccount}
          onSuccess={() => {
            fetchClientData();
            toast({
              title: "Success",
            description: "Loan disbursement completed successfully",
          });
        }}
      />
      )}

      {/* Modal Dialogs for all tabs */}
      <Dialog open={showEditClientModal} onOpenChange={setShowEditClientModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Client</DialogTitle>
          </DialogHeader>
          <EditClientForm 
            client={client} 
            onSuccess={() => {
              setShowEditClientModal(false);
              fetchClientData();
            }}
            onCancel={() => setShowEditClientModal(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showIdentitiesModal} onOpenChange={setShowIdentitiesModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Client Identifiers</DialogTitle>
          </DialogHeader>
          <ClientIdentifiersTab clientId={client.id} />
        </DialogContent>
      </Dialog>

      <Dialog open={showDocumentsModal} onOpenChange={setShowDocumentsModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Client Documents</DialogTitle>
          </DialogHeader>
          <ClientDocumentsTab clientId={client.id} />
        </DialogContent>
      </Dialog>

      <EditBankDetailsDialog
        client={client}
        open={showBankDetailsModal}
        onOpenChange={setShowBankDetailsModal}
        onSuccess={fetchClientData}
      />

      <EditEmploymentDialog
        client={client}
        open={showEmploymentModal}
        onOpenChange={setShowEmploymentModal}
        onSuccess={fetchClientData}
      />

      <EditBusinessDialog
        client={client}
        open={showBusinessModal}
        onOpenChange={setShowBusinessModal}
        onSuccess={fetchClientData}
      />

      <Dialog open={showTransferModal} onOpenChange={setShowTransferModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Client Transfer</DialogTitle>
          </DialogHeader>
          <ClientTransferTab client={client} />
        </DialogContent>
      </Dialog>

      <Dialog open={showLoanOfficerModal} onOpenChange={setShowLoanOfficerModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Loan Officer</DialogTitle>
          </DialogHeader>
          <ClientLoanOfficerTab client={client} />
        </DialogContent>
      </Dialog>

      <Dialog open={showGroupsModal} onOpenChange={setShowGroupsModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Client Groups</DialogTitle>
          </DialogHeader>
          <ClientGroupsTab client={client} />
        </DialogContent>
      </Dialog>

      <EditNextOfKinDialog
        client={client}
        open={showNextOfKinModal}
        onOpenChange={setShowNextOfKinModal}
        onSuccess={fetchClientData}
      />

      <Dialog open={showCloseClientModal} onOpenChange={setShowCloseClientModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Close Client</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>Are you sure you want to close this client account? This action will deactivate the client and prevent further transactions.</p>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowCloseClientModal(false)}>
                Cancel
              </Button>
              <Button variant="destructive">
                Close Client
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClientDetailsPageRefactored;