import { format } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  transactions: Transaction[];
  accountType: "loan" | "savings";
  accountNumber: string;
  clientName: string;
  accountDetails: {
    balance: number;
    interestRate?: number;
    openingDate?: string;
    accountOfficer?: string;
  };
  statementPeriod: {
    from: string;
    to: string;
  };
}

export const TransactionStatement = ({
  transactions,
  accountType,
  accountNumber,
  clientName,
  accountDetails,
  statementPeriod
}: TransactionStatementProps) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
    }).format(amount);
  };

  const formatDate = (dateValue: string) => {
    return format(new Date(dateValue), 'dd-MMM-yyyy');
  };

  const getTransactionTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'deposit':
      case 'disbursement':
        return 'text-green-600';
      case 'withdrawal':
      case 'payment':
        return 'text-red-600';
      case 'interest':
        return 'text-blue-600';
      case 'fee':
      case 'charge':
        return 'text-orange-600';
      default:
        return 'text-muted-foreground';
    }
  };

  const openingBalance = transactions.length > 0 ? 
    (transactions[transactions.length - 1].balance - transactions[transactions.length - 1].amount) : 
    accountDetails.balance;

  const closingBalance = transactions.length > 0 ? 
    transactions[0].balance : 
    accountDetails.balance;

  const totalCredits = transactions
    .filter(t => ['deposit', 'disbursement', 'interest'].includes(t.type.toLowerCase()))
    .reduce((sum, t) => sum + t.amount, 0);

  const totalDebits = transactions
    .filter(t => ['withdrawal', 'payment', 'fee', 'charge'].includes(t.type.toLowerCase()))
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <Card className="w-full">
      <CardHeader className="text-center bg-primary/5 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            <div>
              <CardTitle className="text-lg">
                {accountType === 'loan' ? 'Loan Account' : 'Savings Account'} Statement
              </CardTitle>
              <CardDescription className="text-xs">
                Account No: {accountNumber}
              </CardDescription>
            </div>
          </div>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Account Holder Information */}
        <div className="grid grid-cols-2 gap-6 text-sm">
          <div>
            <h4 className="font-semibold mb-2">Account Holder</h4>
            <div className="space-y-1">
              <div><strong>Name:</strong> {clientName}</div>
              <div><strong>Account Number:</strong> {accountNumber}</div>
              <div><strong>Account Type:</strong> {accountType === 'loan' ? 'Loan Account' : 'Savings Account'}</div>
              {accountDetails.accountOfficer && (
                <div><strong>Account Officer:</strong> {accountDetails.accountOfficer}</div>
              )}
            </div>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Statement Period</h4>
            <div className="space-y-1">
              <div><strong>From:</strong> {formatDate(statementPeriod.from)}</div>
              <div><strong>To:</strong> {formatDate(statementPeriod.to)}</div>
              <div><strong>Generated:</strong> {formatDate(new Date().toISOString())}</div>
              {accountDetails.interestRate && (
                <div><strong>Interest Rate:</strong> {accountDetails.interestRate}% p.a.</div>
              )}
            </div>
          </div>
        </div>

        <Separator />

        {/* Balance Summary */}
        <div className="bg-muted/30 p-4 rounded-lg">
          <h4 className="font-semibold mb-3">Balance Summary</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Opening Balance</span>
              <div className="font-bold text-lg">{formatCurrency(openingBalance)}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Total Credits</span>
              <div className="font-bold text-lg text-green-600">+{formatCurrency(totalCredits)}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Total Debits</span>
              <div className="font-bold text-lg text-red-600">-{formatCurrency(totalDebits)}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Closing Balance</span>
              <div className="font-bold text-lg text-primary">{formatCurrency(closingBalance)}</div>
            </div>
          </div>
        </div>

        {/* Transaction Details */}
        <div>
          <h4 className="font-semibold mb-3">Transaction Details</h4>
          {transactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No transactions found for the selected period
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">Date</TableHead>
                    <TableHead className="font-semibold">Description</TableHead>
                    <TableHead className="font-semibold">Reference</TableHead>
                    <TableHead className="font-semibold">Method</TableHead>
                    <TableHead className="font-semibold text-right">Debit</TableHead>
                    <TableHead className="font-semibold text-right">Credit</TableHead>
                    <TableHead className="font-semibold text-right">Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction, index) => {
                    const isCredit = ['deposit', 'disbursement', 'interest'].includes(transaction.type.toLowerCase());
                    const isDebit = ['withdrawal', 'payment', 'fee', 'charge'].includes(transaction.type.toLowerCase());
                    
                    return (
                      <TableRow key={index} className="hover:bg-muted/30">
                        <TableCell className="font-medium">
                          {formatDate(transaction.date)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className={getTransactionTypeColor(transaction.type)}>
                              {transaction.type}
                            </span>
                            {transaction.status && (
                              <Badge variant="outline" className="text-xs">
                                {transaction.status}
                              </Badge>
                            )}
                          </div>
                          {transaction.description && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {transaction.description}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {transaction.reference}
                        </TableCell>
                        <TableCell className="text-xs">
                          {transaction.method || '-'}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {isDebit ? (
                            <span className="text-red-600">
                              {formatCurrency(transaction.amount)}
                            </span>
                          ) : '-'}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {isCredit ? (
                            <span className="text-green-600">
                              {formatCurrency(transaction.amount)}
                            </span>
                          ) : '-'}
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          {formatCurrency(transaction.balance)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {/* Statement Footer */}
        <Separator />
        <div className="text-xs text-muted-foreground space-y-1">
          <div>This statement is computer generated and does not require a signature.</div>
          <div>For any queries regarding this statement, please contact your account officer.</div>
          <div className="font-medium">Generated on: {format(new Date(), 'dd-MMM-yyyy HH:mm:ss')}</div>
        </div>
      </CardContent>
    </Card>
  );
};