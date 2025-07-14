import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { DollarSign, ArrowUpRight, ArrowDownRight, ArrowRightLeft, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const transactionSchema = z.object({
  transactionType: z.enum(["deposit", "withdrawal", "transfer"]),
  amount: z.string().min(1, "Amount is required"),
  method: z.string().min(1, "Payment method is required"),
  reference: z.string().optional(),
  description: z.string().optional(),
  transferTo: z.string().optional(),
});

type TransactionFormData = z.infer<typeof transactionSchema>;

interface SavingsTransactionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  savingsAccount: {
    id: string;
    balance: number;
    type: string;
    minimumBalance?: number;
  };
  clientName: string;
  onTransactionComplete?: () => void;
}

export const SavingsTransactionForm = ({
  open,
  onOpenChange,
  savingsAccount,
  clientName,
  onTransactionComplete
}: SavingsTransactionFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      transactionType: "deposit",
      amount: "",
      method: "",
      reference: "",
      description: "",
      transferTo: "",
    },
  });

  const watchedTransactionType = form.watch("transactionType");
  const watchedAmount = form.watch("amount");

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
    }).format(amount);
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "deposit":
        return <ArrowDownRight className="h-4 w-4 text-green-600" />;
      case "withdrawal":
        return <ArrowUpRight className="h-4 w-4 text-red-600" />;
      case "transfer":
        return <ArrowRightLeft className="h-4 w-4 text-blue-600" />;
      default:
        return <DollarSign className="h-4 w-4" />;
    }
  };

  const validateTransaction = (data: TransactionFormData) => {
    const amount = parseFloat(data.amount);
    const minBalance = savingsAccount.minimumBalance || 0;

    if (data.transactionType === "withdrawal") {
      const newBalance = savingsAccount.balance - amount;
      if (newBalance < minBalance) {
        return {
          isValid: false,
          message: `Withdrawal would result in balance below minimum required (${formatCurrency(minBalance)})`
        };
      }
    }

    if (data.transactionType === "transfer" && !data.transferTo) {
      return {
        isValid: false,
        message: "Please specify the account to transfer to"
      };
    }

    return { isValid: true, message: "" };
  };

  const onSubmit = async (data: TransactionFormData) => {
    setIsLoading(true);

    try {
      const validation = validateTransaction(data);
      if (!validation.isValid) {
        toast({
          title: "Transaction Error",
          description: validation.message,
          variant: "destructive",
        });
        return;
      }

      // TODO: Implement actual transaction processing
      console.log("Processing transaction:", data);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      toast({
        title: "Transaction Successful",
        description: `${data.transactionType} of ${formatCurrency(parseFloat(data.amount))} has been processed successfully.`,
      });

      form.reset();
      onOpenChange(false);
      onTransactionComplete?.();

    } catch (error) {
      console.error("Transaction failed:", error);
      toast({
        title: "Transaction Failed",
        description: "There was an error processing your transaction. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getNewBalance = () => {
    const amount = parseFloat(watchedAmount) || 0;
    switch (watchedTransactionType) {
      case "deposit":
        return savingsAccount.balance + amount;
      case "withdrawal":
        return savingsAccount.balance - amount;
      case "transfer":
        return savingsAccount.balance - amount;
      default:
        return savingsAccount.balance;
    }
  };

  const newBalance = getNewBalance();
  const minBalance = savingsAccount.minimumBalance || 0;
  const isBalanceValid = newBalance >= minBalance;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Savings Account Transaction
          </DialogTitle>
          <DialogDescription>
            Process a transaction for {clientName}'s savings account
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Account Summary */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Account Summary</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Account ID</span>
                    <div className="font-medium">{savingsAccount.id}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Current Balance</span>
                    <div className="font-bold text-green-600">
                      {formatCurrency(savingsAccount.balance)}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Account Type</span>
                    <div className="font-medium">{savingsAccount.type}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                {/* Transaction Type */}
                <FormField
                  control={form.control}
                  name="transactionType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Transaction Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select transaction type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="deposit">
                            <div className="flex items-center gap-2">
                              <ArrowDownRight className="h-4 w-4 text-green-600" />
                              Deposit
                            </div>
                          </SelectItem>
                          <SelectItem value="withdrawal">
                            <div className="flex items-center gap-2">
                              <ArrowUpRight className="h-4 w-4 text-red-600" />
                              Withdrawal
                            </div>
                          </SelectItem>
                          <SelectItem value="transfer">
                            <div className="flex items-center gap-2">
                              <ArrowRightLeft className="h-4 w-4 text-blue-600" />
                              Transfer
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Amount */}
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount (KES)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="Enter amount"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Payment Method */}
                <FormField
                  control={form.control}
                  name="method"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Method</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select payment method" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                          <SelectItem value="mpesa">M-Pesa</SelectItem>
                          <SelectItem value="cheque">Cheque</SelectItem>
                          <SelectItem value="card">Card Payment</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Transfer To (only for transfers) */}
                {watchedTransactionType === "transfer" && (
                  <FormField
                    control={form.control}
                    name="transferTo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Transfer To Account</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter destination account number"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              <div className="space-y-4">
                {/* Transaction Preview */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      {getTransactionIcon(watchedTransactionType)}
                      Transaction Preview
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Current Balance:</span>
                      <span className="font-medium">{formatCurrency(savingsAccount.balance)}</span>
                    </div>
                    
                    {watchedAmount && (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            {watchedTransactionType === "deposit" ? "Amount to Deposit:" : "Amount to Withdraw:"}
                          </span>
                          <span className={`font-medium ${
                            watchedTransactionType === "deposit" ? "text-green-600" : "text-red-600"
                          }`}>
                            {watchedTransactionType === "deposit" ? "+" : "-"}{formatCurrency(parseFloat(watchedAmount))}
                          </span>
                        </div>
                        
                        <Separator />
                        
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">New Balance:</span>
                          <span className={`font-bold ${isBalanceValid ? "text-primary" : "text-red-600"}`}>
                            {formatCurrency(newBalance)}
                          </span>
                        </div>
                        
                        {!isBalanceValid && (
                          <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 p-2 rounded">
                            <AlertCircle className="h-3 w-3" />
                            Balance below minimum required ({formatCurrency(minBalance)})
                          </div>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Reference and Description */}
                <FormField
                  control={form.control}
                  name="reference"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reference (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Transaction reference"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Transaction description or notes"
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading || !isBalanceValid}
                className="min-w-[120px]"
              >
                {isLoading ? "Processing..." : `Process ${watchedTransactionType}`}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};