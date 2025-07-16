import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  User, 
  Users,
  Phone, 
  Mail, 
  MapPin, 
  Calendar as CalendarIcon, 
  CreditCard, 
  PiggyBank,
  Building,
  FileText,
  Edit,
  Wallet,
  Camera,
  Upload,
  Download,
  XCircle,
  CheckCircle,
  Clock,
  Plus,
  Minus,
  ArrowRightLeft,
  UserMinus,
  Receipt,
  ScrollText,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  Eye
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { AddSavingsAccountDialog } from "./AddSavingsAccountDialog";
import { SimpleLoanApplicationDialog } from "./SimpleLoanApplicationDialog";
import { TransferClientDialog } from "./TransferClientDialog";
import { UpdateLoanOfficerDialog } from "./UpdateLoanOfficerDialog";
import { LoanDetailsDialog } from "@/components/loan/LoanDetailsDialog";
import { SavingsDetailsDialog } from "@/components/savings/SavingsDetailsDialog";
import { SavingsTransactionForm } from "@/components/forms/SavingsTransactionForm";
import { TransactionHistoryDialog } from "@/components/statements/TransactionHistoryDialog";
import { LoanWorkflowDialog } from "@/components/loan/LoanWorkflowDialog";
import { FullLoanApplicationDialog } from "./FullLoanApplicationDialog";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  loans?: Array<{
    outstanding_balance: number;
    status: string;
  }>;
  savings_accounts?: Array<{
    account_balance: number;
  }>;
}

