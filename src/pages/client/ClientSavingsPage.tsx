import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SavingsTransactionForm } from "@/components/forms/SavingsTransactionForm";
import { useSavingsAccounts } from "@/hooks/useSupabase";
import { useSavingsTransactions } from "@/hooks/useSavingsManagement";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, Download, ArrowUpRight, ArrowDownRight, ArrowRightLeft, Calendar } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

const ClientSavingsPage = () => {
  const [transactionFormOpen, setTransactionFormOpen] = useState(false);
  const [selectedTransactionType, setSelectedTransactionType] = useState<'deposit' | 'withdrawal' | 'transfer' | 'fee_charge'>('deposit');
  
  const { profile } = useAuth();
  const { data: savingsAccounts, isLoading } = useSavingsAccounts();
  
  // Get the first savings account (assuming client has one primary account)
  const savingsAccount = savingsAccounts?.[0];
  
  const { data: transactions, isLoading: transactionsLoading } = useSavingsTransactions(savingsAccount?.id);

  // Load active payment types for display mapping
  const [paymentTypeMap, setPaymentTypeMap] = useState<Record<string, string>>({});
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('payment_types')
        .select('code, name')
        .eq('is_active', true);
      const map: Record<string, string> = {};
      (data || []).forEach((pt: any) => { if (pt.code) map[pt.code] = pt.name || pt.code; });
      setPaymentTypeMap(map);
    };
    load();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
    }).format(amount);
  };

  const openTransactionForm = (type: 'deposit' | 'withdrawal' | 'transfer' | 'fee_charge') => {
    setSelectedTransactionType(type);
    setTransactionFormOpen(true);
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "deposit":
        return <ArrowDownRight className="h-4 w-4 text-success" />;
      case "withdrawal":
        return <ArrowUpRight className="h-4 w-4 text-destructive" />;
      case "transfer":
        return <ArrowRightLeft className="h-4 w-4 text-primary" />;
      case "interest_posting":
        return <Calendar className="h-4 w-4 text-warning" />;
      default:
        return <ArrowDownRight className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!savingsAccount) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Savings</h1>
          <p className="text-muted-foreground">You don't have any savings accounts yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">My Savings</h1>
        <p className="text-muted-foreground">View and manage your savings accounts</p>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl">Savings Account</CardTitle>
              <CardDescription>Account: {savingsAccount.account_number} • {savingsAccount.savings_products?.name || 'Standard Savings'}</CardDescription>
            </div>
            <Badge variant="default">{savingsAccount.is_active ? 'Active' : 'Inactive'}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground">Current Balance</div>
                <div className="text-3xl font-bold text-success">{formatCurrency(savingsAccount.account_balance || 0)}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Available Balance</div>
                <div className="text-lg font-medium">{formatCurrency(savingsAccount.available_balance || 0)}</div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground">Account Opened</div>
                <div className="text-lg font-medium">{format(new Date(savingsAccount.opened_date), 'MMM dd, yyyy')}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Interest Earned</div>
                <div className="text-lg font-medium text-success">{formatCurrency(savingsAccount.interest_earned || 0)}</div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground">Product Type</div>
                <div className="text-lg font-medium">{savingsAccount.savings_products?.name || 'Standard Savings'}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Total Transactions</div>
                <div className="text-lg font-medium">{transactions?.length || 0}</div>
              </div>
            </div>
          </div>
          
          <div className="mt-6 pt-6 border-t">
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                className="flex-1"
                onClick={() => openTransactionForm('deposit')}
              >
                <ArrowDownRight className="h-4 w-4 mr-2" />
                Deposit
              </Button>
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => openTransactionForm('withdrawal')}
              >
                <ArrowUpRight className="h-4 w-4 mr-2" />
                Withdraw
              </Button>
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => openTransactionForm('transfer')}
              >
                <ArrowRightLeft className="h-4 w-4 mr-2" />
                Transfer
              </Button>
              <Button 
                variant="outline" 
                className="flex-1"
              >
                <Download className="h-4 w-4 mr-2" />
                Statement
              </Button>
            </div>
          </div>
          
          <div className="mt-4 text-sm text-muted-foreground">
            Last updated: {format(new Date(savingsAccount.updated_at), 'MMM dd, yyyy HH:mm')}
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>Record of all your savings transactions</CardDescription>
        </CardHeader>
        <CardContent>
          {transactionsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : transactions && transactions.length > 0 ? (
            <div className="space-y-4">
              {transactions.slice(0, 10).map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3 flex-1">
                    {getTransactionIcon(transaction.transaction_type)}
                    <div>
                      <div className="font-medium capitalize">{transaction.transaction_type.replace('_', ' ')}</div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(transaction.transaction_date), 'MMM dd, yyyy HH:mm')}
                      </div>
                      {transaction.description && (
                        <div className="text-xs text-muted-foreground">{transaction.description}</div>
                      )}
                    </div>
                  </div>
                  
                    <div className="flex items-center gap-6 text-sm">
                      <div className="text-center">
                        <div className={`font-medium ${
                          transaction.transaction_type === 'deposit' || transaction.transaction_type === 'interest_posting'
                            ? 'text-success'
                            : 'text-destructive'
                        }`}>
                          {transaction.transaction_type === 'deposit' || transaction.transaction_type === 'interest_posting'
                            ? '+' : '-'
                          }{formatCurrency(transaction.amount)}
                        </div>
                        {transaction.reference_number && (
                          <div className="text-xs text-muted-foreground">Ref: {transaction.reference_number}</div>
                        )}
                      </div>

                      <div className="text-center hidden sm:block">
                        <div className="font-medium">{transaction.payment_method ? (paymentTypeMap[transaction.payment_method] || transaction.payment_method) : '—'}</div>
                        <div className="text-xs text-muted-foreground">Method</div>
                      </div>
                      
                      <div className="text-center">
                        <div className="font-medium">{formatCurrency(transaction.balance_after)}</div>
                        <div className="text-xs text-muted-foreground">Balance</div>
                      </div>
                    </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No transactions found
            </div>
          )}
          
          {transactions && transactions.length > 10 && (
            <div className="mt-6 text-center">
              <Button variant="outline">Load More Transactions</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transaction Form Dialog */}
      {savingsAccount && (
        <SavingsTransactionForm
          open={transactionFormOpen}
          onOpenChange={setTransactionFormOpen}
          savingsAccount={savingsAccount}
          transactionType={selectedTransactionType}
        />
      )}
    </div>
  );
};

export default ClientSavingsPage;