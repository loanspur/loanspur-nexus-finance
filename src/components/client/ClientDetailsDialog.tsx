import { useState } from "react";
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
import { 
  User, 
  Users,
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  CreditCard, 
  PiggyBank,
  Building,
  FileText,
  Edit,
  Wallet,
  Camera,
  Upload,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Plus,
  ArrowRightLeft,
  UserMinus
} from "lucide-react";
import { format } from "date-fns";
import { AddSavingsAccountDialog } from "./AddSavingsAccountDialog";
import { AddLoanAccountDialog } from "./AddLoanAccountDialog";
import { TransferClientDialog } from "./TransferClientDialog";
import { UpdateLoanOfficerDialog } from "./UpdateLoanOfficerDialog";
import { LoanDetailsDialog } from "@/components/loan/LoanDetailsDialog";
import { SavingsDetailsDialog } from "@/components/savings/SavingsDetailsDialog";
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
  const { toast } = useToast();
  
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
        return 'default';
      case 'pending':
        return 'secondary';
      case 'inactive':
      case 'suspended':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

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

  const handleSavingsAction = (action: string, savingsId: string) => {
    toast({
      title: `Savings ${action}`,
      description: `${action} action completed for savings ${savingsId}`,
    });
  };

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
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Loans Section */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Loans
                    </CardTitle>
                    <Button size="sm" onClick={() => setShowAddLoanDialog(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Loan
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {mockLoans.map((loan) => (
                      <div key={loan.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{loan.type}</h4>
                            <p className="text-sm text-muted-foreground">{loan.id}</p>
                          </div>
                          <Badge variant={getStatusColor(loan.status)}>
                            {loan.status}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-muted-foreground">Amount</span>
                            <div className="font-medium">{formatCurrency(loan.amount)}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Outstanding</span>
                            <div className="font-medium">{formatCurrency(loan.outstanding)}</div>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => {
                              setSelectedLoan(loan);
                              setShowLoanDetails(true);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                          
                          {loan.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleLoanAction('Approve', loan.id)}
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Approve
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleLoanAction('Modify', loan.id)}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Modify
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleLoanAction('Disburse', loan.id)}
                              >
                                <Wallet className="h-4 w-4 mr-2" />
                                Disburse
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Savings Section */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <PiggyBank className="h-5 w-5" />
                      Savings
                    </CardTitle>
                    <Button size="sm" onClick={() => setShowAddSavingsDialog(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Savings
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {mockSavings.map((savings) => (
                      <div key={savings.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{savings.type}</h4>
                            <p className="text-sm text-muted-foreground">{savings.id}</p>
                          </div>
                          <Badge variant={getStatusColor(savings.status)}>
                            {savings.status}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-muted-foreground">Balance</span>
                            <div className="font-medium">{formatCurrency(savings.balance)}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Interest Rate</span>
                            <div className="font-medium">{savings.interestRate}%</div>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => {
                              setSelectedSavings(savings);
                              setShowSavingsDetails(true);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                          
                          {savings.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleSavingsAction('Approve', savings.id)}
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Approve
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleSavingsAction('Modify', savings.id)}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Modify
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleSavingsAction('Activate', savings.id)}
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Activate
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
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
        />

        <AddLoanAccountDialog
          clientId={client.id}
          clientName={`${client.first_name} ${client.last_name}`}
          open={showAddLoanDialog}
          onOpenChange={setShowAddLoanDialog}
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
      </DialogContent>
    </Dialog>
  );
};