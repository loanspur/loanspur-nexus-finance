import { useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, RefreshCw, Activity } from "lucide-react";
import { useComprehensiveTransactions, type ComprehensiveTransaction } from "@/hooks/useComprehensiveTransactions";
import { useCurrency } from "@/contexts/CurrencyContext";

export const ComprehensiveTransactionsTable = () => {
  const [filters, setFilters] = useState({
    dateFrom: "",
    dateTo: "",
    transactionType: "all",
    searchTerm: "",
  });

  const { data: transactions, isLoading, refetch } = useComprehensiveTransactions(filters);
  const { formatAmount } = useCurrency();

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      completed: { label: "Completed", variant: "default" as const },
      pending: { label: "Pending", variant: "secondary" as const },
      failed: { label: "Failed", variant: "destructive" as const },
      reversed: { label: "Reversed", variant: "outline" as const },
      posted: { label: "Posted", variant: "default" as const },
      draft: { label: "Draft", variant: "secondary" as const },
    };
    const config = statusConfig[status as keyof typeof statusConfig] || 
                   { label: status, variant: "secondary" as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getTransactionTypeBadge = (type: string, sourceTable: string) => {
    const typeColors = {
      "Loan Payment": "bg-green-100 text-green-800",
      "Savings deposit": "bg-blue-100 text-blue-800",
      "Savings withdrawal": "bg-red-100 text-red-800",
      "TRANSFER": "bg-purple-100 text-purple-800",
      "Journal Entry": "bg-yellow-100 text-yellow-800",
    };
    
    const colorClass = typeColors[type as keyof typeof typeColors] || "bg-gray-100 text-gray-800";
    return (
      <div className="flex flex-col gap-1">
        <Badge className={colorClass}>{type}</Badge>
        <span className="text-xs text-muted-foreground">{sourceTable}</span>
      </div>
    );
  };

  const formatTransactionDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Loading all transactions...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              <CardTitle>All Transactions (Real-time)</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{transactions?.length || 0} transactions</Badge>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search transactions..."
                value={filters.searchTerm}
                onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
                className="pl-10"
              />
            </div>
            
            <Input
              type="date"
              placeholder="From Date"
              value={filters.dateFrom}
              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
            />
            
            <Input
              type="date"
              placeholder="To Date"
              value={filters.dateTo}
              onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
            />
            
            <Select value={filters.transactionType} onValueChange={(value) => setFilters({ ...filters, transactionType: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Transaction Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="loan">Loan Payments</SelectItem>
                <SelectItem value="savings">Savings Transactions</SelectItem>
                <SelectItem value="transfer">Transfers</SelectItem>
                <SelectItem value="journal">Journal Entries</SelectItem>
              </SelectContent>
            </Select>
            
            <Button 
              variant="outline"
              onClick={() => setFilters({ dateFrom: "", dateTo: "", transactionType: "all", searchTerm: "" })}
              className="col-span-2"
            >
              <Filter className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
          </div>

          {/* Real-time indicator */}
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 text-green-700">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">Real-time updates enabled</span>
              <span className="text-xs text-green-600">
                Automatically refreshing when new transactions are posted
              </span>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Account/Reference</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions?.map((transaction) => (
                  <TableRow key={`${transaction.source_table}-${transaction.id}`}>
                    <TableCell className="font-medium">
                      {formatTransactionDate(transaction.transaction_date)}
                    </TableCell>
                    <TableCell>
                      {getTransactionTypeBadge(transaction.transaction_type, transaction.source_table)}
                    </TableCell>
                    <TableCell className="max-w-xs truncate" title={transaction.description}>
                      {transaction.description}
                    </TableCell>
                    <TableCell>{transaction.client_name || "-"}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {transaction.account_info || transaction.reference_number || "-"}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatAmount(transaction.amount)}
                    </TableCell>
                    <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                  </TableRow>
                ))}
                {(!transactions || transactions.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No transactions found. Start by processing loan payments or savings transactions.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};