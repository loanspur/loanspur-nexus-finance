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
  Settings
} from "lucide-react";
import { JournalEntriesTable } from "@/components/accounting/JournalEntriesTable";
import { ChartOfAccountsTable } from "@/components/accounting/ChartOfAccountsTable";
import { AccountBalancesTable } from "@/components/accounting/AccountBalancesTable";
import { useAuth } from "@/hooks/useAuth";

const AccountingPage = () => {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState("journal-entries");

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Journal Entries</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chart of Accounts</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Active accounts</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Accruals</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Provisions</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Active</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-7">
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
          <TabsTrigger value="accruals" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Accruals
          </TabsTrigger>
          <TabsTrigger value="provisions" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Provisions
          </TabsTrigger>
          <TabsTrigger value="closing-entries" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Closing Entries
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Reports
          </TabsTrigger>
        </TabsList>

        <TabsContent value="journal-entries" className="space-y-4">
          <JournalEntriesTable />
        </TabsContent>

        <TabsContent value="chart-of-accounts" className="space-y-4">
          <ChartOfAccountsTable />
        </TabsContent>

        <TabsContent value="account-balances" className="space-y-4">
          <AccountBalancesTable />
        </TabsContent>

        <TabsContent value="accruals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Accruals Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Accruals management coming soon...
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="provisions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Provisions Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Provisions management coming soon...
              </div>
            </CardContent>
          </Card>
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

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Accounting Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Financial reports coming soon...
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AccountingPage;