interface ClientDetailsDialogProps {
  client: Client | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ClientDetailsDialog = ({ client, open, onOpenChange }: ClientDetailsDialogProps) => {
  const [showAddSavingsDialog, setShowAddSavingsDialog] = useState(false);
  const [showAddLoanDialog, setShowAddLoanDialog] = useState(false);
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [showUpdateOfficerDialog, setShowUpdateOfficerDialog] = useState(false);
  const [showCloseClientDialog, setShowCloseClientDialog] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<any>(null);
  const [selectedSavings, setSelectedSavings] = useState<any>(null);
  const [showLoanDetails, setShowLoanDetails] = useState(false);
  const [showSavingsDetails, setShowSavingsDetails] = useState(false);
  const [activeLoanProducts, setActiveLoanProducts] = useState<any[]>([]);
  const [activeSavingsProducts, setActiveSavingsProducts] = useState<any[]>([]);
  const [clientLoans, setClientLoans] = useState<any[]>([]);
  const [clientSavings, setClientSavings] = useState<any[]>([]);
  const [clientLoanApplications, setClientLoanApplications] = useState<any[]>([]);
  const [showSavingsTransactionDialog, setShowSavingsTransactionDialog] = useState(false);
  const [showTransactionHistoryDialog, setShowTransactionHistoryDialog] = useState(false);
  const [showLoanWorkflowDialog, setShowLoanWorkflowDialog] = useState(false);
  const [transactionType, setTransactionType] = useState<'deposit' | 'withdrawal' | 'transfer' | 'fee_charge'>('deposit');
  
  // New state for loan/application actions
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showLoanChargeDialog, setShowLoanChargeDialog] = useState(false);
  const [showModifyDialog, setShowModifyDialog] = useState(false);
  const [showApplicationDetailsDialog, setShowApplicationDetailsDialog] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<any>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showDisburseDialog, setShowDisburseDialog] = useState(false);
  const [showDisburseToSavingsDialog, setShowDisburseToSavingsDialog] = useState(false);
  const [showUndoApprovalDialog, setShowUndoApprovalDialog] = useState(false);
  const [hideClosedLoans, setHideClosedLoans] = useState(false);
  
  // Rejection form state
  const [rejectionDate, setRejectionDate] = useState<Date | undefined>(new Date());
  const [rejectionReason, setRejectionReason] = useState("");
  
  const { toast } = useToast();
  
  // Fetch active products and client accounts when dialog opens
  useEffect(() => {
    if (open && client) {
      fetchActiveProducts();
      fetchClientAccounts();
      fetchClientLoanApplications();
    }
  }, [open, client]);

  const fetchActiveProducts = async () => {
    try {
      // Fetch active loan products
      const { data: loanProducts } = await supabase
        .from('loan_products')
        .select('*')
        .eq('is_active', true);

      // Fetch active savings products
      const { data: savingsProducts } = await supabase
        .from('savings_products')
        .select('*')
        .eq('is_active', true);

      setActiveLoanProducts(loanProducts || []);
      setActiveSavingsProducts(savingsProducts || []);
    } catch (error) {
      console.error('Error fetching active products:', error);
      toast({
        title: "Error",
        description: "Failed to load active products",
        variant: "destructive",
      });
    }
  };

  const fetchClientAccounts = async () => {
    console.log('Fetching client accounts for client:', client?.id);
    console.log('Client details:', client);
    
    // Check current user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
      .single();
    
    console.log('Current user profile:', profile, 'Profile Error:', profileError);
    
    try {
      // Fetch client loans with product info
      const { data: loans, error: loansError } = await supabase
        .from('loans')
        .select(`
          *,
          loan_products(name, currency_code)
        `)
        .eq('client_id', client.id)
        .order('created_at', { ascending: false });

      if (loansError) {
        console.error('Error fetching loans:', loansError);
        console.error('Loans error details:', JSON.stringify(loansError, null, 2));
      } else {
        console.log('Fetched loans:', loans);
        console.log('Loans query executed successfully, count:', loans?.length || 0);
      }

      // Fetch client savings accounts with product info
      const { data: savings, error: savingsError } = await supabase
        .from('savings_accounts')
        .select(`
          *,
          savings_products(name, currency_code, nominal_annual_interest_rate)
        `)
        .eq('client_id', client.id)
        .order('created_at', { ascending: false });

      if (savingsError) {
        console.error('Error fetching savings:', savingsError);
      } else {
        console.log('Fetched savings:', savings);
      }

      setClientLoans(loans || []);
      setClientSavings(savings || []);
    } catch (error) {
      console.error('Error fetching client accounts:', error);
      toast({
        title: "Error",
        description: "Failed to load client accounts",
        variant: "destructive",
      });
    }
  };

  const fetchClientLoanApplications = async () => {
    try {
      const { data, error } = await supabase
        .from('loan_applications')
        .select(`
          *,
          loan_products(
            id,
            name, 
            short_name, 
            min_nominal_interest_rate, 
            max_nominal_interest_rate,
            currency_code,
            default_nominal_interest_rate,
            default_term,
            min_principal,
            max_principal,
            default_principal,
            description
          ),
          funds(
            id,
            fund_name,
            fund_code,
            current_balance
          )
        `)
        .eq('client_id', client.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching loan applications:', error);
      } else {
        console.log('Fetched loan applications:', data);
        setClientLoanApplications(data || []);
      }
    } catch (error) {
      console.error('Error fetching client loan applications:', error);
    }
  };
  const handleSavingsCreated = () => {
    fetchClientAccounts(); // Refresh the client accounts data
    toast({
      title: "Success",
      description: "Savings account created successfully",
    });
  };

  const handleLoanCreated = () => {
    fetchClientAccounts(); // Refresh the client accounts data
    fetchClientLoanApplications(); // Also refresh loan applications
    console.log('Loan created, refreshing client accounts');
    toast({
      title: "Success", 
      description: "Loan application submitted successfully",
    });
  };

  const handleLoanWorkflowCompleted = () => {
    fetchClientAccounts(); // Refresh after loan workflow completion
    fetchClientLoanApplications(); // Also refresh loan applications
    console.log('Loan workflow completed, refreshing client accounts');
    toast({
      title: "Success",
      description: "Loan workflow completed successfully",
    });
  };
  
  if (!client) return null;

  const formatCurrency = (amount: number | null) => {
    if (!amount) return "KES 0";
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
    }).format(amount);
  };

  const calculateTotalLoanBalance = () => {
    if (!client.loans || client.loans.length === 0) return 0;
    return client.loans.reduce((total, loan) => total + (loan.outstanding_balance || 0), 0);
  };

  const calculateTotalSavingsBalance = () => {
    if (!client.savings_accounts || client.savings_accounts.length === 0) return 0;
    return client.savings_accounts.reduce((total, account) => total + (account.account_balance || 0), 0);
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'approved':
      case 'completed':
      case 'disbursed':
        return 'default';
      case 'pending':
      case 'pending_approval':
      case 'pending_disbursement':
      case 'under_review':
        return 'secondary';
      case 'overdue':
      case 'written_off':
      case 'rejected':
        return 'destructive';
      case 'inactive':
      case 'suspended':
      case 'closed':
      case 'fully_paid':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getLoanStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600 bg-yellow-50"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'under_review':
        return <Badge variant="outline" className="text-blue-600 border-blue-600 bg-blue-50"><Eye className="w-3 h-3 mr-1" />Under Review</Badge>;
      case 'approved':
        return <Badge variant="default" className="bg-green-600 hover:bg-green-700"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'active':
        return <Badge variant="default" className="bg-blue-600 hover:bg-blue-700"><TrendingUp className="w-3 h-3 mr-1" />Active</Badge>;
      case 'disbursed':
        return <Badge variant="default" className="bg-blue-600 hover:bg-blue-700"><DollarSign className="w-3 h-3 mr-1" />Disbursed</Badge>;
      case 'pending_disbursement':
        return <Badge variant="outline" className="text-purple-600 border-purple-600 bg-purple-50"><Clock className="w-3 h-3 mr-1" />Pending Disbursement</Badge>;
      case 'overdue':
        return <Badge variant="destructive" className="bg-red-600 hover:bg-red-700"><AlertTriangle className="w-3 h-3 mr-1" />Overdue</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      case 'withdrawn':
        return <Badge variant="outline" className="text-gray-600 border-gray-600 bg-gray-50"><XCircle className="w-3 h-3 mr-1" />Withdrawn</Badge>;
      case 'closed':
        return <Badge variant="secondary" className="bg-gray-100 text-gray-800"><CheckCircle className="w-3 h-3 mr-1" />Closed</Badge>;
      case 'fully_paid':
        return <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200"><CheckCircle className="w-3 h-3 mr-1" />Fully Paid</Badge>;
      case 'written_off':
        return <Badge variant="destructive" className="bg-red-600 hover:bg-red-700"><AlertTriangle className="w-3 h-3 mr-1" />Written Off</Badge>;
      default:
        return <Badge variant="outline" className="capitalize">{status}</Badge>;
    }
  };

  // Combine loans and applications into one list
  const combinedLoansAndApplications = [
    ...clientLoans.map(loan => ({
      ...loan,
      type: 'loan',
      display_name: loan.loan_products?.name || 'Unknown Product',
      identifier: loan.loan_number,
      amount: loan.principal_amount,
      outstanding: loan.outstanding_balance,
      date: loan.disbursement_date || loan.created_at,
      date_label: loan.disbursement_date ? 'Disbursed' : 'Created'
    })),
    ...clientLoanApplications.map(app => ({
      ...app,
      type: 'application',
      display_name: app.loan_products?.name || 'Unknown Product',
      identifier: app.application_number,
      amount: app.requested_amount,
      outstanding: null,
      date: app.created_at,
      date_label: 'Applied'
    }))
  ].filter(item => {
    // Filter out closed/rejected loans and applications if hideClosedLoans is true
    if (hideClosedLoans) {
      const closedStatuses = ['rejected', 'closed', 'fully_paid', 'written_off', 'withdrawn'];
      return !closedStatuses.includes(item.status?.toLowerCase());
    }
    return true;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Mock data for loans and savings
  const mockLoans = [
    { 
      id: "L001", 
      type: "Personal Loan", 
      amount: 150000, 
      outstanding: 75000, 
      status: "active",
      nextPayment: "2024-02-15",
      monthlyPayment: 12500,
      interestRate: 12.5,
      term: 12,
      disbursedDate: "2023-08-15"
    },
    { 
      id: "L002", 
      type: "Business Loan", 
      amount: 300000, 
      outstanding: 250000, 
      status: "pending",
      requestedDate: "2024-01-10",
      monthlyPayment: 25000,
      interestRate: 15.0,
      term: 18,
      purpose: "Business expansion"
    },
    { 
      id: "L003", 
      type: "Emergency Loan", 
      amount: 50000, 
      outstanding: 0, 
      status: "closed",
      disbursedDate: "2023-03-01",
      closedDate: "2023-12-01",
      monthlyPayment: 5000,
      interestRate: 18.0,
      term: 10
    }
  ];

  const mockSavings = [
    { 
      id: "S001", 
      type: "Regular Savings", 
      balance: 45000, 
      interestRate: 3.5,
      status: "active",
      lastTransaction: "2024-01-28",
      monthlyContribution: 5000,
      openedDate: "2022-06-15"
    },
    { 
      id: "S002", 
      type: "Fixed Deposit", 
      balance: 80000, 
      interestRate: 8.0,
      status: "pending",
      maturityDate: "2024-12-31",
      monthlyContribution: 0,
      requestedDate: "2024-01-15",
      term: 12
    },
    { 
      id: "S003", 
      type: "Emergency Fund", 
      balance: 15000, 
      interestRate: 2.0,
      status: "closed",
      openedDate: "2021-01-10",
      closedDate: "2023-06-30",
      finalBalance: 15000
    }
  ];

  const handleLoanAction = (action: string, loanId: string) => {
    toast({
      title: `Loan ${action}`,
      description: `${action} action completed for loan ${loanId}`,
    });
  };

  const handleSavingsAction = async (action: string, savingsId: string) => {
    try {
      if (action === 'Activate') {
        const { error } = await supabase
          .from('savings_accounts')
          .update({ is_active: true })
          .eq('id', savingsId);

        if (error) throw error;

        // Refresh the client accounts data
        fetchClientAccounts();
        
        toast({
          title: "Success",
          description: "Savings account activated successfully",
        });
      } else {
        toast({
          title: `Savings ${action}`,
          description: `${action} action completed for savings ${savingsId}`,
        });
      }
    } catch (error) {
      console.error('Error performing savings action:', error);
      toast({
        title: "Error",
        description: `Failed to ${action.toLowerCase()} savings account`,
        variant: "destructive",
      });
    }
  };

  // New handlers for loan/application actions
  const handleApproveApplication = async (application: any) => {
    try {
      const { error } = await supabase
        .from('loan_applications')
        .update({ 
          status: 'pending_disbursement',
          approved_at: new Date().toISOString()
        })
        .eq('id', application.id);

      if (error) throw error;

      fetchClientLoanApplications();
      setShowApproveDialog(false);
      toast({
        title: "Application Approved",
        description: `Loan application ${application.application_number} has been approved and is now pending disbursement.`,
      });
    } catch (error) {
      console.error('Error approving application:', error);
      toast({
        title: "Error",
        description: "Failed to approve the application. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRejectApplication = async (application: any) => {
    if (!rejectionReason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for rejection.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Get the current user's profile ID
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      const { error } = await supabase
        .from('loan_applications')
        .update({ 
          status: 'rejected',
          reviewed_at: rejectionDate?.toISOString() || new Date().toISOString(),
          reviewed_by: profile?.id || null,
          approval_notes: rejectionReason
        })
        .eq('id', application.id);

      if (error) throw error;

      fetchClientLoanApplications();
      setShowRejectDialog(false);
      // Reset form
      setRejectionDate(new Date());
      setRejectionReason("");
      toast({
        title: "Application Rejected",
        description: `Loan application ${application.application_number} has been rejected.`,
      });
    } catch (error) {
      console.error('Error rejecting application:', error);
      toast({
        title: "Error",
        description: "Failed to reject the application. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDisburseApplication = async (application: any) => {
    try {
      const { error } = await supabase
        .from('loan_applications')
        .update({ 
          status: 'disbursed',
          disbursed_at: new Date().toISOString()
        })
        .eq('id', application.id);

      if (error) throw error;

      fetchClientLoanApplications();
      setShowDisburseDialog(false);
      toast({
        title: "Loan Disbursed",
        description: `Loan application ${application.application_number} has been disbursed successfully.`,
      });
    } catch (error) {
      console.error('Error disbursing loan:', error);
      toast({
        title: "Error",
        description: "Failed to disburse the loan. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDisburseToSavings = async (application: any) => {
    try {
      const { error } = await supabase
        .from('loan_applications')
        .update({ 
          status: 'disbursed',
          disbursed_at: new Date().toISOString(),
          disbursement_method: 'savings'
        })
        .eq('id', application.id);

      if (error) throw error;

      fetchClientLoanApplications();
      setShowDisburseToSavingsDialog(false);
      toast({
        title: "Loan Disbursed to Savings",
        description: `Loan application ${application.application_number} has been disbursed to savings account.`,
      });
    } catch (error) {
      console.error('Error disbursing loan to savings:', error);
      toast({
        title: "Error",
        description: "Failed to disburse the loan to savings. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleUndoApproval = async (application: any) => {
    try {
      const { error } = await supabase
        .from('loan_applications')
        .update({ 
          status: 'pending',
          approved_at: null
        })
        .eq('id', application.id);

      if (error) throw error;

      fetchClientLoanApplications();
      setShowUndoApprovalDialog(false);
      toast({
        title: "Approval Undone",
        description: `Loan application ${application.application_number} has been moved back to pending approval.`,
      });
    } catch (error) {
      console.error('Error undoing approval:', error);
      toast({
        title: "Error",
        description: "Failed to undo approval. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleViewApplication = (application: any) => {
    setSelectedApplication(application);
    setShowApplicationDetailsDialog(true);
  };

  const handleAddLoanCharge = (item: any) => {
    setSelectedItem(item);
    setShowLoanChargeDialog(true);
  };

  const handleModifyApplication = (application: any) => {
    setSelectedApplication(application);
    setShowModifyDialog(true);
  };

  // Filter mock data to only show products that are active
  const filteredLoans = mockLoans.filter(loan => 
    activeLoanProducts.some(product => 
      product.name.toLowerCase().includes(loan.type.toLowerCase().split(' ')[0]) || 
      product.short_name.toLowerCase().includes(loan.type.toLowerCase().split(' ')[0])
    )
  );

  const filteredSavings = mockSavings.filter(savings => 
    activeSavingsProducts.some(product => 
      product.name.toLowerCase().includes(savings.type.toLowerCase().split(' ')[0]) || 
      product.short_name.toLowerCase().includes(savings.type.toLowerCase().split(' ')[0])
    )
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header with Avatar and Basic Info */}
        <div className="flex items-start gap-6 p-6 border-b bg-gradient-to-r from-primary/5 to-primary/10">
          <div className="relative">
            <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
              <AvatarImage src={client.profile_picture_url || ""} />
              <AvatarFallback className="text-xl bg-primary/10">
                {client.first_name[0]}{client.last_name[0]}
              </AvatarFallback>
            </Avatar>
            <Button
              size="sm"
              variant="outline"
              className="absolute -bottom-2 -right-2 h-8 w-8 p-0 rounded-full"
            >
              <Camera className="h-3 w-3" />
            </Button>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold truncate">{client.first_name} {client.last_name}</h2>
              <Badge variant={client.is_active ? "default" : "secondary"} className="shrink-0">
                {client.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>
            
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
              <span className="flex items-center gap-1">
                <User className="h-4 w-4" />
                {client.client_number}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Member since {format(new Date(client.created_at), 'MMM dd, yyyy')}
              </span>
              {client.email && (
                <span className="flex items-center gap-1">
                  <Mail className="h-4 w-4" />
                  {client.email}
                </span>
              )}
              {client.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="h-4 w-4" />
                  {client.phone}
                </span>
              )}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-xl font-bold text-orange-600">{formatCurrency(calculateTotalLoanBalance())}</div>
                <div className="text-xs text-muted-foreground">Outstanding Loans</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-green-600">{formatCurrency(calculateTotalSavingsBalance())}</div>
                <div className="text-xs text-muted-foreground">Total Savings</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-blue-600">
                  {client.timely_repayment_rate !== null ? `${client.timely_repayment_rate}%` : 'N/A'}
                </div>
                <div className="text-xs text-muted-foreground">Repayment Rate</div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2 shrink-0">
            <Button size="sm" variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowTransferDialog(true)}>
              <ArrowRightLeft className="h-4 w-4 mr-2" />
              Transfer
            </Button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          <Tabs defaultValue="accounts" className="h-full">
            <TabsList className="w-full justify-start px-6 py-2 bg-muted/50">
              <TabsTrigger value="accounts">Accounts</TabsTrigger>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="profile">Full Profile</TabsTrigger>
            </TabsList>

            {/* Accounts Tab */}
            <TabsContent value="accounts" className="p-6 space-y-6">
              {/* Loans & Applications Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Loans & Applications ({combinedLoansAndApplications.length})
                  </h3>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setHideClosedLoans(!hideClosedLoans)}
                    >
                      {hideClosedLoans ? 'Show All' : 'Hide Closed'}
                    </Button>
                    <Button size="sm" onClick={() => setShowLoanWorkflowDialog(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      New Application
                    </Button>
                  </div>
                </div>
                
                <div className="border rounded-lg">
                  {combinedLoansAndApplications.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                      <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No loans or applications yet</p>
                      <p className="text-sm">Create a loan application to get started</p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {combinedLoansAndApplications.map((item) => (
                        <div key={`${item.type}-${item.id}`} className="p-4 hover:bg-muted/50 transition-colors">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div>
                                <h4 className="font-medium">{item.display_name}</h4>
                                <p className="text-sm text-muted-foreground font-mono">{item.identifier}</p>
                                <p className="text-xs text-muted-foreground">
                                  {item.date_label}: {format(new Date(item.date), 'MMM dd, yyyy')}
                                </p>
                                {item.type === 'application' && item.purpose && (
                                  <p className="text-xs text-muted-foreground capitalize">
                                    {item.purpose.replace(/_/g, ' ')}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <div className="text-sm font-medium">{formatCurrency(item.amount)}</div>
                                {item.type === 'loan' && item.outstanding !== null && (
                                  <div className="text-xs text-muted-foreground">
                                    Outstanding: {formatCurrency(item.outstanding)}
                                  </div>
                                )}
                                {item.type === 'application' && item.requested_term && (
                                  <div className="text-xs text-muted-foreground">
                                    Term: {item.requested_term} months
                                  </div>
                                )}
                              </div>
                              {getLoanStatusBadge(item.status)}
                            </div>
                          </div>

                           <div className="flex gap-2 mt-3">
                             <Button
                               variant="outline"
                               size="sm"
                               onClick={() => {
                                 if (item.type === 'loan') {
                                   setSelectedLoan(item);
                                   setShowLoanDetails(true);
                                 } else {
                                   handleViewApplication(item);
                                 }
                               }}
                             >
                               <Eye className="h-4 w-4 mr-2" />
                               View
                             </Button>
                             
                             {item.type === 'loan' && (
                               <Button
                                 variant="outline"
                                 size="sm"
                                 onClick={() => handleAddLoanCharge(item)}
                               >
                                 <Receipt className="h-4 w-4 mr-2" />
                                 Add Charge
                               </Button>
                             )}
                             
                             {item.type === 'loan' && (item.status === 'pending_disbursement' || item.status === 'approved') && (
                               <Button
                                 size="sm"
                                 onClick={() => {
                                   setSelectedLoan(item);
                                   setShowLoanWorkflowDialog(true);
                                 }}
                               >
                                 <Wallet className="h-4 w-4 mr-2" />
                                 Disburse
                               </Button>
                             )}
                             
                             {item.type === 'application' && (
                               <Button
                                 variant="outline"
                                 size="sm"
                                 onClick={() => handleModifyApplication(item)}
                               >
                                 <Edit className="h-4 w-4 mr-2" />
                                 Modify
                               </Button>
                             )}
                             
                              {item.type === 'application' && item.status === 'pending' && (
                                <>
                                  <Button
                                    size="sm"
                                    className="bg-green-600 hover:bg-green-700"
                                    onClick={() => {
                                      setSelectedApplication(item);
                                      setShowApproveDialog(true);
                                    }}
                                  >
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => {
                                      setSelectedApplication(item);
                                      setShowRejectDialog(true);
                                    }}
                                  >
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Reject
                                  </Button>
                                </>
                              )}
                              
                              {item.type === 'application' && item.status === 'pending_disbursement' && (
                                <>
                                  <Button
                                    size="sm"
                                    className="bg-blue-600 hover:bg-blue-700"
                                    onClick={() => {
                                      setSelectedApplication(item);
                                      setShowDisburseDialog(true);
                                    }}
                                  >
                                    <Wallet className="h-4 w-4 mr-2" />
                                    Disburse
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setSelectedApplication(item);
                                      setShowDisburseToSavingsDialog(true);
                                    }}
                                  >
                                    <PiggyBank className="h-4 w-4 mr-2" />
                                    Disburse to Savings
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setSelectedApplication(item);
                                      setShowUndoApprovalDialog(true);
                                    }}
                                  >
                                    <ArrowRightLeft className="h-4 w-4 mr-2" />
                                    Undo Approval
                                  </Button>
                                </>
                              )}
                              
                              {item.type === 'application' && (item.status === 'rejected' || item.status === 'closed') && (
                                <span className="text-sm text-muted-foreground">No actions available</span>
                              )}
                           </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Savings Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <PiggyBank className="h-5 w-5" />
                    Savings Accounts ({clientSavings.length})
                  </h3>
                  <Button size="sm" onClick={() => setShowAddSavingsDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Savings
                  </Button>
                </div>
                
                <div className="border rounded-lg divide-y">
                  {clientSavings.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                      <PiggyBank className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No savings accounts yet</p>
                      <p className="text-sm">Create a savings account to get started</p>
                    </div>
                  ) : (
                    clientSavings.map((savings) => (
                      <div key={savings.id} className="p-4 hover:bg-muted/50 transition-colors">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div>
                              <h4 className="font-medium">{savings.savings_products?.name || 'Unknown Product'}</h4>
                              <p className="text-sm text-muted-foreground">{savings.account_number}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <div className="text-sm font-medium">{formatCurrency(savings.account_balance)}</div>
                              <div className="text-xs text-muted-foreground">
                                Interest: {savings.savings_products?.nominal_annual_interest_rate || 0}%
                              </div>
                            </div>
                            <Badge variant={savings.is_active ? "default" : "secondary"}>
                              {savings.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                        </div>

                        <div className="flex gap-2 mt-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedSavings(savings);
                              setShowSavingsDetails(true);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                          
                          {savings.is_active && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedSavings(savings);
                                  setTransactionType('deposit');
                                  setShowSavingsTransactionDialog(true);
                                }}
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Deposit
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedSavings(savings);
                                  setTransactionType('withdrawal');
                                  setShowSavingsTransactionDialog(true);
                                }}
                              >
                                <Minus className="h-4 w-4 mr-2" />
                                Withdraw
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedSavings(savings);
                                  setTransactionType('transfer');
                                  setShowSavingsTransactionDialog(true);
                                }}
                              >
                                <ArrowRightLeft className="h-4 w-4 mr-2" />
                                Transfer
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedSavings(savings);
                                  setTransactionType('fee_charge');
                                  setShowSavingsTransactionDialog(true);
                                }}
                              >
                                <Receipt className="h-4 w-4 mr-2" />
                                Charge
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedSavings(savings);
                                  setShowTransactionHistoryDialog(true);
                                }}
                                className="hover-scale"
                              >
                                <ScrollText className="h-4 w-4 mr-2" />
                                History
                              </Button>
                            </>
                          )}
                          
                          {!savings.is_active && (
                            <Button
                              size="sm"
                              onClick={() => handleSavingsAction('Activate', savings.id)}
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Activate
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Overview Tab */}
            <TabsContent value="overview" className="p-6 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Personal Details Card */}
                <Card className="lg:col-span-2">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Personal Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Full Name</span>
                        <div className="font-medium">{client.first_name} {client.last_name}</div>
                      </div>
                      {client.national_id && (
                        <div>
                          <span className="text-muted-foreground">National ID</span>
                          <div className="font-medium">{client.national_id}</div>
                        </div>
                      )}
                      {client.date_of_birth && (
                        <div>
                          <span className="text-muted-foreground">Date of Birth</span>
                          <div className="font-medium">{format(new Date(client.date_of_birth), 'MMM dd, yyyy')}</div>
                        </div>
                      )}
                      {client.gender && (
                        <div>
                          <span className="text-muted-foreground">Gender</span>
                          <div className="font-medium capitalize">{client.gender}</div>
                        </div>
                      )}
                      {client.occupation && (
                        <div>
                          <span className="text-muted-foreground">Occupation</span>
                          <div className="font-medium">{client.occupation}</div>
                        </div>
                      )}
                      {client.monthly_income && (
                        <div>
                          <span className="text-muted-foreground">Monthly Income</span>
                          <div className="font-medium">{formatCurrency(client.monthly_income)}</div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Status Card */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Account Status</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Account Status</span>
                        <Badge variant={client.is_active ? "default" : "secondary"}>
                          {client.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      {client.approval_status && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Approval</span>
                          <Badge variant={getStatusColor(client.approval_status)}>
                            {client.approval_status}
                          </Badge>
                        </div>
                      )}
                      {client.kyc_status && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">KYC Status</span>
                          <Badge variant={getStatusColor(client.kyc_status)}>
                            {client.kyc_status}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Documents Tab */}
            <TabsContent value="documents" className="p-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Client Documents
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No documents uploaded yet</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Profile Tab */}
            <TabsContent value="profile" className="p-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Complete Profile
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Full profile view coming soon</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <Separator />

        <div className="flex justify-between p-6">
          <Button 
            variant="destructive" 
            onClick={() => setShowCloseClientDialog(true)}
            disabled={!client.is_active}
          >
            <UserMinus className="h-4 w-4 mr-2" />
            Close Client
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button>
              <Edit className="h-4 w-4 mr-2" />
              Edit Client
            </Button>
          </div>
        </div>

        {/* Dialogs */}
        <AddSavingsAccountDialog
          clientId={client.id}
          clientName={`${client.first_name} ${client.last_name}`}
          open={showAddSavingsDialog}
          onOpenChange={setShowAddSavingsDialog}
          onSuccess={handleSavingsCreated}
        />

        <SimpleLoanApplicationDialog
          clientId={client.id}
          clientName={`${client.first_name} ${client.last_name}`}
          open={showAddLoanDialog}
          onOpenChange={setShowAddLoanDialog}
          onSuccess={handleLoanCreated}
        />

        <TransferClientDialog
          clientId={client.id}
          clientName={`${client.first_name} ${client.last_name}`}
          currentBranch="Main Branch"
          currentLoanOfficer="Jane Wanjiku"
          open={showTransferDialog}
          onOpenChange={setShowTransferDialog}
        />

        <UpdateLoanOfficerDialog
          clientId={client.id}
          clientName={`${client.first_name} ${client.last_name}`}
          currentLoanOfficer={{
            id: "jane",
            name: "Jane Wanjiku",
            title: "Senior Loan Officer",
            branch: "Main Branch"
          }}
          open={showUpdateOfficerDialog}
          onOpenChange={setShowUpdateOfficerDialog}
        />

        <AlertDialog open={showCloseClientDialog} onOpenChange={setShowCloseClientDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Close Client Account</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to close {client.first_name} {client.last_name}'s account? 
                This will deactivate their account and they will no longer be able to access services.
                This action can be reversed later if needed.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Close Client Account
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <LoanDetailsDialog
          loan={selectedLoan}
          clientName={`${client.first_name} ${client.last_name}`}
          open={showLoanDetails}
          onOpenChange={setShowLoanDetails}
        />

        <SavingsDetailsDialog
          savings={selectedSavings}
          clientName={`${client.first_name} ${client.last_name}`}
          open={showSavingsDetails}
          onOpenChange={setShowSavingsDetails}
        />

        {selectedSavings && (
          <SavingsTransactionForm
            savingsAccount={selectedSavings}
            transactionType={transactionType}
            open={showSavingsTransactionDialog}
            onOpenChange={setShowSavingsTransactionDialog}
            onSuccess={() => {
              fetchClientAccounts();
              setShowSavingsTransactionDialog(false);
            }}
          />
        )}

        {selectedSavings && (
          <TransactionHistoryDialog
            open={showTransactionHistoryDialog}
            onOpenChange={setShowTransactionHistoryDialog}
            savingsAccount={selectedSavings}
            clientName={`${client.first_name} ${client.last_name}`}
          />
        )}

        <FullLoanApplicationDialog
          open={showLoanWorkflowDialog}
          onOpenChange={setShowLoanWorkflowDialog}
          preSelectedClientId={client.id}
          onApplicationCreated={handleLoanWorkflowCompleted}
        />

        {/* New Dialogs */}
        {/* Approve Application Dialog */}
        <AlertDialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Approve Loan Application</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to approve loan application {selectedApplication?.application_number}?
                This action will move the application to approved status and make it eligible for disbursement.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                className="bg-green-600 text-white hover:bg-green-700"
                onClick={() => selectedApplication && handleApproveApplication(selectedApplication)}
              >
                Approve Application
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Reject Application Dialog */}
        <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
          <DialogContent className="max-w-md sm:max-w-lg overflow-hidden">
            <DialogHeader>
              <DialogTitle>Reject Loan Application</DialogTitle>
              <DialogDescription>
                Please provide a rejection date and reason for loan application {selectedApplication?.application_number}.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="rejection-date">Rejection Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !rejectionDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {rejectionDate ? format(rejectionDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent 
                    className="w-auto p-0 bg-popover border shadow-md rounded-md !z-[9999] relative" 
                    align="start" 
                    side="bottom" 
                    avoidCollisions 
                    sideOffset={4}
                    style={{ zIndex: 9999 }}
                  >
                    <Calendar
                      mode="single"
                      selected={rejectionDate}
                      onSelect={setRejectionDate}
                      initialFocus
                      className="rounded-md border-0"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label htmlFor="rejection-reason">Rejection Reason</Label>
                <Textarea
                  id="rejection-reason"
                  placeholder="Please provide a detailed reason for rejecting this application..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => selectedApplication && handleRejectApplication(selectedApplication)}
                disabled={!rejectionReason.trim()}
              >
                Reject Application
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Application Details Dialog */}
        <Dialog open={showApplicationDetailsDialog} onOpenChange={setShowApplicationDetailsDialog}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Loan Application Details</DialogTitle>
              <DialogDescription>
                Application #{selectedApplication?.application_number}
              </DialogDescription>
            </DialogHeader>
            {selectedApplication && (
              <div className="space-y-6">
                {/* Basic Application Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Application Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <span className="text-sm text-muted-foreground">Application Number</span>
                        <div className="font-medium font-mono">{selectedApplication.application_number}</div>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Status</span>
                        <div className="font-medium">{getLoanStatusBadge(selectedApplication.status)}</div>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Application Step</span>
                        <div className="font-medium">{selectedApplication.application_step || 'N/A'}</div>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Requires Approval</span>
                        <div className="font-medium">{selectedApplication.requires_approval ? 'Yes' : 'No'}</div>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Approval Level</span>
                        <div className="font-medium">{selectedApplication.approval_level || 'N/A'}</div>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Joint Application</span>
                        <div className="font-medium">{selectedApplication.is_joint_application ? 'Yes' : 'No'}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Product Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Product Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm text-muted-foreground">Product Name</span>
                        <div className="font-medium">{selectedApplication.loan_products?.name}</div>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Product Code</span>
                        <div className="font-medium">{selectedApplication.loan_products?.short_name}</div>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Default Interest Rate</span>
                        <div className="font-medium">{selectedApplication.loan_products?.default_nominal_interest_rate}%</div>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Interest Rate Range</span>
                        <div className="font-medium">
                          {selectedApplication.loan_products?.min_nominal_interest_rate}% - {selectedApplication.loan_products?.max_nominal_interest_rate}%
                        </div>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Default Term</span>
                        <div className="font-medium">{selectedApplication.loan_products?.default_term} months</div>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Principal Range</span>
                        <div className="font-medium">
                          {formatCurrency(selectedApplication.loan_products?.min_principal || 0)} - {formatCurrency(selectedApplication.loan_products?.max_principal || 0)}
                        </div>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Currency</span>
                        <div className="font-medium">{selectedApplication.loan_products?.currency_code || 'KES'}</div>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Fund Source</span>
                        <div className="font-medium">{selectedApplication.funds?.fund_name || 'N/A'}</div>
                      </div>
                    </div>
                    {selectedApplication.loan_products?.description && (
                      <div className="mt-4">
                        <span className="text-sm text-muted-foreground">Product Description</span>
                        <div className="font-medium text-sm bg-muted p-3 rounded-md mt-1">{selectedApplication.loan_products.description}</div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Loan Request Details */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Loan Request Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm text-muted-foreground">Requested Amount</span>
                        <div className="font-medium text-lg">{formatCurrency(selectedApplication.requested_amount)}</div>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Requested Term</span>
                        <div className="font-medium">{selectedApplication.requested_term} months</div>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Final Approved Amount</span>
                        <div className="font-medium text-lg text-green-600">
                          {selectedApplication.final_approved_amount ? formatCurrency(selectedApplication.final_approved_amount) : 'Pending'}
                        </div>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Final Approved Term</span>
                        <div className="font-medium">{selectedApplication.final_approved_term || 'Pending'} {selectedApplication.final_approved_term ? 'months' : ''}</div>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Final Approved Interest Rate</span>
                        <div className="font-medium">{selectedApplication.final_approved_interest_rate || 'Pending'} {selectedApplication.final_approved_interest_rate ? '%' : ''}</div>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Purpose</span>
                        <div className="font-medium capitalize">{selectedApplication.purpose?.replace(/_/g, ' ')}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Financial Assessment */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Financial Assessment</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm text-muted-foreground">Credit Score</span>
                        <div className="font-medium">{selectedApplication.credit_score || 'Not assessed'}</div>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Debt-to-Income Ratio</span>
                        <div className="font-medium">{selectedApplication.debt_to_income_ratio ? `${selectedApplication.debt_to_income_ratio}%` : 'Not assessed'}</div>
                      </div>
                    </div>
                    
                    {selectedApplication.financial_data && (
                      <div className="mt-4">
                        <span className="text-sm text-muted-foreground">Financial Data</span>
                        <div className="bg-muted p-3 rounded-md mt-1">
                          <pre className="text-sm">{JSON.stringify(selectedApplication.financial_data, null, 2)}</pre>
                        </div>
                      </div>
                    )}
                    
                    {selectedApplication.business_information && (
                      <div className="mt-4">
                        <span className="text-sm text-muted-foreground">Business Information</span>
                        <div className="bg-muted p-3 rounded-md mt-1">
                          <pre className="text-sm">{JSON.stringify(selectedApplication.business_information, null, 2)}</pre>
                        </div>
                      </div>
                    )}
                    
                    {selectedApplication.employment_verification && (
                      <div className="mt-4">
                        <span className="text-sm text-muted-foreground">Employment Verification</span>
                        <div className="bg-muted p-3 rounded-md mt-1">
                          <pre className="text-sm">{JSON.stringify(selectedApplication.employment_verification, null, 2)}</pre>
                        </div>
                      </div>
                    )}
                    
                    {selectedApplication.risk_assessment && (
                      <div className="mt-4">
                        <span className="text-sm text-muted-foreground">Risk Assessment</span>
                        <div className="bg-muted p-3 rounded-md mt-1">
                          <pre className="text-sm">{JSON.stringify(selectedApplication.risk_assessment, null, 2)}</pre>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Timeline */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Application Timeline</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Created</span>
                        <span className="font-medium">{format(new Date(selectedApplication.created_at), 'MMM dd, yyyy HH:mm')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Submitted</span>
                        <span className="font-medium">{format(new Date(selectedApplication.submitted_at), 'MMM dd, yyyy HH:mm')}</span>
                      </div>
                      {selectedApplication.reviewed_at && (
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Reviewed</span>
                          <span className="font-medium">{format(new Date(selectedApplication.reviewed_at), 'MMM dd, yyyy HH:mm')}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Last Updated</span>
                        <span className="font-medium">{format(new Date(selectedApplication.updated_at), 'MMM dd, yyyy HH:mm')}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Approval Notes */}
                {selectedApplication.approval_notes && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Approval Notes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm bg-muted p-3 rounded-md">{selectedApplication.approval_notes}</div>
                    </CardContent>
                  </Card>
                )}

                {/* Repayment Schedule */}
                {selectedApplication.repayment_schedule && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Repayment Schedule</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-muted p-3 rounded-md">
                        <pre className="text-sm">{JSON.stringify(selectedApplication.repayment_schedule, null, 2)}</pre>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Loan Charge Dialog */}
        <Dialog open={showLoanChargeDialog} onOpenChange={setShowLoanChargeDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Loan Charge</DialogTitle>
              <DialogDescription>
                Add a charge to loan {selectedItem?.loan_number}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Charge Type</label>
                <select className="w-full mt-1 p-2 border rounded-md">
                  <option>Late Payment Fee</option>
                  <option>Processing Fee</option>
                  <option>Insurance Fee</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Amount</label>
                <input type="number" className="w-full mt-1 p-2 border rounded-md" placeholder="Enter amount" />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <textarea className="w-full mt-1 p-2 border rounded-md" placeholder="Enter description" />
              </div>
              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowLoanChargeDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={() => {
                  toast({
                    title: "Charge Added",
                    description: "Loan charge has been added successfully",
                  });
                  setShowLoanChargeDialog(false);
                }}>
                  Add Charge
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Modify Application Dialog */}
        <Dialog open={showModifyDialog} onOpenChange={setShowModifyDialog}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Modify Application</DialogTitle>
              <DialogDescription>
                Modify application {selectedApplication?.application_number}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              {/* Basic Loan Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Loan Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Requested Amount</label>
                      <input 
                        type="number" 
                        className="w-full mt-1 p-2 border rounded-md" 
                        defaultValue={selectedApplication?.requested_amount}
                        step="0.01"
                        min={selectedApplication?.loan_products?.min_principal}
                        max={selectedApplication?.loan_products?.max_principal}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Range: {formatCurrency(selectedApplication?.loan_products?.min_principal || 0)} - {formatCurrency(selectedApplication?.loan_products?.max_principal || 0)}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Term (months)</label>
                      <input 
                        type="number" 
                        className="w-full mt-1 p-2 border rounded-md" 
                        defaultValue={selectedApplication?.requested_term}
                        min="1"
                        max="60"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Purpose</label>
                      <select className="w-full mt-1 p-2 border rounded-md" defaultValue={selectedApplication?.purpose}>
                        <option value="business_expansion">Business Expansion</option>
                        <option value="working_capital">Working Capital</option>
                        <option value="home_improvement">Home Improvement</option>
                        <option value="education">Education</option>
                        <option value="medical">Medical</option>
                        <option value="agriculture">Agriculture</option>
                        <option value="debt_consolidation">Debt Consolidation</option>
                        <option value="emergency">Emergency</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Interest Rate (%)</label>
                      <input 
                        type="number" 
                        className="w-full mt-1 p-2 border rounded-md" 
                        defaultValue={selectedApplication?.final_approved_interest_rate || selectedApplication?.loan_products?.default_nominal_interest_rate}
                        step="0.1"
                        min={selectedApplication?.loan_products?.min_nominal_interest_rate}
                        max={selectedApplication?.loan_products?.max_nominal_interest_rate}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Range: {selectedApplication?.loan_products?.min_nominal_interest_rate}% - {selectedApplication?.loan_products?.max_nominal_interest_rate}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Application Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Application Settings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Approval Level</label>
                      <select className="w-full mt-1 p-2 border rounded-md" defaultValue={selectedApplication?.approval_level || 1}>
                        <option value="1">Level 1</option>
                        <option value="2">Level 2</option>
                        <option value="3">Level 3</option>
                        <option value="4">Level 4</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Application Step</label>
                      <select className="w-full mt-1 p-2 border rounded-md" defaultValue={selectedApplication?.application_step || 'initial'}>
                        <option value="initial">Initial</option>
                        <option value="documentation">Documentation</option>
                        <option value="verification">Verification</option>
                        <option value="assessment">Assessment</option>
                        <option value="approval">Approval</option>
                        <option value="disbursement">Disbursement</option>
                      </select>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input 
                        type="checkbox" 
                        id="requiresApproval"
                        defaultChecked={selectedApplication?.requires_approval}
                        className="rounded"
                      />
                      <label htmlFor="requiresApproval" className="text-sm font-medium">Requires Approval</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input 
                        type="checkbox" 
                        id="jointApplication"
                        defaultChecked={selectedApplication?.is_joint_application}
                        className="rounded"
                      />
                      <label htmlFor="jointApplication" className="text-sm font-medium">Joint Application</label>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Financial Assessment */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Financial Assessment</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Credit Score</label>
                      <input 
                        type="number" 
                        className="w-full mt-1 p-2 border rounded-md" 
                        defaultValue={selectedApplication?.credit_score || ''}
                        min="300"
                        max="850"
                        placeholder="Enter credit score"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Debt-to-Income Ratio (%)</label>
                      <input 
                        type="number" 
                        className="w-full mt-1 p-2 border rounded-md" 
                        defaultValue={selectedApplication?.debt_to_income_ratio || ''}
                        min="0"
                        max="100"
                        step="0.1"
                        placeholder="Enter debt-to-income ratio"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Notes */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Notes & Comments</CardTitle>
                </CardHeader>
                <CardContent>
                  <div>
                    <label className="text-sm font-medium">Application Notes</label>
                    <textarea 
                      className="w-full mt-1 p-2 border rounded-md" 
                      rows={3}
                      placeholder="Enter application notes"
                      defaultValue={selectedApplication?.notes || ''}
                    />
                  </div>
                  <div className="mt-4">
                    <label className="text-sm font-medium">Approval Notes</label>
                    <textarea 
                      className="w-full mt-1 p-2 border rounded-md" 
                      rows={3}
                      placeholder="Enter approval notes"
                      defaultValue={selectedApplication?.approval_notes || ''}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowModifyDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={() => {
                  toast({
                    title: "Application Modified",
                    description: "Loan application has been modified successfully",
                  });
                  setShowModifyDialog(false);
                  fetchClientLoanApplications(); // Refresh the applications
                }}>
                  Save Changes
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Disburse Application Dialog */}
        <AlertDialog open={showDisburseDialog} onOpenChange={setShowDisburseDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Disburse Loan</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to disburse loan application {selectedApplication?.application_number}?
                This action will transfer the funds to the client and activate the loan.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                className="bg-blue-600 text-white hover:bg-blue-700"
                onClick={() => selectedApplication && handleDisburseApplication(selectedApplication)}
              >
                Disburse Loan
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Disburse to Savings Dialog */}
        <AlertDialog open={showDisburseToSavingsDialog} onOpenChange={setShowDisburseToSavingsDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Disburse to Savings</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to disburse loan application {selectedApplication?.application_number} to the client's savings account?
                The loan amount will be credited to their savings account.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                className="bg-green-600 text-white hover:bg-green-700"
                onClick={() => selectedApplication && handleDisburseToSavings(selectedApplication)}
              >
                Disburse to Savings
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Undo Approval Dialog */}
        <AlertDialog open={showUndoApprovalDialog} onOpenChange={setShowUndoApprovalDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Undo Approval</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to undo the approval for loan application {selectedApplication?.application_number}?
                This action will move the application back to pending approval status.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                className="bg-orange-600 text-white hover:bg-orange-700"
                onClick={() => selectedApplication && handleUndoApproval(selectedApplication)}
              >
                Undo Approval
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
};