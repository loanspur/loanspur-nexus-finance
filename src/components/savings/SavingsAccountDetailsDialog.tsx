import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { 
  PiggyBank, 
  Calendar, 
  DollarSign, 
  Percent, 
  User, 
  CreditCard,
  TrendingUp,
  Download,
  Plus,
  Minus
} from "lucide-react";

interface SavingsAccount {
  id: string;
  account_number: string;
  account_balance: number;
  available_balance: number;
  interest_earned: number;
  is_active: boolean;
  opened_date: string;
  clients?: {
    first_name: string;
    last_name: string;
    email: string | null;
    phone: string | null;
  };
  savings_products?: {
    name: string;
    currency_code: string;
  };
}

interface SavingsAccountDetailsDialogProps {
  account: SavingsAccount | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SavingsAccountDetailsDialog = ({ 
  account, 
  open, 
  onOpenChange 
}: SavingsAccountDetailsDialogProps) => {
  if (!account) return null;

  const handleDeposit = () => {
    // TODO: Implement deposit functionality
    console.log("Deposit to account:", account.id);
  };

  const handleWithdraw = () => {
    // TODO: Implement withdrawal functionality
    console.log("Withdraw from account:", account.id);
  };

  const handleStatementDownload = () => {
    // TODO: Implement statement download
    console.log("Download statement for account:", account.id);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PiggyBank className="h-5 w-5" />
            Account Details - {account.account_number}
          </DialogTitle>
          <DialogDescription>
            Comprehensive view of savings account information and transactions
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Account Overview */}
          <div className="lg:col-span-2 space-y-6">
            {/* Client Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Account Holder
                </CardTitle>
              </CardHeader>
              <CardContent>
                {account.clients && (
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Name:</span>
                      <span className="font-medium">
                        {account.clients.first_name} {account.clients.last_name}
                      </span>
                    </div>
                    {account.clients.email && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Email:</span>
                        <span>{account.clients.email}</span>
                      </div>
                    )}
                    {account.clients.phone && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Phone:</span>
                        <span>{account.clients.phone}</span>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Account Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Account Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Account Number:</span>
                    <span className="font-medium">{account.account_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Product:</span>
                    <span>{account.savings_products?.name || 'Unknown Product'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Currency:</span>
                    <Badge variant="outline">
                      {account.savings_products?.currency_code || 'USD'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Opened Date:</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(account.opened_date), 'MMM dd, yyyy')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge variant={account.is_active ? "default" : "secondary"}>
                      {account.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Perform common account operations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Button 
                    onClick={handleDeposit} 
                    className="flex items-center gap-2"
                    disabled={!account.is_active}
                  >
                    <Plus className="h-4 w-4" />
                    Deposit
                  </Button>
                  <Button 
                    onClick={handleWithdraw} 
                    variant="outline"
                    className="flex items-center gap-2"
                    disabled={!account.is_active || account.available_balance <= 0}
                  >
                    <Minus className="h-4 w-4" />
                    Withdraw
                  </Button>
                  <Button 
                    onClick={handleStatementDownload} 
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Statement
                  </Button>
                  <Button 
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <TrendingUp className="h-4 w-4" />
                    History
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Balance Summary */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Account Balance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {account.savings_products?.currency_code || 'USD'} {account.account_balance.toLocaleString()}
                  </div>
                  <p className="text-sm text-muted-foreground">Current Balance</p>
                </div>
                
                <Separator />
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Available:</span>
                    <span className="font-medium">
                      {account.savings_products?.currency_code || 'USD'} {account.available_balance.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Interest Earned:</span>
                    <span className="font-medium text-success">
                      {account.savings_products?.currency_code || 'USD'} {account.interest_earned.toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Account Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Percent className="h-4 w-4" />
                  Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-success">
                    +{((account.interest_earned / Math.max(account.account_balance - account.interest_earned, 1)) * 100).toFixed(2)}%
                  </div>
                  <p className="text-sm text-muted-foreground">Total Return</p>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Days Active:</span>
                    <span>
                      {Math.floor((new Date().getTime() - new Date(account.opened_date).getTime()) / (1000 * 60 * 60 * 24))}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Avg Daily Balance:</span>
                    <span>
                      {account.savings_products?.currency_code || 'USD'} {(account.account_balance * 0.85).toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};