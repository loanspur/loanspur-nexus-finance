import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Search, Filter, Download, Calendar as CalendarIcon, DollarSign, RefreshCw, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { PaymentForm } from "@/components/forms/PaymentForm";
import { PaymentAllocationForm } from "@/components/forms/PaymentAllocationForm";
import { PaymentReversalForm } from "@/components/forms/PaymentReversalForm";
import { FeeManagementForm } from "@/components/forms/FeeManagementForm";
import { useTransactions } from "@/hooks/useTransactions";

const TransactionsPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date } | undefined>();
  const [isPaymentFormOpen, setIsPaymentFormOpen] = useState(false);
  const [isAllocationFormOpen, setIsAllocationFormOpen] = useState(false);
  const [isReversalFormOpen, setIsReversalFormOpen] = useState(false);
  const [isFeeFormOpen, setIsFeeFormOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);

  const { data: transactions, isLoading } = useTransactions();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
      case 'failed':
        return 'bg-red-100 text-red-800 hover:bg-red-200';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'loan_repayment':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      case 'savings_deposit':
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'loan_disbursement':
        return 'bg-purple-100 text-purple-800 hover:bg-purple-200';
      case 'savings_withdrawal':
        return 'bg-orange-100 text-orange-800 hover:bg-orange-200';
      case 'fee_payment':
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  const formatTransactionType = (type: string) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const formatPaymentType = (type: string) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const filteredTransactions = transactions?.filter(transaction => {
    const matchesSearch = transaction.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.transaction_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.mpesa_receipt_number?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || transaction.payment_status === statusFilter;
    const matchesType = typeFilter === 'all' || transaction.transaction_type === typeFilter;
    
    const transactionDate = new Date(transaction.transaction_date);
    const matchesDateRange = !dateRange?.from || !dateRange?.to || 
                            (transactionDate >= dateRange.from && transactionDate <= dateRange.to);

    return matchesSearch && matchesStatus && matchesType && matchesDateRange;
  }) || [];

  const totalAmount = filteredTransactions.reduce((sum, transaction) => sum + Number(transaction.amount), 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Transaction Management</h1>
          <p className="text-muted-foreground">Manage payments, allocations, and transaction history</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsPaymentFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Payment
          </Button>
          <Button variant="outline" onClick={() => setIsAllocationFormOpen(true)}>
            <DollarSign className="h-4 w-4 mr-2" />
            Allocate Payment
          </Button>
          <Button variant="outline" onClick={() => setIsFeeFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Manage Fees
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Amount</p>
                <p className="text-2xl font-bold">KSh {totalAmount.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-semibold">#</span>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Transactions</p>
                <p className="text-2xl font-bold">{filteredTransactions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 font-semibold">✓</span>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">
                  {filteredTransactions.filter(t => t.payment_status === 'completed').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <span className="text-yellow-600 font-semibold">⏳</span>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">
                  {filteredTransactions.filter(t => t.payment_status === 'pending').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="transactions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="transactions">Transaction History</TabsTrigger>
          <TabsTrigger value="allocations">Unallocated Payments</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>View and manage all financial transactions</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex flex-wrap gap-4 mb-6">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search transactions..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="loan_repayment">Loan Repayment</SelectItem>
                    <SelectItem value="savings_deposit">Savings Deposit</SelectItem>
                    <SelectItem value="loan_disbursement">Loan Disbursement</SelectItem>
                    <SelectItem value="savings_withdrawal">Savings Withdrawal</SelectItem>
                    <SelectItem value="fee_payment">Fee Payment</SelectItem>
                  </SelectContent>
                </Select>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-[280px] justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange?.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, "LLL dd, y")} -{" "}
                            {format(dateRange.to, "LLL dd, y")}
                          </>
                        ) : (
                          format(dateRange.from, "LLL dd, y")
                        )
                      ) : (
                        <span>Pick a date range</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={dateRange?.from}
                      selected={dateRange as any}
                      onSelect={setDateRange}
                      numberOfMonths={2}
                    />
                  </PopoverContent>
                </Popover>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>

              {/* Transaction Table */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Transaction ID</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Payment Method</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">
                          Loading transactions...
                        </TableCell>
                      </TableRow>
                    ) : filteredTransactions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">
                          No transactions found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredTransactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell className="font-mono text-sm">
                            {transaction.transaction_id}
                          </TableCell>
                          <TableCell>
                            {format(new Date(transaction.transaction_date), "MMM dd, yyyy")}
                          </TableCell>
                          <TableCell>
                            <Badge className={getTypeColor(transaction.transaction_type)}>
                              {formatTransactionType(transaction.transaction_type)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {formatPaymentType(transaction.payment_type)}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-semibold">
                            KSh {Number(transaction.amount).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(transaction.payment_status)}>
                              {transaction.payment_status}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            {transaction.description || "-"}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              {transaction.payment_status === 'completed' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedTransaction(transaction);
                                    setIsReversalFormOpen(true);
                                  }}
                                >
                                  <RefreshCw className="h-4 w-4" />
                                </Button>
                              )}
                              <Button size="sm" variant="outline">
                                View
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="allocations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                Unallocated Payments
              </CardTitle>
              <CardDescription>
                Payments that need to be allocated to specific loans or savings accounts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-semibold text-yellow-800 mb-2">Manual Allocation Required</h4>
                  <p className="text-sm text-yellow-700 mb-3">
                    The following payments could not be automatically allocated and require manual intervention.
                  </p>
                  <Button onClick={() => setIsAllocationFormOpen(true)} size="sm">
                    Allocate Payments
                  </Button>
                </div>
                
                {/* Unallocated payments would be displayed here */}
                <div className="text-center py-8 text-muted-foreground">
                  No unallocated payments at this time
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Payment Methods</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span>M-Pesa</span>
                    <span className="font-semibold">65%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Bank Transfer</span>
                    <span className="font-semibold">25%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Cash</span>
                    <span className="font-semibold">10%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Transaction Volume</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span>Today</span>
                    <span className="font-semibold">KSh 245,000</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>This Week</span>
                    <span className="font-semibold">KSh 1,250,000</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>This Month</span>
                    <span className="font-semibold">KSh 4,800,000</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Forms */}
      <PaymentForm 
        open={isPaymentFormOpen} 
        onOpenChange={setIsPaymentFormOpen} 
      />
      
      <PaymentAllocationForm 
        open={isAllocationFormOpen} 
        onOpenChange={setIsAllocationFormOpen} 
      />
      
      <PaymentReversalForm 
        open={isReversalFormOpen} 
        onOpenChange={setIsReversalFormOpen} 
        transaction={selectedTransaction}
      />
      
      <FeeManagementForm 
        open={isFeeFormOpen} 
        onOpenChange={setIsFeeFormOpen} 
      />
    </div>
  );
};

export default TransactionsPage;