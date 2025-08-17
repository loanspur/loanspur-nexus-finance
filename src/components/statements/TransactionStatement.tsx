import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, RefreshCw, Eye, Info, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { generateLoanStatement, generateSavingsStatement } from "@/lib/statement-generator";
import { TransactionDetailsDialog } from "./TransactionDetailsDialog";
import { LoanRepaymentUndoDialog } from "@/components/forms/LoanRepaymentUndoDialog";

interface Transaction {
  date: string;
  type: string;
  amount: number;
  balance: number;
  method?: string;
  reference: string;
  description?: string;
  status?: string;
  // Payment breakdown for loan transactions
  principalAmount?: number;
  interestAmount?: number;
  feeAmount?: number;
  penaltyAmount?: number;
  paymentId?: string;
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
    // Loan-specific fields
    principal?: number;
    outstanding?: number;
    principalPaid?: number;
    interestPaid?: number;
    feesPaid?: number;
    totalPayments?: number;
    maturityDate?: string;
    monthlyPayment?: number;
    paymentFrequency?: string;
    unpaidPrincipal?: number;
    unpaidInterest?: number;
    unpaidFees?: number;
  };
  statementPeriod?: {
    from?: string;
    to?: string;
    days?: number; // Alternative to from/to - show last N days
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
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [selectedPaymentForUndo, setSelectedPaymentForUndo] = useState<any>(null);
  const [loanTotals, setLoanTotals] = useState({
    totalPrincipalPaid: 0,
    totalInterestPaid: 0,
    totalFeesPaid: 0,
    totalPenaltiesPaid: 0
  });
  const [period, setPeriod] = useState<{ from: string; to: string }>(() => {
    const endDate = new Date();
    const startDate = new Date();
    
    // Handle different period specifications
    if (statementPeriod?.days) {
      startDate.setDate(endDate.getDate() - statementPeriod.days);
    } else {
      startDate.setMonth(endDate.getMonth() - 3); // Default to last 3 months
    }
    
    return {
      from: statementPeriod?.from || format(startDate, 'yyyy-MM-dd'),
      to: statementPeriod?.to || format(endDate, 'yyyy-MM-dd'),
    };
  });
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
      if (accountType === 'savings') {
        // Savings transactions logic remains the same
        let query = supabase
          .from('savings_transactions')
          .select('*')
          .eq('savings_account_id', accountId);

        if (period?.from) query = query.gte('transaction_date', period.from);
        if (period?.to) query = query.lte('transaction_date', period.to);

        query = query
          .order('transaction_date', { ascending: false })
          .order('created_at', { ascending: false });

        const { data, error } = await query;
        if (error) throw error;

        const transformedTransactions: Transaction[] = (data || []).map((item: any) => ({
          date: item.transaction_date,
          type: item.transaction_type,
          amount: parseFloat(item.amount) || 0,
          balance: parseFloat(item.balance_after) || 0,
          method: item.method || 'N/A',
          reference: item.reference_number || `TXN-${String(item.id).slice(-8)}`,
          description: item.description || '',
          status: item.status || 'completed'
        }));

        setTransactions(transformedTransactions);
      } else {
        // Loan transactions - fetch comprehensive loan transaction data
        const [
          { data: loanData, error: loanError },
          { data: loanPaymentsData, error: loanPaymentsError },
          { data: allLoanPaymentsData, error: allLoanPaymentsError }
        ] = await Promise.all([
          // Get loan basic info for disbursement
          supabase
            .from('loans')
            .select('*, loan_products(name)')
            .eq('id', accountId)
            .single(),
          
          // Get loan payments for the period from loan_payments table
          supabase
            .from('loan_payments')
            .select('*')
            .eq('loan_id', accountId)
            .gte('payment_date', period.from)
            .lte('payment_date', period.to)
            .order('payment_date', { ascending: true }),

          // Get all loan payments to calculate total paid amounts
          supabase
            .from('loan_payments')
            .select('*')
            .eq('loan_id', accountId)
            .order('payment_date', { ascending: true })
        ]);

        if (loanError) throw loanError;
        if (loanPaymentsError) throw loanPaymentsError;
        if (allLoanPaymentsError) throw allLoanPaymentsError;
        
        const allTransactions: Transaction[] = [];
        
        // Calculate total outstanding balance (principal + interest + fees + penalties)
        const principal = parseFloat(String(loanData?.principal_amount)) || 0;
        const totalPrincipalPaid = (allLoanPaymentsData || []).reduce((sum: number, p: any) => {
          return sum + (parseFloat(p.principal_amount) || 0);
        }, 0);
        const totalInterestPaid = (allLoanPaymentsData || []).reduce((sum: number, p: any) => {
          return sum + (parseFloat(p.interest_amount) || 0);
        }, 0);
        const totalFeesPaid = (allLoanPaymentsData || []).reduce((sum: number, p: any) => {
          return sum + (parseFloat(p.fee_amount) || 0);
        }, 0);
        const totalPenaltiesPaid = (allLoanPaymentsData || []).reduce((sum: number, p: any) => {
          return sum + (parseFloat(p.penalty_amount) || 0);
        }, 0);

        // Update loan totals state
        setLoanTotals({
          totalPrincipalPaid,
          totalInterestPaid,
          totalFeesPaid,
          totalPenaltiesPaid
        });

        // Calculate outstanding balances - use current loan balance from accountDetails
        const outstandingPrincipal = principal - totalPrincipalPaid;
        
        // Use the actual balance from the loan account details as the total outstanding
        let runningBalance = accountDetails.balance || (principal - totalPrincipalPaid);

        // Add disbursement as first transaction
        if (loanData) {
          allTransactions.push({
            date: loanData.disbursement_date || loanData.created_at,
            type: 'Disbursement',
            amount: parseFloat(String(loanData.principal_amount)) || 0,
            balance: runningBalance,
            method: 'Bank Transfer',
            reference: `DISB-${loanData.loan_number || String(loanData.id).slice(-6)}`,
            description: `Loan disbursement - ${loanData.loan_products?.name || 'Loan'}`,
            status: 'completed'
          });
        }

        // Add payments with proper distribution
        if (loanPaymentsData && loanPaymentsData.length > 0) {
          loanPaymentsData.forEach((payment: any) => {
            const paymentAmount = parseFloat(payment.payment_amount) || 0;
            runningBalance -= paymentAmount;
            
            // Get payment breakdown from loan_payments table
            const principalPaid = parseFloat(payment.principal_amount) || 0;
            const interestPaid = parseFloat(payment.interest_amount) || 0;
            const feesPaid = parseFloat(payment.fee_amount) || 0;
            const penaltiesPaid = parseFloat(payment.penalty_amount) || 0;
            
            allTransactions.push({
              date: payment.payment_date,
              type: 'Payment',
              amount: paymentAmount,
              balance: Math.max(0, runningBalance), // Ensure balance doesn't go negative
              method: payment.payment_method || 'Cash',
              reference: payment.reference_number || `PMT-${String(payment.id).slice(-6)}`,
              description: `Loan repayment - ${formatCurrency(paymentAmount)}`,
              status: 'completed',
              // Store breakdown for detailed view
              principalAmount: principalPaid,
              interestAmount: interestPaid,
              feeAmount: feesPaid,
              penaltyAmount: penaltiesPaid,
              paymentId: payment.id
            });
          });
        }

        // Sort by date descending for display
        allTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setTransactions(allTransactions);
      }
    } catch (error: any) {
      console.error('Error fetching transactions:', error);
      toast({
        title: "Error",
        description: "Failed to load transaction history",
        variant: "destructive"
      });
      setTransactions([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (accountId) {
      fetchTransactions();
    }
  }, [accountId, accountType, period.from, period.to]);

  // Real-time updates for loan transactions
  useEffect(() => {
    if (!accountId || accountType !== 'loan') return;

    const channel = supabase
      .channel('loan-transactions')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'loan_payments',
          filter: `loan_id=eq.${accountId}`
        },
        () => {
          console.log('Loan payment updated, refreshing...');
          fetchTransactions();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'loan_payments',
          filter: `loan_id=eq.${accountId}`
        },
        () => {
          console.log('Loan payment updated, refreshing...');
          fetchTransactions();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'loans',
          filter: `id=eq.${accountId}`
        },
        () => {
          console.log('Loan updated, refreshing...');
          fetchTransactions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [accountId, accountType]);

  const handleRefresh = () => {
    fetchTransactions();
  };

  const handleDownload = () => {
    try {
      // Calculate totals for statement generation
      const totalDebits = transactions
        .filter(t => ["withdrawal", "payment", "transfer", "fee", "fees", "charge", "fee_charge", "account_charge", "penalty"].includes(t.type.toLowerCase()))
        .reduce((sum, t) => sum + t.amount, 0);

      const totalCredits = transactions
        .filter(t => ["deposit", "disbursement"].includes(t.type.toLowerCase()))
        .reduce((sum, t) => sum + t.amount, 0);

      if (accountType === 'loan') {
        // Generate comprehensive loan statement
        const loanData = {
          id: accountId,
          amount: accountDetails.principal || 0,
          outstanding: accountDetails.outstanding || accountDetails.balance,
          type: 'Loan Account',
          loan_number: accountNumber,
        };

        const loanDetails = {
          disbursementDate: accountDetails.openingDate || new Date().toISOString(),
          maturityDate: accountDetails.maturityDate || new Date().toISOString(),
          interestRate: accountDetails.interestRate || 0,
          monthlyPayment: accountDetails.monthlyPayment || 0,
          totalPayments: accountDetails.totalPayments || 0,
          principalPaid: accountDetails.principalPaid || 0,
          interestPaid: accountDetails.interestPaid || 0,
        };

        const paymentHistory = transactions.map(t => ({
          date: t.date,
          type: t.type,
          amount: t.amount,
          status: t.status || 'completed',
          balance: t.balance,
        }));

        generateLoanStatement({
          loan: loanData,
          clientName,
          paymentHistory,
          loanDetails,
        });
      } else {
        // Generate savings statement
        const savingsData = {
          id: accountId,
          balance: accountDetails.balance,
          type: 'Savings Account',
          interestRate: accountDetails.interestRate || 0,
        };

        const savingsDetails = {
          openingDate: accountDetails.openingDate || new Date().toISOString(),
          totalDeposits: totalCredits,
          totalWithdrawals: totalDebits,
          interestEarned: 0,
          averageBalance: accountDetails.balance,
          numberOfTransactions: transactions.length,
        };

        const transactionHistory = transactions.map(t => ({
          date: t.date,
          type: t.type,
          method: t.method || 'N/A',
          amount: t.amount,
          balance: t.balance,
          reference: t.reference,
        }));

        generateSavingsStatement({
          savings: savingsData,
          clientName,
          transactionHistory,
          savingsDetails,
        });
      }

      toast({
        title: "Statement Generated",
        description: "Your statement has been downloaded successfully",
      });
    } catch (error) {
      console.error('Error generating statement:', error);
      toast({
        title: "Error",
        description: "Failed to generate statement",
        variant: "destructive"
      });
    }
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
              <span className="text-muted-foreground">
                {accountType === 'loan' ? 'Outstanding Balance' : 'Current Balance'}
              </span>
              <div className={`font-bold ${accountType === 'loan' ? 'text-red-600' : 'text-green-600'}`}>
                {formatCurrency(accountDetails.balance)}
              </div>
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

          {/* Loan-specific information */}
          {accountType === 'loan' && accountDetails.principal && (
            <div className="mt-4 p-4 bg-muted/30 rounded-lg">
              <h4 className="font-semibold mb-3">Loan Summary</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Original Amount</span>
                  <div className="font-medium">{formatCurrency(accountDetails.principal)}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Principal Paid</span>
                  <div className="font-medium text-green-600">{formatCurrency(loanTotals.totalPrincipalPaid)}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Interest Paid</span>
                  <div className="font-medium">{formatCurrency(loanTotals.totalInterestPaid)}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Interest Rate</span>
                  <div className="font-medium">{accountDetails.interestRate || 0}% p.a.</div>
                </div>
                {accountDetails.monthlyPayment && (
                  <div>
                    <span className="text-muted-foreground">Monthly Payment</span>
                    <div className="font-medium">{formatCurrency(accountDetails.monthlyPayment)}</div>
                  </div>
                )}
                {accountDetails.totalPayments && (
                  <div>
                    <span className="text-muted-foreground">Total Payments Made</span>
                    <div className="font-medium">{accountDetails.totalPayments}</div>
                  </div>
                )}
                {accountDetails.maturityDate && (
                  <div>
                    <span className="text-muted-foreground">Maturity Date</span>
                    <div className="font-medium">{formatDate(accountDetails.maturityDate)}</div>
                  </div>
                )}
                {accountDetails.paymentFrequency && (
                  <div>
                    <span className="text-muted-foreground">Payment Frequency</span>
                    <div className="font-medium">{accountDetails.paymentFrequency}</div>
                  </div>
                )}
              </div>
            </div>
          )}
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
                   <TableHead className="w-24">Actions</TableHead>
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
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {(transaction.principalAmount !== undefined || 
                            transaction.interestAmount !== undefined || 
                            transaction.feeAmount !== undefined || 
                            transaction.penaltyAmount !== undefined) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedTransaction(transaction)}
                              className="h-8 w-8 p-0"
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                          {accountType === 'loan' && 
                           transaction.type === 'Payment' && 
                           transaction.paymentId &&
                           !transaction.method?.includes('_REVERSED') && 
                           transaction.status !== 'reversed' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={async () => {
                                // Fetch full payment details for undo dialog
                                try {
                                  const { data: paymentDetails, error } = await supabase
                                    .from('loan_payments')
                                    .select('*')
                                    .eq('id', transaction.paymentId)
                                    .single();
                                  
                                  if (error || !paymentDetails) {
                                    toast({
                                      title: "Error",
                                      description: "Could not load payment details",
                                      variant: "destructive"
                                    });
                                    return;
                                  }

                                  setSelectedPaymentForUndo(paymentDetails);
                                } catch (err) {
                                  toast({
                                    title: "Error", 
                                    description: "Failed to load payment details",
                                    variant: "destructive"
                                  });
                                }
                              }}
                              className="h-8 w-8 p-0 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                              title="Undo Payment"
                            >
                              <Undo2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                   </TableRow>
                 ))}
              </TableBody>
            </Table>
           )}
        </CardContent>
      </Card>

      {/* Transaction Details Dialog */}
      {selectedTransaction && (
        <TransactionDetailsDialog
          open={!!selectedTransaction}
          onOpenChange={(open) => !open && setSelectedTransaction(null)}
          transaction={selectedTransaction}
        />
      )}

      {/* Loan Repayment Undo Dialog */}
      {selectedPaymentForUndo && (
        <LoanRepaymentUndoDialog
          open={!!selectedPaymentForUndo}
          onOpenChange={(open) => !open && setSelectedPaymentForUndo(null)}
          payment={selectedPaymentForUndo}
          loanNumber={accountNumber}
        />
      )}
    </div>
  );
};