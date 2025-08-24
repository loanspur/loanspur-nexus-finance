import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChartOfAccounts, JournalEntry, TrialBalance } from '@/types/accounting';

export function AccountingDashboard() {
  const [accounts, setAccounts] = useState<ChartOfAccounts[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [trialBalance, setTrialBalance] = useState<TrialBalance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAccountingData();
  }, []);

  const loadAccountingData = async () => {
    try {
      setLoading(true);
      // TODO: Implement API calls to load accounting data
      
      // Mock data for demonstration
      const mockAccounts: ChartOfAccounts[] = [
        {
          id: '1',
          tenant_id: 'tenant-1',
          account_code: '1000',
          account_name: 'Cash and Cash Equivalents',
          account_type: 'asset',
          account_category: 'Current Assets',
          opening_balance: 1000000,
          current_balance: 1250000,
          currency_code: 'KES',
          is_active: true,
          is_system_account: false,
          allow_manual_entries: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: '2',
          tenant_id: 'tenant-1',
          account_code: '2000',
          account_name: 'Loan Portfolio',
          account_type: 'asset',
          account_category: 'Current Assets',
          opening_balance: 5000000,
          current_balance: 5500000,
          currency_code: 'KES',
          is_active: true,
          is_system_account: false,
          allow_manual_entries: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      ];
      
      setAccounts(mockAccounts);
    } catch (error) {
      console.error('Failed to load accounting data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAccountTypeBadge = (type: string) => {
    const variants = {
      asset: 'default',
      liability: 'destructive',
      equity: 'secondary',
      income: 'outline',
      expense: 'outline',
    };
    return <Badge variant={variants[type as keyof typeof variants]}>{type}</Badge>;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
    }).format(amount);
  };

  if (loading) {
    return <div>Loading accounting data...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Accounting Dashboard</h2>
        <div className="space-x-2">
          <Button variant="outline">New Journal Entry</Button>
          <Button>Generate Reports</Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(6750000)}</div>
            <p className="text-xs text-muted-foreground">+12% from last month</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Liabilities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(4500000)}</div>
            <p className="text-xs text-muted-foreground">+8% from last month</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Income</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(2250000)}</div>
            <p className="text-xs text-muted-foreground">+15% from last month</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Accounts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{accounts.length}</div>
            <p className="text-xs text-muted-foreground">Chart of accounts</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="accounts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="accounts">Chart of Accounts</TabsTrigger>
          <TabsTrigger value="journal">Journal Entries</TabsTrigger>
          <TabsTrigger value="trial-balance">Trial Balance</TabsTrigger>
        </TabsList>

        <TabsContent value="accounts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Chart of Accounts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {accounts.map((account) => (
                  <div key={account.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div>
                        <p className="font-medium">{account.account_name}</p>
                        <p className="text-sm text-muted-foreground">Code: {account.account_code}</p>
                      </div>
                      {getAccountTypeBadge(account.account_type)}
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(account.current_balance)}</p>
                      <p className="text-sm text-muted-foreground">{account.account_category}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}