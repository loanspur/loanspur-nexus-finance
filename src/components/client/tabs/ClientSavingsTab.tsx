import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PiggyBank, ArrowDownRight, ArrowUpRight, ArrowRightLeft, Calendar, Download } from "lucide-react";
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
}

export const ClientSavingsTab = ({ savings, formatCurrency }: ClientSavingsTabProps) => {
  const [selectedAccount, setSelectedAccount] = useState<SavingsAccount | null>(
    savings.length > 0 ? savings[0] : null
  );

  if (savings.length === 0) {
    return (
      <div className="text-center py-12">
        <PiggyBank className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-medium mb-2">No Savings Accounts</h3>
        <p className="text-muted-foreground">This client doesn't have any savings accounts yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Account Selector if multiple accounts */}
      {savings.length > 1 && (
        <div className="flex gap-2 overflow-x-auto">
          {savings.map((account) => (
            <Button
              key={account.id}
              variant={selectedAccount?.id === account.id ? "default" : "outline"}
              onClick={() => setSelectedAccount(account)}
              className="whitespace-nowrap"
            >
              {account.account_number}
            </Button>
          ))}
        </div>
      )}

      {selectedAccount && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <PiggyBank className="h-5 w-5" />
                  Savings Account
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Account: {selectedAccount.account_number} • {selectedAccount.savings_products?.name || 'Standard Savings'}
                </p>
              </div>
              <Badge variant={selectedAccount.is_active ? "default" : "secondary"}>
                {selectedAccount.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-muted-foreground">Current Balance</div>
                  <div className="text-3xl font-bold text-success">
                    {formatCurrency(selectedAccount.account_balance || 0)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Available Balance</div>
                  <div className="text-lg font-medium">
                    {formatCurrency(selectedAccount.available_balance || 0)}
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-muted-foreground">Account Opened</div>
                  <div className="text-lg font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(selectedAccount.opened_date), 'MMM dd, yyyy')}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Interest Earned</div>
                  <div className="text-lg font-medium text-success">
                    {formatCurrency(selectedAccount.interest_earned || 0)}
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-muted-foreground">Product Type</div>
                  <div className="text-lg font-medium">
                    {selectedAccount.savings_products?.name || 'Standard Savings'}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Interest Rate</div>
                  <div className="text-lg font-medium">
                    {selectedAccount.savings_products?.nominal_annual_interest_rate || 0}% p.a.
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t">
              <div className="flex flex-col sm:flex-row gap-4">
                <Button className="flex-1">
                  <ArrowDownRight className="h-4 w-4 mr-2" />
                  Deposit
                </Button>
                <Button variant="outline" className="flex-1">
                  <ArrowUpRight className="h-4 w-4 mr-2" />
                  Withdraw
                </Button>
                <Button variant="outline" className="flex-1">
                  <ArrowRightLeft className="h-4 w-4 mr-2" />
                  Transfer
                </Button>
                <Button variant="outline" className="flex-1">
                  <Download className="h-4 w-4 mr-2" />
                  Statement
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};