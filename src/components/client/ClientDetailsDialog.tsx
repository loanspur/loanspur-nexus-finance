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

  const handleCloseClient = async () => {
    try {
      // Here you would call your API to deactivate the client
      console.log('Closing client:', client.id);
      
      toast({
        title: "Client Closed",
        description: `${client.first_name} ${client.last_name}'s account has been deactivated`,
      });
      
      setShowCloseClientDialog(false);
      onOpenChange(false);
    } catch (error) {
      console.error("Error closing client:", error);
      toast({
        title: "Error",
        description: "Failed to close client account. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {client.first_name} {client.last_name}
          </DialogTitle>
          <DialogDescription>
            Client ID: {client.client_number} • Member since {format(new Date(client.created_at), 'MMM dd, yyyy')}
          </DialogDescription>
        </DialogHeader>

        {/* Photo Section */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <Avatar className="h-32 w-32">
              <AvatarImage src={client.profile_picture_url || ""} />
              <AvatarFallback className="text-2xl">
                {client.first_name[0]}{client.last_name[0]}
              </AvatarFallback>
            </Avatar>
            <Button
              size="sm"
              variant="outline"
              className="absolute -bottom-2 left-1/2 transform -translate-x-1/2"
            >
              <Camera className="h-4 w-4 mr-2" />
              Upload Photo
            </Button>
          </div>
        </div>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="accounts">Accounts</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Personal Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Personal Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Name:</span>
                    <span>{client.first_name} {client.last_name}</span>
                  </div>
                  
                  {client.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Email:</span>
                      <span>{client.email}</span>
                    </div>
                  )}
                  
                  {client.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Phone:</span>
                      <span>{client.phone}</span>
                    </div>
                  )}
                  
                  {client.national_id && (
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">National ID:</span>
                      <span>{client.national_id}</span>
                    </div>
                  )}
                  
                  {client.date_of_birth && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Date of Birth:</span>
                      <span>{format(new Date(client.date_of_birth), 'MMM dd, yyyy')}</span>
                    </div>
                  )}
                  
                  {client.gender && (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Gender:</span>
                      <span className="capitalize">{client.gender}</span>
                    </div>
                  )}
                  
                  {client.occupation && (
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Occupation:</span>
                      <span>{client.occupation}</span>
                    </div>
                  )}
                  
                  {client.monthly_income && (
                    <div className="flex items-center gap-2">
                      <Wallet className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Monthly Income:</span>
                      <span>{formatCurrency(client.monthly_income)}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Account Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Account Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Status:</span>
                    <Badge variant={client.is_active ? "default" : "secondary"}>
                      {client.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  
                  {client.approval_status && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Approval:</span>
                      <Badge variant={getStatusColor(client.approval_status)}>
                        {client.approval_status}
                      </Badge>
                    </div>
                  )}
                  
                  {client.kyc_status && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium">KYC Status:</span>
                      <Badge variant={getStatusColor(client.kyc_status)}>
                        {client.kyc_status}
                      </Badge>
                    </div>
                  )}
                  
                  {client.timely_repayment_rate !== null && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Repayment Rate:</span>
                      <span className={`font-semibold ${
                        client.timely_repayment_rate >= 95 ? 'text-green-600' :
                        client.timely_repayment_rate >= 80 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {client.timely_repayment_rate}%
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Financial Summary */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg">Financial Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <CreditCard className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                      <div className="text-2xl font-bold text-orange-600">
                        {formatCurrency(calculateTotalLoanBalance())}
                      </div>
                      <div className="text-sm text-muted-foreground">Current Loan Balance</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {client.loans?.length || 0} active loan(s)
                      </div>
                    </div>
                    
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <PiggyBank className="h-8 w-8 mx-auto mb-2 text-green-600" />
                      <div className="text-2xl font-bold text-green-600">
                        {formatCurrency(calculateTotalSavingsBalance())}
                      </div>
                      <div className="text-sm text-muted-foreground">Total Savings</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {client.savings_accounts?.length || 0} account(s)
                      </div>
                    </div>
                    
                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <Wallet className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                      <div className="text-2xl font-bold text-blue-600">
                        {formatCurrency((calculateTotalSavingsBalance() - calculateTotalLoanBalance()))}
                      </div>
                      <div className="text-sm text-muted-foreground">Net Position</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Savings - Loans
                      </div>
                    </div>

                    <div className="text-center p-4 bg-muted/50 rounded-lg">
                      <FileText className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                      <div className="text-2xl font-bold text-purple-600">
                        {/* Placeholder for previous loans count */}
                        {Math.floor(Math.random() * 5) + 1}
                      </div>
                      <div className="text-sm text-muted-foreground">Previous Loans</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Completed loans
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Client Assignment Information */}
              <Card className="md:col-span-2">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Assignment & Membership</CardTitle>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setShowTransferDialog(true)}
                  >
                    <ArrowRightLeft className="h-4 w-4 mr-2" />
                    Transfer
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                      <Building className="h-6 w-6 text-blue-600" />
                      <div>
                        <div className="font-medium text-sm">Branch</div>
                        <div className="text-lg font-bold text-blue-600">Main Branch</div>
                        <div className="text-xs text-muted-foreground">Nairobi CBD</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between gap-3 p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <User className="h-6 w-6 text-indigo-600" />
                        <div>
                          <div className="font-medium text-sm">Loan Officer</div>
                          <div className="text-lg font-bold text-indigo-600">Jane Wanjiku</div>
                          <div className="text-xs text-muted-foreground">Senior Officer</div>
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setShowUpdateOfficerDialog(true)}
                        className="shrink-0"
                      >
                        Change
                      </Button>
                    </div>
                    
                    <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                      <Users className="h-6 w-6 text-emerald-600" />
                      <div>
                        <div className="font-medium text-sm">Group</div>
                        <div className="text-lg font-bold text-emerald-600">
                          {/* Placeholder group name */}
                          Umoja Savings Group
                        </div>
                        <div className="text-xs text-muted-foreground">25 members</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Client Documents</CardTitle>
                  <CardDescription>Manage and view all client documentation</CardDescription>
                </div>
                <Button>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Document
                </Button>
              </CardHeader>
              <CardContent>
                {/* Placeholder documents - you'll need to fetch actual documents */}
                <div className="space-y-4">
                  {[
                    { name: "National ID Copy", type: "Identity", status: "verified", date: "2024-01-15" },
                    { name: "Passport Photo", type: "Identity", status: "verified", date: "2024-01-15" },
                    { name: "Bank Statement", type: "Financial", status: "pending", date: "2024-01-20" },
                    { name: "Employment Letter", type: "Employment", status: "verified", date: "2024-01-18" },
                    { name: "Proof of Address", type: "Address", status: "pending", date: "2024-01-22" }
                  ].map((doc, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{doc.name}</div>
                          <div className="text-sm text-muted-foreground">{doc.type} • Uploaded {format(new Date(doc.date), 'MMM dd, yyyy')}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={doc.status === 'verified' ? 'default' : 'secondary'}>
                          {doc.status === 'verified' ? (
                            <CheckCircle className="h-3 w-3 mr-1" />
                          ) : (
                            <Clock className="h-3 w-3 mr-1" />
                          )}
                          {doc.status}
                        </Badge>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Accounts Tab */}
          <TabsContent value="accounts" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Loans Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-orange-600" />
                    Loan Accounts
                  </CardTitle>
                  <CardDescription>Active and past loan accounts</CardDescription>
                  <Button 
                    size="sm" 
                    onClick={() => setShowAddLoanDialog(true)}
                    className="ml-auto"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Loan
                  </Button>
                </CardHeader>
                <CardContent>
                  {client.loans && client.loans.length > 0 ? (
                    <div className="space-y-4">
                      {/* Placeholder loan data - you'll need to fetch actual loan details */}
                      {[
                        { 
                          id: "L001", 
                          type: "Personal Loan", 
                          amount: 150000, 
                          outstanding: 75000, 
                          status: "active",
                          nextPayment: "2024-02-15",
                          monthlyPayment: 12500
                        },
                        { 
                          id: "L002", 
                          type: "Business Loan", 
                          amount: 300000, 
                          outstanding: 200000, 
                          status: "active",
                          nextPayment: "2024-02-20",
                          monthlyPayment: 25000
                        }
                      ].map((loan, index) => (
                        <div key={index} className="p-4 border rounded-lg space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="font-medium">{loan.type}</div>
                            <Badge variant={loan.status === 'active' ? 'default' : 'secondary'}>
                              {loan.status}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">Loan ID: {loan.id}</div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Original Amount:</span>
                              <div className="font-medium">{formatCurrency(loan.amount)}</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Outstanding:</span>
                              <div className="font-medium text-orange-600">{formatCurrency(loan.outstanding)}</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Monthly Payment:</span>
                              <div className="font-medium">{formatCurrency(loan.monthlyPayment)}</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Next Payment:</span>
                              <div className="font-medium">{format(new Date(loan.nextPayment), 'MMM dd, yyyy')}</div>
                            </div>
                          </div>
                          <Button variant="outline" size="sm" className="w-full mt-2">
                            View Details
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <CreditCard className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No loan accounts found</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Savings Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PiggyBank className="h-5 w-5 text-green-600" />
                    Savings Accounts
                  </CardTitle>
                  <CardDescription>Active savings and investment accounts</CardDescription>
                  <Button 
                    size="sm" 
                    onClick={() => setShowAddSavingsDialog(true)}
                    className="ml-auto"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Savings
                  </Button>
                </CardHeader>
                <CardContent>
                  {client.savings_accounts && client.savings_accounts.length > 0 ? (
                    <div className="space-y-4">
                      {/* Placeholder savings data - you'll need to fetch actual savings details */}
                      {[
                        { 
                          id: "S001", 
                          type: "Regular Savings", 
                          balance: 45000, 
                          interestRate: 3.5,
                          status: "active",
                          lastTransaction: "2024-01-28",
                          monthlyContribution: 5000
                        },
                        { 
                          id: "S002", 
                          type: "Fixed Deposit", 
                          balance: 100000, 
                          interestRate: 8.0,
                          status: "active",
                          maturityDate: "2024-12-31",
                          monthlyContribution: 0
                        }
                      ].map((savings, index) => (
                        <div key={index} className="p-4 border rounded-lg space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="font-medium">{savings.type}</div>
                            <Badge variant={savings.status === 'active' ? 'default' : 'secondary'}>
                              {savings.status}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">Account ID: {savings.id}</div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Current Balance:</span>
                              <div className="font-medium text-green-600">{formatCurrency(savings.balance)}</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Interest Rate:</span>
                              <div className="font-medium">{savings.interestRate}% p.a.</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Monthly Contribution:</span>
                              <div className="font-medium">{formatCurrency(savings.monthlyContribution)}</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">
                                {savings.type === 'Fixed Deposit' ? 'Maturity Date:' : 'Last Transaction:'}
                              </span>
                              <div className="font-medium">
                                {format(new Date(savings.type === 'Fixed Deposit' ? savings.maturityDate : savings.lastTransaction), 'MMM dd, yyyy')}
                              </div>
                            </div>
                          </div>
                          <Button variant="outline" size="sm" className="w-full mt-2">
                            View Details
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <PiggyBank className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No savings accounts found</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <Separator />

        <div className="flex justify-between">
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

        {/* Add Account Dialogs */}
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

        {/* Close Client Confirmation Dialog */}
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
              <AlertDialogAction onClick={handleCloseClient} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Close Client Account
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
};