import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PiggyBank, Plus, DollarSign, TrendingUp, ArrowUpRight, ArrowDownRight, RefreshCw } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { useFunds, useCreateFund, useFundTransactions, useCreateFundTransaction } from "@/hooks/useFundsManagement";
import { useCurrencies, formatCurrency, useTenantCurrencySettings } from "@/hooks/useCurrencyManagement";

const fundSchema = z.object({
  fund_name: z.string().min(1, "Fund name is required"),
  fund_code: z.string().min(1, "Fund code is required"),
  description: z.string().optional(),
  fund_type: z.enum(['general', 'loan', 'savings', 'operational', 'reserve']),
  currency_id: z.string().optional(),
  initial_balance: z.string().min(1, "Initial balance is required"),
  minimum_balance: z.string().optional(),
  maximum_balance: z.string().optional(),
});

const transactionSchema = z.object({
  fund_id: z.string().min(1, "Fund is required"),
  transaction_type: z.enum(['credit', 'debit', 'transfer_in', 'transfer_out', 'adjustment']),
  amount: z.string().min(1, "Amount is required"),
  reference_number: z.string().optional(),
  description: z.string().min(1, "Description is required"),
  transaction_date: z.string().min(1, "Transaction date is required"),
  related_fund_id: z.string().optional(),
});

