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
import { Label } from "@/components/ui/label";
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  CreditCard, 
  PiggyBank,
  FileText,
  Edit,
  ArrowRightLeft,
  TrendingUp,
  DollarSign,
  Users
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { LoanAccountStatusView } from "./LoanAccountStatusView";
import { useCurrency } from "@/contexts/CurrencyContext";

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

interface CleanClientDetailsDialogProps {
  client: Client | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CleanClientDetailsDialog = ({ client, open, onOpenChange }: CleanClientDetailsDialogProps) => {
  const [clientLoans, setClientLoans] = useState<any[]>([]);
  const [clientSavings, setClientSavings] = useState<any[]>([]);
  const [clientLoanApplications, setClientLoanApplications] = useState<any[]>([]);
  const [hideClosedAccounts, setHideClosedAccounts] = useState(false);
  const [loading, setLoading] = useState(true);
  const { formatAmount } = useCurrency();
  
  const { toast } = useToast();

  useEffect(() => {
    if (open && client) {
      fetchClientData();
    }
  }, [open, client]);

  const fetchClientData = async () => {
    if (!client) return;

    setLoading(true);
    try {
      // Fetch loans
      const { data: loans } = await supabase
        .from('loans')
        .select(`
          *,
          loan_products (
            name,
            short_name,
            interest_rate
          )
        `)
        .eq('client_id', client.id);

      // Fetch savings accounts
      const { data: savings } = await supabase
        .from('savings_accounts')
        .select(`
          *,
          savings_products (
            name,
            short_name,
            interest_rate
          )
        `)
        .eq('client_id', client.id);

      // Fetch loan applications
      const { data: applications } = await supabase
        .from('loan_applications')
        .select(`
          *,
          loan_products (
            name,
            short_name,
            interest_rate
          )
        `)
        .eq('client_id', client.id);

      setClientLoans(loans || []);
      setClientSavings(savings || []);
      setClientLoanApplications(applications || []);
    } catch (error) {
      console.error('Error fetching client data:', error);
    } finally {
      setLoading(false);
    }
  };


  const calculateTotalLoanBalance = () => {
    return clientLoans.reduce((sum, loan) => sum + (loan.outstanding_balance || 0), 0);
  };

  const calculateTotalSavingsBalance = () => {
    return clientSavings.reduce((sum, savings) => sum + (savings.account_balance || 0), 0);
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
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

  // Transform data for LoanAccountStatusView
  const combinedLoanAccounts = [
    ...clientLoans.map(loan => ({
      id: loan.id,
      type: 'loan' as const,
      display_name: loan.loan_products?.name || 'Unknown Product',
      identifier: loan.loan_number,
      amount: loan.principal_amount,
      outstanding: loan.outstanding_balance,
      status: loan.status,
      date: loan.created_at,
      date_label: 'Disbursed',
      loan_products: loan.loan_products
    })),
    ...clientLoanApplications.map(app => ({
      id: app.id,
      type: 'application' as const,
      display_name: app.loan_products?.name || 'Unknown Product',
      identifier: app.application_number,
      amount: app.requested_amount,
      outstanding: null,
      status: app.status,
      date: app.created_at,
      date_label: 'Applied',
      loan_products: app.loan_products
    }))
  ].filter(account => {
    if (hideClosedAccounts) {
      const closedStatuses = ['rejected', 'closed', 'fully_paid', 'written_off', 'withdrawn'];
      return !closedStatuses.includes(account.status?.toLowerCase());
    }
    return true;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleViewDetails = (account: any) => {
    // Handle view details logic here
    console.log('View details for:', account);
  };

  const handleNewApplication = () => {
    // Handle new application logic here
    console.log('New application for client:', client?.id);
  };

  const handleApprove = (account: any) => {
    // Handle approve logic here
    console.log('Approve account:', account);
  };

  const handleReject = (account: any) => {
    // Handle reject logic here
    console.log('Reject account:', account);
  };

  if (!client) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader className="border-b pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={client.profile_picture_url || undefined} />
                <AvatarFallback className="text-lg">
                  {client.first_name[0]}{client.last_name[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <DialogTitle className="text-2xl font-bold">
                  {client.first_name} {client.last_name}
                </DialogTitle>
                <DialogDescription className="flex items-center gap-4 mt-1">
                  <span className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    {client.client_number}
                  </span>
                  <span className="flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    {client.email || 'No email'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Phone className="h-4 w-4" />
                    {client.phone || 'No phone'}
                  </span>
                  {getStatusBadge(client.approval_status || 'pending')}
                </DialogDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
              <Button size="sm" variant="outline">
                <ArrowRightLeft className="h-4 w-4 mr-2" />
                Transfer
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Financial Summary */}
        <div className="grid grid-cols-3 gap-4 py-4 border-b">
          <div className="text-center">
            <div className="text-2xl font-bold text-destructive">
              {formatAmount(calculateTotalLoanBalance())}
            </div>
            <div className="text-sm text-muted-foreground">Outstanding Loans</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-success">
              {formatAmount(calculateTotalSavingsBalance())}
            </div>
            <div className="text-sm text-muted-foreground">Total Savings</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">
              {client.timely_repayment_rate !== null ? `${client.timely_repayment_rate}%` : 'N/A'}
            </div>
            <div className="text-sm text-muted-foreground">Repayment Rate</div>
          </div>
        </div>

        {/* Content Tabs */}
        <div className="flex-1 overflow-hidden">
          <Tabs defaultValue="accounts" className="h-full">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="accounts">Loan Accounts</TabsTrigger>
              <TabsTrigger value="savings">Savings</TabsTrigger>
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
            </TabsList>

            <div className="mt-4 overflow-y-auto max-h-[60vh]">
              <TabsContent value="accounts" className="mt-0">
                <LoanAccountStatusView
                  accounts={combinedLoanAccounts}
                  onViewDetails={handleViewDetails}
                  onNewApplication={handleNewApplication}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  hideClosedAccounts={hideClosedAccounts}
                  onToggleClosedAccounts={() => setHideClosedAccounts(!hideClosedAccounts)}
                />
              </TabsContent>

              <TabsContent value="savings" className="mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PiggyBank className="h-5 w-5" />
                      Savings Accounts
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {clientSavings.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <PiggyBank className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No savings accounts found</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {clientSavings.map((account) => (
                          <div key={account.id} className="p-4 border rounded-lg">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h4 className="font-medium">{account.savings_products?.name}</h4>
                                <p className="text-sm text-muted-foreground font-mono">
                                  {account.account_number}
                                </p>
                              </div>
                              <Badge variant="outline" className="capitalize">
                                {account.status}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="text-muted-foreground">Balance</p>
                                <p className="font-medium">{formatAmount(account.account_balance)}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Interest Rate</p>
                                <p className="font-medium">{account.savings_products?.interest_rate}%</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="profile" className="mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle>Client Profile</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Full Name</Label>
                          <p className="text-sm">{client.first_name} {client.last_name}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">National ID</Label>
                          <p className="text-sm">{client.national_id || 'Not provided'}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Date of Birth</Label>
                          <p className="text-sm">
                            {client.date_of_birth ? format(new Date(client.date_of_birth), 'PPP') : 'Not provided'}
                          </p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Gender</Label>
                          <p className="text-sm capitalize">{client.gender || 'Not provided'}</p>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Occupation</Label>
                          <p className="text-sm">{client.occupation || 'Not provided'}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Monthly Income</Label>
                          <p className="text-sm">
                            {client.monthly_income ? formatAmount(client.monthly_income) : 'Not provided'}
                          </p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">KYC Status</Label>
                          <p className="text-sm">
                            <Badge variant="outline" className="capitalize">
                              {client.kyc_status || 'pending'}
                            </Badge>
                          </p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Member Since</Label>
                          <p className="text-sm">{format(new Date(client.created_at), 'PPP')}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="documents" className="mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Documents
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
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};