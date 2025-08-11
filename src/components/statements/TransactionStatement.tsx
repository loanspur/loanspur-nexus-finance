import { useState, useEffect } from "react";
import { format } from "date-fns";
import jsPDF from "jspdf";
import "jspdf-autotable";
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
  showSummary?: boolean;
}

export const TransactionStatement = ({
  accountId,
  accountType,
  accountNumber,
  clientName,
  accountDetails,
  statementPeriod,
  showSummary = true,
}: TransactionStatementProps) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState<{ from: string; to: string }>(() => (
    statementPeriod || {
      from: format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
      to: format(new Date(), 'yyyy-MM-dd'),
    }
  ));
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
      const dateField = accountType === 'savings' ? 'transaction_date' : 'payment_date';
      let query = accountType === 'savings'
        ? supabase
            .from('savings_transactions')
            .select('*')
            .eq('savings_account_id', accountId)
        : supabase
            .from('loan_payments')
            .select('*')
            .eq('loan_id', accountId);

      if (period?.from) query = query.gte(dateField, period.from);
      if (period?.to) query = query.lte(dateField, period.to);

      query = query
        .order(dateField, { ascending: false })
        .order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;

      const toNumber = (v: any) => {
        const n = Number(v);
        return Number.isFinite(n) ? n : 0;
      };

      // Normalize rows from different sources
      const baseTransactions: Transaction[] = (data || []).map((item: any) => {
        const isSavings = accountType === 'savings';
        const amount = isSavings
          ? toNumber(item.amount ?? item.transaction_amount)
          : toNumber(item.payment_amount ?? item.amount);
        return {
          date: isSavings ? item.transaction_date : item.payment_date,
          type: isSavings ? (item.transaction_type || 'transaction') : 'payment',
          amount,
          // For savings we prefer the persisted running balance; for loans we'll compute below
          balance: isSavings ? toNumber(item.balance_after ?? item.running_balance) : 0,
          method: item.method || item.payment_method || 'N/A',
          reference: item.reference_number || `${isSavings ? 'TXN' : 'PMT'}-${String(item.id).slice(-8)}`,
          description: item.description || '',
          status: item.status || 'completed'
        } as Transaction;
      });

      let finalTransactions: Transaction[] = baseTransactions;

      // Compute running balance for loans based on current outstanding passed via accountDetails.balance
      if (accountType === 'loan') {
        const currentOutstanding = toNumber(accountDetails?.balance);
        let cumulative = 0; // cumulative sum of more recent payments
        finalTransactions = baseTransactions.map((t) => {
          const bal = currentOutstanding + cumulative;
          cumulative += toNumber(t.amount);
          return { ...t, balance: bal };
        });
      }

      setTransactions(finalTransactions);
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
  }, [accountId, accountType, period.from, period.to]);

  // Realtime updates: refresh on new transactions
  useEffect(() => {
    if (!accountId) return;
    const table = accountType === 'savings' ? 'savings_transactions' : 'loan_payments';
    const filter = accountType === 'savings' 
      ? `savings_account_id=eq.${accountId}` 
      : `loan_id=eq.${accountId}`;

    const channel = supabase
      .channel(`tx-statement-${accountType}-${accountId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table, filter }, () => {
        fetchTransactions();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [accountId, accountType]);

  const handleRefresh = () => {
    fetchTransactions();
  };

  const handleDownload = () => {
    const doc = new jsPDF();
    const title = `${accountType === 'savings' ? 'SAVINGS' : 'LOAN'} STATEMENT`;
    doc.setFontSize(18);
    doc.text(title, 105, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Account: ${accountNumber}`, 20, 30);
    doc.text(`Client: ${clientName}`, 20, 36);
    doc.text(`Period: ${formatDate(period.from)} - ${formatDate(period.to)}`, 20, 42);

    const rows = transactions.map((t) => [
      formatDate(t.date),
      t.type,
      t.method || '-',
      formatCurrency(t.amount),
      formatCurrency(t.balance),
      t.reference,
    ]);

    (doc as any).autoTable({
      startY: 50,
      head: [['Date', 'Type', 'Method', 'Amount', 'Balance', 'Reference']],
      body: rows,
      theme: 'grid',
      styles: { fontSize: 9 },
    });

    doc.save(`${accountType}-statement-${accountNumber}-${period.from}-to-${period.to}.pdf`);
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
      case "fee":
      case "fees":
      case "charge":
      case "fee_charge":
      case "account_charge":
      case "penalty":
        return "text-red-600";
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
    .filter(t => ["withdrawal", "payment", "transfer", "fee", "fees", "charge", "fee_charge", "account_charge", "penalty"].includes(t.type.toLowerCase()))
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
                Account: {accountNumber} | Period: {formatDate(period.from)} - {formatDate(period.to)}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={period.from}
                onChange={(e) => setPeriod((p) => ({ ...p, from: e.target.value }))}
                className="h-9 rounded-md border px-2 text-sm bg-background"
              />
              <span className="text-muted-foreground text-sm">to</span>
              <input
                type="date"
                value={period.to}
                onChange={(e) => setPeriod((p) => ({ ...p, to: e.target.value }))}
                className="h-9 rounded-md border px-2 text-sm bg-background"
              />
              <Button variant="outline" size="sm" onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Apply
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownload}>
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
              <div className="font-medium">{formatDate(period.from)} - {formatDate(period.to)}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Total Transactions</span>
              <div className="font-medium">{totalTransactions}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transaction Summary */}
      {showSummary && (
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
                  {transactions.filter(t => ["withdrawal", "payment", "transfer", "fee", "fees", "charge", "fee_charge", "account_charge", "penalty"].includes(t.type.toLowerCase())).length} transactions
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
      )}

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
                        {["withdrawal", "payment", "transfer", "fee", "fees", "charge", "fee_charge", "account_charge", "penalty"].includes(transaction.type.toLowerCase()) ? '-' : '+'}
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