import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Transaction {
  date: string;
  type: string;
  amount: number;
  balance: number;
  method?: string;
  reference: string;
  description?: string;
  status?: string;
}

interface TransactionStatementProps {
  accountId: string;
  accountType: "loan" | "savings";
  accountNumber: string;
  clientName: string;
  accountDetails: {
    balance: number;
    interestRate?: number;
    openingDate?: string;
    accountOfficer?: string;
  };
  statementPeriod?: {
    from: string;
    to: string;
  };
}

export const TransactionStatement = ({
  accountId,
  accountType,
  accountNumber,
  clientName,
  accountDetails,
  statementPeriod
}: TransactionStatementProps) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
    }).format(amount);
  };

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      let query;
      
      if (accountType === 'savings') {
        query = supabase
          .from('savings_transactions')
          .select('*')
          .eq('savings_account_id', accountId)
          .order('transaction_date', { ascending: false })
          .order('created_at', { ascending: false });
      } else {
        // For loans, we'll fetch loan payments
        query = supabase
          .from('loan_payments')
          .select('*')
          .eq('loan_id', accountId)
          .order('payment_date', { ascending: false })
          .order('created_at', { ascending: false });
      }

      const { data, error } = await query;

      if (error) throw error;

      // Transform the data to match our Transaction interface
      const transformedTransactions: Transaction[] = (data || []).map((item: any) => ({
        date: accountType === 'savings' ? item.transaction_date : item.payment_date,
        type: accountType === 'savings' ? item.transaction_type : 'payment',
        amount: parseFloat(item.amount),
        balance: accountType === 'savings' ? parseFloat(item.balance_after) : 0,
        method: item.payment_method || 'N/A',
        reference: item.reference_number || `${accountType === 'savings' ? 'TXN' : 'PMT'}-${item.id.slice(-8)}`,
        description: item.description || '',
        status: item.status || 'completed'
      }));

      setTransactions(transformedTransactions);
    } catch (error: any) {
      console.error('Error fetching transactions:', error);
      toast({
        title: "Error",
        description: "Failed to load transaction history",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (accountId) {
      fetchTransactions();
    }
  }, [accountId, accountType]);

  const handleRefresh = () => {
    fetchTransactions();
  };

  const defaultStatementPeriod = statementPeriod || {
    from: format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'), // 30 days ago
    to: format(new Date(), 'yyyy-MM-dd') // today
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "MMM dd, yyyy");
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
      case "success":
        return "default";
      case "pending":
        return "secondary";
      case "failed":
      case "cancelled":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const getTransactionTypeColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case "deposit":
        return "text-green-600";
      case "withdrawal":
        return "text-red-600";
      case "transfer":
        return "text-blue-600";
      case "payment":
        return "text-orange-600";
      default:
        return "text-muted-foreground";
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Loading transactions...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalDebits = transactions
    .filter(t => ["withdrawal", "payment", "transfer"].includes(t.type.toLowerCase()))
    .reduce((sum, t) => sum + t.amount, 0);

  const totalCredits = transactions
    .filter(t => ["deposit"].includes(t.type.toLowerCase()))
    .reduce((sum, t) => sum + t.amount, 0);

  const totalTransactions = transactions.length;

  return (
    <div className="w-full space-y-6">
      {/* Statement Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {accountType === 'savings' ? 'Savings' : 'Loan'} Account Statement
              </CardTitle>
              <CardDescription>
                Account: {accountNumber} | Period: {formatDate(defaultStatementPeriod.from)} - {formatDate(defaultStatementPeriod.to)}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Account Information */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Account Holder</span>
              <div className="font-medium">{clientName}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Current Balance</span>
              <div className="font-bold text-green-600">{formatCurrency(accountDetails.balance)}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Statement Period</span>
              <div className="font-medium">{formatDate(defaultStatementPeriod.from)} - {formatDate(defaultStatementPeriod.to)}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Total Transactions</span>
              <div className="font-medium">{totalTransactions}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transaction Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-6 text-center">
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Total Credits</div>
              <div className="text-2xl font-bold text-green-600">
                +{formatCurrency(totalCredits)}
              </div>
              <div className="text-xs text-muted-foreground">
                {transactions.filter(t => ["deposit"].includes(t.type.toLowerCase())).length} transactions
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Total Debits</div>
              <div className="text-2xl font-bold text-red-600">
                -{formatCurrency(totalDebits)}
              </div>
              <div className="text-xs text-muted-foreground">
                {transactions.filter(t => ["withdrawal", "payment", "transfer"].includes(t.type.toLowerCase())).length} transactions
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Net Movement</div>
              <div className={`text-2xl font-bold ${(totalCredits - totalDebits) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {(totalCredits - totalDebits) >= 0 ? '+' : ''}{formatCurrency(totalCredits - totalDebits)}
              </div>
              <div className="text-xs text-muted-foreground">
                This period
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transaction Details */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>
            Detailed view of all transactions for this account
          </CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <div className="text-lg font-medium text-muted-foreground mb-2">
                No transactions found
              </div>
              <div className="text-sm text-muted-foreground">
                No transactions were recorded for the selected period
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction, index) => (
                  <TableRow key={index} className="hover:bg-muted/50">
                    <TableCell className="font-medium">
                      {formatDate(transaction.date)}
                    </TableCell>
                    <TableCell>
                      <span className={`capitalize ${getTransactionTypeColor(transaction.type)}`}>
                        {transaction.type}
                      </span>
                    </TableCell>
                    <TableCell>
                      {transaction.description || '-'}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {transaction.reference}
                    </TableCell>
                    <TableCell className="text-sm">
                      {transaction.method || '-'}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      <span className={getTransactionTypeColor(transaction.type)}>
                        {["withdrawal", "payment", "transfer"].includes(transaction.type.toLowerCase()) ? '-' : '+'}
                        {formatCurrency(transaction.amount)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      {formatCurrency(transaction.balance)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(transaction.status || 'completed')}>
                        {transaction.status || 'completed'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};