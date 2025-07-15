import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Search } from "lucide-react";
import { format } from "date-fns";
import { useAccountBalances, useCurrentAccountBalances } from "@/hooks/useAccountBalances";

export const AccountBalancesTable = () => {
  const [filters, setFilters] = useState({
    searchTerm: "",
    accountType: "all",
    balanceDate: ""
  });
  const [selectedDate, setSelectedDate] = useState<Date>();

  const { data: accountBalances, isLoading: balancesLoading } = useAccountBalances(filters.balanceDate);
  const { data: currentAccounts, isLoading: accountsLoading } = useCurrentAccountBalances();

  const filteredBalances = accountBalances?.filter((balance) => {
    const matchesSearch = 
      balance.chart_of_accounts.account_name.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
      balance.chart_of_accounts.account_code.toLowerCase().includes(filters.searchTerm.toLowerCase());
    const matchesType = filters.accountType === "all" || balance.chart_of_accounts.account_type === filters.accountType;

    return matchesSearch && matchesType;
  }) || [];

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    setFilters({ 
      ...filters, 
      balanceDate: date ? format(date, 'yyyy-MM-dd') : "" 
    });
  };

  const getAccountTypeBadge = (type: string) => {
    const typeColors = {
      asset: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
      liability: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
      equity: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
      income: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100",
      expense: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100",
    };
    const colorClass = typeColors[type as keyof typeof typeColors] || "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100";
    return <Badge className={colorClass}>{type.toUpperCase()}</Badge>;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getTotalsByType = () => {
    const totals = {
      assets: 0,
      liabilities: 0,
      equity: 0,
      income: 0,
      expenses: 0
    };

    filteredBalances.forEach(balance => {
      const type = balance.chart_of_accounts.account_type;
      switch (type) {
        case 'asset':
          totals.assets += balance.closing_balance;
          break;
        case 'liability':
          totals.liabilities += balance.closing_balance;
          break;
        case 'equity':
          totals.equity += balance.closing_balance;
          break;
        case 'income':
          totals.income += balance.closing_balance;
          break;
        case 'expense':
          totals.expenses += balance.closing_balance;
          break;
      }
    });

    return totals;
  };

  const totals = getTotalsByType();

  if (balancesLoading || accountsLoading) {
    return <div>Loading account balances...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Assets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totals.assets)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Liabilities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(totals.liabilities)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Equity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(totals.equity)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Income</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{formatCurrency(totals.income)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{formatCurrency(totals.expenses)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account Balances</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search accounts..."
                value={filters.searchTerm}
                onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
                className="pl-10"
              />
            </div>
            
            <Select value={filters.accountType} onValueChange={(value) => setFilters({ ...filters, accountType: value })}>
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="asset">Asset</SelectItem>
                <SelectItem value="liability">Liability</SelectItem>
                <SelectItem value="equity">Equity</SelectItem>
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
              </SelectContent>
            </Select>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PP") : "Select date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            
            <Button 
              variant="outline"
              onClick={() => {
                setFilters({ searchTerm: "", accountType: "all", balanceDate: "" });
                setSelectedDate(undefined);
              }}
            >
              Clear Filters
            </Button>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Account Code</TableHead>
                  <TableHead>Account Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Opening Balance</TableHead>
                  <TableHead className="text-right">Debits</TableHead>
                  <TableHead className="text-right">Credits</TableHead>
                  <TableHead className="text-right">Closing Balance</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBalances.length === 0 && !filters.balanceDate && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      {currentAccounts && currentAccounts.length > 0 ? (
                        <div>
                          <p>No account balances recorded yet.</p>
                          <p className="text-sm mt-2">Account balances will be automatically created when journal entries are posted.</p>
                        </div>
                      ) : (
                        "No accounts found. Create accounts in the Chart of Accounts tab first."
                      )}
                    </TableCell>
                  </TableRow>
                )}
                {filteredBalances.length === 0 && filters.balanceDate && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      No account balances found for the selected date.
                    </TableCell>
                  </TableRow>
                )}
                {filteredBalances.map((balance) => (
                  <TableRow key={balance.id}>
                    <TableCell className="font-medium">{balance.chart_of_accounts.account_code}</TableCell>
                    <TableCell>{balance.chart_of_accounts.account_name}</TableCell>
                    <TableCell>{getAccountTypeBadge(balance.chart_of_accounts.account_type)}</TableCell>
                    <TableCell className="capitalize">
                      {balance.chart_of_accounts.account_category.replace('_', ' ')}
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(balance.opening_balance)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(balance.period_debits)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(balance.period_credits)}</TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(balance.closing_balance)}
                    </TableCell>
                    <TableCell>{format(new Date(balance.balance_date), 'PP')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};