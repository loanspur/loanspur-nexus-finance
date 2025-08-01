import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  PiggyBank, 
  ArrowDownRight, 
  ArrowUpRight, 
  ArrowRightLeft, 
  Calendar, 
  Download,
  Plus,
  Eye
} from "lucide-react";
import { format } from "date-fns";

interface SavingsAccount {
  id: string;
  account_number: string;
  account_balance: number;
  available_balance: number;
  interest_earned: number;
  opened_date: string;
  is_active: boolean;
  savings_products?: {
    name: string;
    short_name: string;
    nominal_annual_interest_rate: number;
  };
}

interface ClientSavingsTabProps {
  savings: SavingsAccount[];
  formatCurrency: (amount: number) => string;
  showClosedAccounts: boolean;
  onToggleClosedAccounts: () => void;
  onNewSavingsAccount: () => void;
  onViewAccountDetails: (account: SavingsAccount) => void;
}

export const ClientSavingsTab = ({ 
  savings, 
  formatCurrency, 
  showClosedAccounts, 
  onToggleClosedAccounts, 
  onNewSavingsAccount, 
  onViewAccountDetails 
}: ClientSavingsTabProps) => {
  
  const getVisibleAccounts = () => {
    if (showClosedAccounts) {
      return savings.filter(account => !account.is_active);
    } else {
      return savings.filter(account => account.is_active);
    }
  };

  const visibleAccounts = getVisibleAccounts();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <PiggyBank className="h-5 w-5" />
                Savings Accounts
              </CardTitle>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="show-closed-accounts"
                  checked={showClosedAccounts}
                  onCheckedChange={onToggleClosedAccounts}
                />
                <Label htmlFor="show-closed-accounts" className="text-sm">
                  Show closed accounts
                </Label>
              </div>
              <Button onClick={onNewSavingsAccount} className="bg-gradient-primary">
                <Plus className="h-4 w-4 mr-2" />
                New Savings Account
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {visibleAccounts.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <PiggyBank className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">
                {showClosedAccounts ? 'No closed savings accounts found' : 'No active savings accounts found'}
              </p>
              <p className="text-sm">
                {showClosedAccounts ? 'All accounts are currently active' : 'Create a savings account to get started'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {visibleAccounts.map((account) => (
                <div 
                  key={account.id} 
                  className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div>
                          <h4 className="font-medium">
                            {account.savings_products?.name || 'Standard Savings'}
                          </h4>
                          <p className="text-sm text-muted-foreground font-mono">
                            {account.account_number}
                          </p>
                        </div>
                        <Badge variant={account.is_active ? "default" : "secondary"}>
                          {account.is_active ? 'Active' : 'Closed'}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Current Balance</p>
                          <p className="font-medium text-success">
                            {formatCurrency(account.account_balance || 0)}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Available Balance</p>
                          <p className="font-medium">
                            {formatCurrency(account.available_balance || 0)}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Interest Earned</p>
                          <p className="font-medium text-success">
                            {formatCurrency(account.interest_earned || 0)}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Opened</p>
                          <p className="font-medium">
                            {format(new Date(account.opened_date), 'MMM dd, yyyy')}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {account.is_active && (
                        <>
                          <Button size="sm" variant="outline">
                            <ArrowDownRight className="h-4 w-4 mr-1" />
                            Deposit
                          </Button>
                          <Button size="sm" variant="outline">
                            <ArrowUpRight className="h-4 w-4 mr-1" />
                            Withdraw
                          </Button>
                        </>
                      )}
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => onViewAccountDetails(account)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};