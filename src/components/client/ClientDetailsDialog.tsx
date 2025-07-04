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
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  CreditCard, 
  PiggyBank,
  Building,
  FileText,
  Edit,
  Wallet
} from "lucide-react";
import { format } from "date-fns";

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {client.first_name} {client.last_name}
          </DialogTitle>
          <DialogDescription>
            Client ID: {client.client_number} • Member since {format(new Date(client.created_at), 'MMM dd, yyyy')}
          </DialogDescription>
        </DialogHeader>

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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <CreditCard className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                  <div className="text-2xl font-bold text-orange-600">
                    {formatCurrency(calculateTotalLoanBalance())}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Loan Balance</div>
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
              </div>
            </CardContent>
          </Card>
        </div>

        <Separator />

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button>
            <Edit className="h-4 w-4 mr-2" />
            Edit Client
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};