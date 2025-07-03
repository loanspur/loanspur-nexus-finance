import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { SavingsProductManagement } from "@/components/savings/SavingsProductManagement";
import { SavingsAccountForm } from "@/components/forms/SavingsAccountForm";
import { SavingsAccountDetailsDialog } from "@/components/savings/SavingsAccountDetailsDialog";
import { useSavingsAccounts, useSavingsProducts } from "@/hooks/useSupabase";
import { useAuth } from "@/hooks/useAuth";
import { PiggyBank, Search, Filter, Download, Plus, Settings, Eye } from "lucide-react";
import { format } from "date-fns";

const SavingsPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [accountFormOpen, setAccountFormOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  
  const { profile } = useAuth();
  const { data: savingsAccounts = [], isLoading: accountsLoading } = useSavingsAccounts();
  const { data: savingsProducts = [] } = useSavingsProducts();

  // Filter accounts based on search term and tenant
  const filteredAccounts = savingsAccounts.filter(account => {
    if (!profile?.tenant_id) return false;
    
    const matchesSearch = searchTerm === "" || 
      account.account_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (account.clients && 
        `${account.clients.first_name} ${account.clients.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesSearch;
  });

  // Calculate KPIs
  const totalAccounts = filteredAccounts.length;
  const activeAccounts = filteredAccounts.filter(acc => acc.is_active).length;
  const totalDeposits = filteredAccounts.reduce((sum, acc) => sum + acc.account_balance, 0);
  const totalInterestEarned = filteredAccounts.reduce((sum, acc) => sum + acc.interest_earned, 0);
  const averageBalance = totalAccounts > 0 ? totalDeposits / totalAccounts : 0;

  const handleViewAccount = (account: any) => {
    setSelectedAccount(account);
    setDetailsOpen(true);
  };

  if (accountsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2 text-muted-foreground">Loading savings accounts...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Savings Management</h1>
          <p className="text-muted-foreground">Monitor and manage savings accounts</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={accountFormOpen} onOpenChange={setAccountFormOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Open New Account
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <SavingsAccountForm 
                open={accountFormOpen} 
                onOpenChange={setAccountFormOpen} 
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="accounts" className="space-y-6">
        <TabsList>
          <TabsTrigger value="accounts" className="flex items-center gap-2">
            <PiggyBank className="w-4 h-4" />
            Accounts
          </TabsTrigger>
          <TabsTrigger value="products" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Products
          </TabsTrigger>
        </TabsList>

        <TabsContent value="accounts" className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="shadow-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <PiggyBank className="w-4 h-4" />
                  Total Accounts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{totalAccounts}</div>
                <p className="text-xs text-muted-foreground">
                  {activeAccounts} active accounts
                </p>
              </CardContent>
            </Card>
            
            <Card className="shadow-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Deposits</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">
                  {savingsProducts[0]?.currency_code || 'USD'} {totalDeposits.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">Total savings</p>
              </CardContent>
            </Card>
            
            <Card className="shadow-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Interest Earned</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-success">
                  {savingsProducts[0]?.currency_code || 'USD'} {totalInterestEarned.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">Total earned</p>
              </CardContent>
            </Card>
            
            <Card className="shadow-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Average Balance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">
                  {savingsProducts[0]?.currency_code || 'USD'} {averageBalance.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">Per account</p>
              </CardContent>
            </Card>
          </div>

          {/* Accounts Table */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PiggyBank className="w-5 h-5" />
                All Savings Accounts
              </CardTitle>
              <CardDescription>Complete overview of savings portfolio</CardDescription>
              <div className="flex gap-4">
                <div className="relative max-w-sm">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input 
                    placeholder="Search accounts..." 
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Button variant="outline" className="flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  Filter
                </Button>
                <Button variant="outline" className="flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {filteredAccounts.length === 0 ? (
                <div className="text-center py-8">
                  <PiggyBank className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No savings accounts found</p>
                  <p className="text-sm text-muted-foreground">Open your first savings account to get started</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredAccounts.map((account) => (
                    <div key={account.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex-1">
                        <div className="font-medium text-lg">
                          {account.clients ? 
                            `${account.clients.first_name} ${account.clients.last_name}` : 
                            'Unknown Client'
                          }
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Account: {account.account_number}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Product: {account.savings_products?.name || 'Unknown Product'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Opened: {format(new Date(account.opened_date), 'MMM dd, yyyy')}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            Balance: {account.savings_products?.currency_code || 'USD'} {account.account_balance.toLocaleString()}
                          </div>
                          <div className="text-sm font-medium">
                            Available: {account.savings_products?.currency_code || 'USD'} {account.available_balance.toLocaleString()}
                          </div>
                          <div className="text-xs text-success">
                            Interest: {account.savings_products?.currency_code || 'USD'} {account.interest_earned.toLocaleString()}
                          </div>
                        </div>
                        
                        <div>
                          <Badge 
                            variant={account.is_active ? 'default' : 'secondary'}
                          >
                            {account.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleViewAccount(account)}
                            className="flex items-center gap-1"
                          >
                            <Eye className="w-3 h-3" />
                            View
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            disabled={!account.is_active}
                            className="flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" />
                            Deposit
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products">
          <SavingsProductManagement />
        </TabsContent>
      </Tabs>

      {/* Account Details Dialog */}
      <SavingsAccountDetailsDialog
        account={selectedAccount}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
      />
    </div>
  );
};

export default SavingsPage;