const FundsManagementPage = () => {
  const [showCreateFund, setShowCreateFund] = useState(false);
  const [showCreateTransaction, setShowCreateTransaction] = useState(false);

  const { data: funds = [], isLoading: fundsLoading } = useFunds();
  const { data: transactions = [], isLoading: transactionsLoading } = useFundTransactions();
  const { data: currencies = [] } = useCurrencies();
  const { data: currencySettings } = useTenantCurrencySettings();
  const createFundMutation = useCreateFund();
  const createTransactionMutation = useCreateFundTransaction();

  const fundForm = useForm<z.infer<typeof fundSchema>>({
    resolver: zodResolver(fundSchema),
    defaultValues: {
      fund_type: 'general',
    },
  });

  const transactionForm = useForm<z.infer<typeof transactionSchema>>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      transaction_type: 'credit',
      transaction_date: format(new Date(), 'yyyy-MM-dd'),
    },
  });

  const onCreateFund = async (values: z.infer<typeof fundSchema>) => {
    await createFundMutation.mutateAsync({
      fund_name: values.fund_name,
      fund_code: values.fund_code,
      description: values.description,
      fund_type: values.fund_type,
      currency_id: values.currency_id,
      initial_balance: parseFloat(values.initial_balance),
      current_balance: parseFloat(values.initial_balance),
      minimum_balance: values.minimum_balance ? parseFloat(values.minimum_balance) : undefined,
      maximum_balance: values.maximum_balance ? parseFloat(values.maximum_balance) : undefined,
      is_active: true,
    });
    setShowCreateFund(false);
    fundForm.reset();
  };

  const onCreateTransaction = async (values: z.infer<typeof transactionSchema>) => {
    await createTransactionMutation.mutateAsync({
      fund_id: values.fund_id,
      transaction_type: values.transaction_type,
      amount: parseFloat(values.amount),
      reference_number: values.reference_number,
      description: values.description,
      transaction_date: values.transaction_date,
      related_fund_id: values.related_fund_id,
      status: 'pending',
    });
    setShowCreateTransaction(false);
    transactionForm.reset();
  };

  const getFundTypeColor = (type: string) => {
    const colors = {
      general: "bg-blue-100 text-blue-800",
      loan: "bg-green-100 text-green-800",
      savings: "bg-purple-100 text-purple-800",
      operational: "bg-orange-100 text-orange-800",
      reserve: "bg-red-100 text-red-800",
    };
    return colors[type as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const getTransactionTypeIcon = (type: string) => {
    if (type === 'credit' || type === 'transfer_in') {
      return <ArrowUpRight className="h-4 w-4 text-green-600" />;
    }
    return <ArrowDownRight className="h-4 w-4 text-red-600" />;
  };

  const totalFunds = funds.reduce((sum, fund) => sum + fund.current_balance, 0);

  if (fundsLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading funds...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Funds Management</h1>
          <p className="text-muted-foreground">Manage your organization's funds and allocations</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showCreateTransaction} onOpenChange={setShowCreateTransaction}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <DollarSign className="h-4 w-4" />
                New Transaction
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create Fund Transaction</DialogTitle>
              </DialogHeader>
              <Form {...transactionForm}>
                <form onSubmit={transactionForm.handleSubmit(onCreateTransaction)} className="space-y-4">
                  <FormField
                    control={transactionForm.control}
                    name="fund_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fund</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select fund" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {funds.map((fund) => (
                              <SelectItem key={fund.id} value={fund.id}>
                                {fund.fund_name} ({fund.fund_code})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={transactionForm.control}
                    name="transaction_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Transaction Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="credit">Credit</SelectItem>
                            <SelectItem value="debit">Debit</SelectItem>
                            <SelectItem value="adjustment">Adjustment</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={transactionForm.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={transactionForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={transactionForm.control}
                    name="reference_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reference Number</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={transactionForm.control}
                    name="transaction_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Transaction Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={createTransactionMutation.isPending}>
                    {createTransactionMutation.isPending ? "Creating..." : "Create Transaction"}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
          <Dialog open={showCreateFund} onOpenChange={setShowCreateFund}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Create Fund
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Fund</DialogTitle>
              </DialogHeader>
              <Form {...fundForm}>
                <form onSubmit={fundForm.handleSubmit(onCreateFund)} className="space-y-4">
                  <FormField
                    control={fundForm.control}
                    name="fund_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fund Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={fundForm.control}
                    name="fund_code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fund Code</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={fundForm.control}
                    name="fund_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fund Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="general">General</SelectItem>
                            <SelectItem value="loan">Loan</SelectItem>
                            <SelectItem value="savings">Savings</SelectItem>
                            <SelectItem value="operational">Operational</SelectItem>
                            <SelectItem value="reserve">Reserve</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={fundForm.control}
                    name="initial_balance"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Initial Balance</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={fundForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={createFundMutation.isPending}>
                    {createFundMutation.isPending ? "Creating..." : "Create Fund"}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Funds</CardTitle>
            <PiggyBank className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalFunds, currencySettings)}
            </div>
            <p className="text-xs text-muted-foreground">
              Across {funds.length} funds
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Funds</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{funds.filter(f => f.is_active).length}</div>
            <p className="text-xs text-muted-foreground">
              Out of {funds.length} total
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Transactions</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{transactions.length}</div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Largest Fund</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {funds.length > 0 
                ? formatCurrency(Math.max(...funds.map(f => f.current_balance)), currencySettings)
                : formatCurrency(0, currencySettings)
              }
            </div>
            <p className="text-xs text-muted-foreground">
              Current balance
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="funds" className="space-y-4">
        <TabsList>
          <TabsTrigger value="funds">Funds</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>

        <TabsContent value="funds" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Funds</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {funds.map((fund) => (
                  <div key={fund.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <PiggyBank className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{fund.fund_name}</h3>
                          <Badge variant="outline" className={getFundTypeColor(fund.fund_type)}>
                            {fund.fund_type}
                          </Badge>
                          <Badge variant="outline">{fund.fund_code}</Badge>
                        </div>
                        {fund.description && (
                          <p className="text-sm text-muted-foreground">{fund.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold">
                        {formatCurrency(fund.current_balance, currencySettings)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Initial: {formatCurrency(fund.initial_balance, currencySettings)}
                      </div>
                    </div>
                  </div>
                ))}
                {funds.length === 0 && (
                  <div className="text-center py-8">
                    <PiggyBank className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No funds yet</h3>
                    <p className="text-muted-foreground">Create your first fund to get started</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Fund</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        {format(new Date(transaction.transaction_date), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell>
                         <div>
                           <div className="font-medium">{(transaction.fund as any)?.fund_name || 'Unknown Fund'}</div>
                           <div className="text-sm text-muted-foreground">{(transaction.fund as any)?.fund_code || 'N/A'}</div>
                         </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getTransactionTypeIcon(transaction.transaction_type)}
                          <span className="capitalize">{transaction.transaction_type.replace('_', ' ')}</span>
                        </div>
                      </TableCell>
                      <TableCell>{transaction.description}</TableCell>
                      <TableCell>
                        <span className={
                          transaction.transaction_type === 'credit' || transaction.transaction_type === 'transfer_in'
                            ? 'text-green-600'
                            : 'text-red-600'
                        }>
                          {formatCurrency(transaction.amount, currencySettings)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          transaction.status === 'completed' ? 'default' :
                          transaction.status === 'pending' ? 'secondary' :
                          transaction.status === 'approved' ? 'outline' : 'destructive'
                        }>
                          {transaction.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {transactions.length === 0 && (
                <div className="text-center py-8">
                  <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No transactions yet</h3>
                  <p className="text-muted-foreground">Create your first transaction to get started</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FundsManagementPage;