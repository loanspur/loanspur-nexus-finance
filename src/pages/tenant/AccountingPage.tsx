import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Calculator, 
  BookOpen, 
  DollarSign, 
  TrendingUp, 
  FileText, 
  Calendar,
  PieChart,
  Settings,
  RefreshCw,
  Activity
} from "lucide-react";
import { JournalEntriesTable } from "@/components/accounting/JournalEntriesTable";
import { ChartOfAccountsTable } from "@/components/accounting/ChartOfAccountsTable";
import { AccountBalancesTable } from "@/components/accounting/AccountBalancesTable";
import { FinancialActivityMappingsTable } from "@/components/accounting/FinancialActivityMappingsTable";
import { ReconciliationManagement } from "@/components/accounting/ReconciliationManagement";
import { ComprehensiveTransactionsTable } from "@/components/accounting/ComprehensiveTransactionsTable";

import { useAuth } from "@/hooks/useAuth";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useAccountingMetrics } from "@/hooks/useAccountingMetrics";

const AccountingPage = () => {
  const { profile } = useAuth();
  const { formatAmount } = useCurrency();
  const [activeTab, setActiveTab] = useState("all-transactions"); // Set default to all-transactions
  const { data: metrics } = useAccountingMetrics();

  if (!profile || profile.role === 'client') {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Access denied. This page is for admin users only.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Accounting Module</h1>
        <p className="text-muted-foreground">Manage your organization's financial records and accounting operations</p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Journal Entries</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.journalEntriesThisMonth ?? 0}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chart of Accounts</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.activeAccounts ?? 0}</div>
            <p className="text-xs text-muted-foreground">Active accounts</p>
          </CardContent>
        </Card>
        
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activity Mappings</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.activityMappings ?? 0}</div>
            <p className="text-xs text-muted-foreground">Defined</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Posted Entries</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.postedEntriesThisMonth ?? 0}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Draft Entries</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.draftEntriesThisMonth ?? 0}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Income YTD</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatAmount(metrics?.netIncomeYTD ?? 0)}</div>
            <p className="text-xs text-muted-foreground">Since Jan 1</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="all-transactions" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            All Transactions
          </TabsTrigger>
          <TabsTrigger value="journal-entries" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Journal Entries
          </TabsTrigger>
          <TabsTrigger value="chart-of-accounts" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Chart of Accounts
          </TabsTrigger>
          <TabsTrigger value="account-balances" className="flex items-center gap-2">
            <PieChart className="h-4 w-4" />
            Account Balances
          </TabsTrigger>
          <TabsTrigger value="activity-mappings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Activity Mappings
          </TabsTrigger>
          <TabsTrigger value="reconciliation" className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Reconciliation
          </TabsTrigger>
          <TabsTrigger value="closing-entries" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Closing Entries
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all-transactions" className="space-y-4">
          <ComprehensiveTransactionsTable />
        </TabsContent>

        <TabsContent value="journal-entries" className="space-y-4">
          <JournalEntriesTable />
        </TabsContent>

        <TabsContent value="chart-of-accounts" className="space-y-4">
          <ChartOfAccountsTable />
        </TabsContent>

        <TabsContent value="account-balances" className="space-y-4">
          <AccountBalancesTable />
        </TabsContent>

        <TabsContent value="activity-mappings" className="space-y-4">
          <FinancialActivityMappingsTable />
        </TabsContent>

        <TabsContent value="reconciliation" className="space-y-4">
          <ReconciliationManagement />
        </TabsContent>

        <TabsContent value="closing-entries" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Closing Entries</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Closing entries management coming soon...
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AccountingPage;