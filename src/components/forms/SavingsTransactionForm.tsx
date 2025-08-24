import { useState, useEffect, useCallback } from "react";
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
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format as formatDate } from "date-fns";
import { DollarSign, ArrowUpRight, ArrowDownRight, ArrowRightLeft, AlertCircle, Receipt } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useFeeStructures } from "@/hooks/useFeeManagement";
import { useCurrency } from "@/contexts/CurrencyContext";
import { 
  useSavingsDepositAccounting, 
  useSavingsWithdrawalAccounting, 
  useSavingsFeeChargeAccounting 
} from "@/hooks/useSavingsAccounting";
import { useLoanRepaymentAccounting } from "@/hooks/useLoanAccounting";
import { useClients } from "@/hooks/useSupabase";
import { useClientLoans } from "@/hooks/useLoanManagement";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSavingsAccount } from "@/hooks/useSavingsAccount";

const transactionSchema = z.object({
  transactionType: z.enum(["deposit", "withdrawal", "transfer", "fee_charge"]),
  amount: z.string().optional(),
  method: z.string().optional(),
  reference: z.string().optional(),
  description: z.string().optional(),
  transactionDate: z.string().nonempty("Please select a transaction date"),
  transferClientId: z.string().optional(),
  transferAccountType: z.enum(["savings", "loan"]).optional(),
  transferAccountId: z.string().optional(),
  feeStructureId: z.string().optional(),
  customChargeAmount: z.string().optional(),
});

type TransactionFormData = z.infer<typeof transactionSchema>;

interface SavingsTransactionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  savingsAccount: {
    id: string;
    account_balance: number;
    savings_product_id: string;
    savings_products?: {
      name: string;
    };
    account_number: string;
    client_id?: string;
    activated_date?: string;
  };
  transactionType?: 'deposit' | 'withdrawal' | 'transfer' | 'fee_charge';
  onSuccess?: () => void;
}

export const SavingsTransactionForm = ({
  open,
  onOpenChange,
  savingsAccount,
  transactionType = 'deposit',
  onSuccess
}: SavingsTransactionFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { currency, currencySymbol } = useCurrency();
  const { data: liveAccount } = useSavingsAccount(savingsAccount.id);
  const displayBalance = liveAccount?.account_balance ?? savingsAccount.account_balance;
  
  // Accounting hooks
  const depositAccounting = useSavingsDepositAccounting();
  const withdrawalAccounting = useSavingsWithdrawalAccounting();
  const feeChargeAccounting = useSavingsFeeChargeAccounting();
  const loanRepaymentAccounting = useLoanRepaymentAccounting();
  // Load product-level payment type mappings for this savings product
  const [paymentOptions, setPaymentOptions] = useState<Array<{ id: string; code: string; name: string }>>([]);
  useEffect(() => {
    const load = async () => {
      const productId = savingsAccount.savings_product_id;
      if (!productId) { setPaymentOptions([]); return; }

      // Fetch allowed payment types from the product's Advanced Accounting mappings
      const { data: product, error: productError } = await supabase
        .from('savings_products')
        .select('payment_type_mappings')
        .eq('id', productId)
        .maybeSingle();

      if (productError) { setPaymentOptions([]); return; }

      const mappings = (product?.payment_type_mappings as any[]) || [];
      const rawVals: string[] = mappings
        .map((m: any) => (m && typeof m.payment_type === 'string' ? m.payment_type : ''))
        .filter((v: string) => !!v);

      if (rawVals.length === 0) { setPaymentOptions([]); return; }

      // Load all ACTIVE payment types and filter by codes OR names present in mappings (case-insensitive)
      const { data: pts, error: ptsErr } = await supabase
        .from('payment_types')
        .select('id, code, name, is_active')
        .eq('is_active', true);

      if (ptsErr || !pts) { setPaymentOptions([]); return; }

      const needleSet = new Set(rawVals.map(v => v.toLowerCase()));
      const options = pts
        .filter((pt: any) => needleSet.has((pt.code || '').toLowerCase()) || needleSet.has((pt.name || '').toLowerCase()))
        .map((pt: any) => ({ id: pt.id, code: pt.code, name: pt.name }));

      setPaymentOptions(options);
    };
    load();
  }, [savingsAccount.savings_product_id]);
  
  // Fetch all fee structures and filter for savings-related charges
  const { data: allFeeStructures } = useFeeStructures();
  const feeStructures = allFeeStructures?.filter(fee => 
    fee.is_active && ['savings', 'savings_maintenance', 'savings_charge', 'account_charge'].includes(fee.fee_type)
  ) || [];
  const { data: clients = [] } = useClients();

  const form = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      transactionType: transactionType,
      amount: "",
      method: "",
      reference: "",
      description: "",
      transactionDate: new Date().toISOString().split('T')[0],
      transferClientId: savingsAccount.client_id || undefined,
      transferAccountType: undefined,
      transferAccountId: undefined,
      feeStructureId: "",
      customChargeAmount: "",
    },
  });

  const watchedTransactionType = form.watch("transactionType");
  const watchedAmount = form.watch("amount");
  const watchedFeeStructureId = form.watch("feeStructureId");
  const watchedCustomChargeAmount = form.watch("customChargeAmount");
  const watchedTransferClientId = form.watch("transferClientId");
  const watchedTransferAccountType = form.watch("transferAccountType");
  const { data: clientLoans = [] } = useClientLoans(watchedTransferClientId);

  const selectedClient = clients.find((c: any) => c.id === watchedTransferClientId);
  const destinationSavingsAccounts = (selectedClient as any)?.savings_accounts || [];
  const destinationLoanAccounts = clientLoans || [];

  useEffect(() => {
    if (
      watchedTransactionType === 'transfer' &&
      watchedTransferAccountType &&
      !form.getValues('transferAccountId')
    ) {
      const options = watchedTransferAccountType === 'savings' ? destinationSavingsAccounts : destinationLoanAccounts;
      if (options && options.length === 1) {
        form.setValue('transferAccountId', options[0].id);
      }
    }
  }, [watchedTransactionType, watchedTransferAccountType, watchedTransferClientId, destinationSavingsAccounts, destinationLoanAccounts]);
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
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
      case "fee_charge":
        return <Receipt className="h-4 w-4 text-orange-600" />;
      default:
        return <DollarSign className="h-4 w-4" />;
    }
  };

  // Calculate amount for charges based on fee structure or custom amount
  const getChargeAmount = () => {
    if (watchedTransactionType !== 'fee_charge' || !watchedFeeStructureId) return 0;
    
    // If custom amount is provided, use it
    if (watchedCustomChargeAmount && parseFloat(watchedCustomChargeAmount) > 0) {
      return parseFloat(watchedCustomChargeAmount);
    }
    
    const selectedFee = feeStructures.find(f => f.id === watchedFeeStructureId);
    if (!selectedFee) return 0;
    
    if (selectedFee.calculation_type === 'fixed') {
      return selectedFee.amount;
    } else if (selectedFee.calculation_type === 'percentage') {
      const baseAmount = displayBalance;
      let calculatedAmount = (baseAmount * selectedFee.amount) / 100;
      
      // Apply min/max limits
      if (selectedFee.min_amount && calculatedAmount < selectedFee.min_amount) {
        calculatedAmount = selectedFee.min_amount;
      }
      if (selectedFee.max_amount && calculatedAmount > selectedFee.max_amount) {
        calculatedAmount = selectedFee.max_amount;
      }
      
      return calculatedAmount;
    }
    
    return 0;
  };

  const validateTransaction = (data: TransactionFormData) => {
    const amount = data.transactionType === 'fee_charge' ? getChargeAmount() : parseFloat(data.amount || "0");
    const minBalance = 0; // Default minimum balance

    if (data.transactionType !== 'fee_charge' && (!data.amount || amount <= 0)) {
      return {
        isValid: false,
        message: "Please enter a valid amount"
      };
    }

    // Enforce min/max limits for charges
    if (data.transactionType === 'fee_charge' && data.feeStructureId) {
      const selectedFee = feeStructures.find(f => f.id === data.feeStructureId);
      if (selectedFee) {
        if (selectedFee.min_amount && amount < selectedFee.min_amount) {
          return {
            isValid: false,
            message: `Charge amount cannot be less than minimum ${formatCurrency(selectedFee.min_amount)}`
          };
        }
        if (selectedFee.max_amount && amount > selectedFee.max_amount) {
          return {
            isValid: false,
            message: `Charge amount cannot exceed maximum ${formatCurrency(selectedFee.max_amount)}`
          };
        }
      }
    }

    if (data.transactionType === "withdrawal" || data.transactionType === "transfer" || data.transactionType === "fee_charge") {
      const newBalance = displayBalance - amount;
      if (newBalance < minBalance) {
        return {
          isValid: false,
          message: `${data.transactionType} would result in balance below minimum required (${formatCurrency(minBalance)})`
        };
      }
    }

    if (data.transactionType === "transfer") {
      if (!data.transferClientId || !data.transferAccountType || !data.transferAccountId) {
        return {
          isValid: false,
          message: "Please select client, account type, and destination account for the transfer"
        };
      }
    }

    if (data.transactionType === "fee_charge" && !data.feeStructureId) {
      return {
        isValid: false,
        message: "Please select a charge/fee to apply"
      };
    }

    if (data.transactionType !== 'fee_charge' && data.transactionType !== 'transfer' && !data.method) {
      return {
        isValid: false,
        message: "Please select a payment method"
      };
    }

    // Prevent future dates
    if (data.transactionDate) {
      const selected = new Date(data.transactionDate);
      const today = new Date();
      selected.setHours(0,0,0,0);
      today.setHours(0,0,0,0);
      if (selected > today) {
        return { isValid: false, message: "Future dates are not allowed" };
      }
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

      const amount = data.transactionType === 'fee_charge' ? getChargeAmount() : parseFloat(data.amount || "0");
      let newBalance = displayBalance;
      
      // Calculate new balance based on transaction type
      if (data.transactionType === 'deposit') {
        newBalance = displayBalance + amount;
      } else if (data.transactionType === 'withdrawal' || data.transactionType === 'transfer' || data.transactionType === 'fee_charge') {
        newBalance = displayBalance - amount;
      }

      // Get current user's tenant_id and profile_id
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, tenant_id')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!profile?.tenant_id) {
        throw new Error('Unable to identify tenant');
      }

      // Check for unique reference number if provided
      if (data.reference && data.reference.trim()) {
        const { data: existingTransaction } = await supabase
          .from('savings_transactions')
          .select('id')
          .eq('tenant_id', profile.tenant_id)
          .eq('reference_number', data.reference.trim())
          .maybeSingle();

        if (existingTransaction) {
          throw new Error('Transaction reference number must be unique. This reference already exists.');
        }
      }

      // Insert transaction record with additional fields for charges
      const transactionData: any = {
        tenant_id: profile.tenant_id,
        savings_account_id: savingsAccount.id,
        transaction_type: data.transactionType === 'transfer' ? 'withdrawal' : data.transactionType,
        amount: amount,
        balance_after: newBalance,
        description: data.description || `${data.transactionType === 'transfer' ? 'Transfer out' : data.transactionType + ' transaction'}`,
        reference_number: data.reference,
        processed_by: profile.id,
        method: data.transactionType === 'transfer' ? 'internal_transfer' : data.method,
        transaction_date: data.transactionDate,
      };

      // Add fee structure reference for charges
      if (data.transactionType === 'fee_charge' && data.feeStructureId) {
        const selectedFee = feeStructures.find(f => f.id === data.feeStructureId);
        if (selectedFee) {
          transactionData.description = `${selectedFee.name} - ${selectedFee.description || 'Account charge'}`;
          // Record fee name as method for transaction history display
          transactionData.method = selectedFee.name;
        }
      }

      const { error: transactionError } = await supabase
        .from('savings_transactions')
        .insert(transactionData);

      if (transactionError) throw transactionError;

      // Update savings account balance
      const { error: updateError } = await supabase
        .from('savings_accounts')
        .update({ 
          account_balance: newBalance,
          updated_at: new Date().toISOString()
        })
        .eq('id', savingsAccount.id);

      if (updateError) throw updateError;

      // If transfer to another savings account, create destination deposit and update its balance
      if (data.transactionType === 'transfer' && data.transferAccountType === 'savings' && data.transferAccountId) {
        const { data: destAcc, error: destFetchError } = await supabase
          .from('savings_accounts')
          .select('id, account_balance, account_number')
          .eq('id', data.transferAccountId)
          .maybeSingle();

        if (destFetchError || !destAcc) {
          throw new Error('Destination savings account not found');
        }

        const destNewBalance = (destAcc.account_balance || 0) + amount;

        const { error: destTxnError } = await supabase
          .from('savings_transactions')
          .insert({
            tenant_id: profile.tenant_id,
            savings_account_id: destAcc.id,
            transaction_type: 'deposit',
            amount: amount,
            balance_after: destNewBalance,
            description: `Transfer from ${savingsAccount.account_number}`,
            reference_number: data.reference,
            processed_by: profile.id,
            method: 'internal_transfer',
            transaction_date: data.transactionDate,
          });

        if (destTxnError) throw destTxnError;

        const { error: destUpdateError } = await supabase
          .from('savings_accounts')
          .update({ account_balance: destNewBalance, updated_at: new Date().toISOString() })
          .eq('id', destAcc.id);

        if (destUpdateError) throw destUpdateError;

        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['savings-account', destAcc.id] }),
          queryClient.invalidateQueries({ queryKey: ['savings-transactions', destAcc.id] }),
        ]);
      } else if (data.transactionType === 'transfer' && data.transferAccountType === 'loan' && data.transferAccountId) {
        const loanId = data.transferAccountId;

        const { error: loanPayErr } = await supabase
          .from('loan_payments')
          .insert({
            tenant_id: profile.tenant_id,
            loan_id: loanId,
            payment_amount: amount,
            principal_amount: amount,
            interest_amount: 0,
            fee_amount: 0,
            payment_date: data.transactionDate,
            payment_method: 'internal_transfer',
            reference_number: data.reference,
            processed_by: profile.id,
          });
        if (loanPayErr) throw loanPayErr;

        // Create loan repayment accounting entry (best-effort)
        try {
          await loanRepaymentAccounting.mutateAsync({
            loan_id: loanId,
            payment_amount: amount,
            principal_amount: amount,
            interest_amount: 0,
            fee_amount: 0,
            payment_date: data.transactionDate,
            payment_method: 'internal_transfer',
            payment_reference: data.reference || undefined,
          } as any);
        } catch (e) {
          console.warn('Loan repayment accounting failed:', e);
        }

        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['loan-payments', loanId] }),
          queryClient.invalidateQueries({ queryKey: ['loan-schedules', loanId] }),
          queryClient.invalidateQueries({ queryKey: ['loans'] }),
        ]);
      }

      // Refresh queries so all open modals update
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['savings-accounts'] }),
        queryClient.invalidateQueries({ queryKey: ['savings-account', savingsAccount.id] }),
        queryClient.invalidateQueries({ queryKey: ['savings-transactions', savingsAccount.id] }),
      ]);

      // Create accounting entries based on transaction type
      const accountingData = {
        savings_account_id: savingsAccount.id,
        savings_product_id: savingsAccount.savings_product_id,
        amount: amount,
        transaction_date: data.transactionDate,
        account_number: savingsAccount.account_number,
        payment_method: data.transactionType === 'transfer' ? 'internal_transfer' : data.method,
      };

      // Create journal entries for accounting integration
      try {
        if (data.transactionType === 'deposit') {
          await depositAccounting.mutateAsync({
            ...accountingData,
            payment_method: data.method,
          });
        } else if (data.transactionType === 'withdrawal') {
          await withdrawalAccounting.mutateAsync({
            ...accountingData,
            payment_method: data.method,
          });
        } else if (data.transactionType === 'fee_charge') {
          const selectedFee = feeStructures.find(f => f.id === data.feeStructureId);
          await feeChargeAccounting.mutateAsync({
            ...accountingData,
            fee_type: selectedFee?.fee_type || 'general',
            description: `${selectedFee?.name} - ${selectedFee?.description || 'Account charge'}`,
          });
        }
      } catch (accountingError) {
        console.warn('Accounting integration failed:', accountingError);
        // Don't fail the transaction if accounting fails - just log it
        // The transaction has already been recorded successfully
      }

      toast({
        title: "Transaction Successful",
        description: `${data.transactionType} of ${formatCurrency(amount)} has been processed successfully.`,
      });

      form.reset();
      onSuccess?.();

    } catch (error: any) {
      console.error("Transaction failed:", error);
      toast({
        title: "Transaction Failed",
        description: error.message || "There was an error processing your transaction. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getNewBalance = () => {
    const amount = watchedTransactionType === 'fee_charge' ? getChargeAmount() : (parseFloat(watchedAmount || "0") || 0);
    switch (watchedTransactionType) {
      case "deposit":
        return displayBalance + amount;
      case "withdrawal":
      case "transfer":
      case "fee_charge":
        return displayBalance - amount;
      default:
        return displayBalance;
    }
  };

  const newBalance = getNewBalance();
  const minBalance = 0; // Default minimum balance
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
            Process a transaction for savings account {savingsAccount.account_number}
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
                    <span className="text-muted-foreground">Account Number</span>
                    <div className="font-medium">{savingsAccount.account_number}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Current Balance</span>
                    <div className="font-bold text-green-600">
                      {formatCurrency(displayBalance)}
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Product</span>
                    <div className="font-medium">{savingsAccount.savings_products?.name || 'N/A'}</div>
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
                          <SelectItem value="fee_charge">
                            <div className="flex items-center gap-2">
                              <Receipt className="h-4 w-4 text-orange-600" />
                              Apply Charge
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Fee Structure Selection (only for charges) */}
                {watchedTransactionType === "fee_charge" && (
                  <>
                    <FormField
                      control={form.control}
                      name="feeStructureId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Select Charge/Fee</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a charge to apply" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {feeStructures.map((fee) => (
                                <SelectItem key={fee.id} value={fee.id}>
                                  <div className="flex flex-col">
                                    <span className="font-medium">{fee.name}</span>
                                    <span className="text-xs text-muted-foreground">
                                      {fee.calculation_type === 'fixed' 
                                        ? formatCurrency(fee.amount)
                                        : `${fee.amount}%${fee.min_amount ? ` (min ${formatCurrency(fee.min_amount)})` : ''}${fee.max_amount ? ` (max ${formatCurrency(fee.max_amount)})` : ''}`
                                      }
                                    </span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Custom Charge Amount (editable override) */}
                    {watchedFeeStructureId && (
                      <FormField
                        control={form.control}
                        name="customChargeAmount"
                        render={({ field }) => {
                          const selectedFee = feeStructures.find(f => f.id === watchedFeeStructureId);
                          const calculatedAmount = getChargeAmount();
                          const hasLimits = selectedFee?.min_amount || selectedFee?.max_amount;
                          
                          return (
                            <FormItem>
                               <FormLabel>
                                 Custom Amount ({currency}) 
                                 <span className="text-xs text-muted-foreground ml-1">
                                   (Default: {formatCurrency(calculatedAmount)})
                                 </span>
                               </FormLabel>
                              {hasLimits && (
                                <div className="text-xs text-muted-foreground mb-1">
                                  Limits: {selectedFee?.min_amount ? `Min ${formatCurrency(selectedFee.min_amount)}` : 'No minimum'}
                                  {selectedFee?.min_amount && selectedFee?.max_amount && ' • '}
                                  {selectedFee?.max_amount ? `Max ${formatCurrency(selectedFee.max_amount)}` : 'No maximum'}
                                </div>
                              )}
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.01"
                                  min={selectedFee?.min_amount || 0}
                                  max={selectedFee?.max_amount || undefined}
                                  placeholder={`Default: ${formatCurrency(calculatedAmount)}`}
                                  className={`${
                                    watchedCustomChargeAmount && selectedFee && (
                                      (selectedFee.min_amount && parseFloat(watchedCustomChargeAmount) < selectedFee.min_amount) ||
                                      (selectedFee.max_amount && parseFloat(watchedCustomChargeAmount) > selectedFee.max_amount)
                                    ) ? 'border-destructive focus:border-destructive' : ''
                                  }`}
                                  {...field}
                                />
                              </FormControl>
                              {watchedCustomChargeAmount && selectedFee && (
                                <>
                                  {selectedFee.min_amount && parseFloat(watchedCustomChargeAmount) < selectedFee.min_amount && (
                                    <p className="text-xs text-destructive">
                                      Amount must be at least {formatCurrency(selectedFee.min_amount)}
                                    </p>
                                  )}
                                  {selectedFee.max_amount && parseFloat(watchedCustomChargeAmount) > selectedFee.max_amount && (
                                    <p className="text-xs text-destructive">
                                      Amount cannot exceed {formatCurrency(selectedFee.max_amount)}
                                    </p>
                                  )}
                                </>
                              )}
                              <FormMessage />
                            </FormItem>
                          );
                        }}
                      />
                    )}
                  </>
                )}

                {/* Amount (disabled for charges as it's auto-calculated) */}
                {watchedTransactionType !== 'fee_charge' && (
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount ({currency})</FormLabel>
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
                )}

                {/* Payment Method (not applicable for charges) */}
                {['deposit', 'withdrawal'].includes(watchedTransactionType) && (
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
                            {paymentOptions.length > 0 ? (
                              paymentOptions.map((opt) => (
                                <SelectItem key={opt.id} value={opt.code}>{opt.name || opt.code}</SelectItem>
                              ))
                            ) : (
                              <SelectItem disabled value="no_methods">No payment methods configured</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Transaction Date */}
                <FormField
                  control={form.control}
                  name="transactionDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Transaction Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                formatDate(new Date(field.value), "PPP")
                              ) : (
                                <span>Select date</span>
                              )}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value ? new Date(field.value) : undefined}
                            onSelect={(date) => field.onChange(date ? date.toISOString().split('T')[0] : "")}
                            disabled={(date) => date > new Date()}
                            initialFocus
                            className={cn("p-3 pointer-events-auto")}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Transfer Details (only for transfers) */}
                {watchedTransactionType === "transfer" && (
                  <>
                    <FormField
                      control={form.control}
                      name="transferClientId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Destination Client</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select client" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {clients.map((c: any) => (
                                <SelectItem key={c.id} value={c.id}>
                                  {`${c.first_name || ''} ${c.last_name || ''}`.trim() || c.id}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="transferAccountType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Destination Account Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select account type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="savings">Savings</SelectItem>
                              <SelectItem value="loan">Loan</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="transferAccountId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Destination Account</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={watchedTransferAccountType === 'loan' ? "Select loan account" : "Select savings account"} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {watchedTransferAccountType === 'savings' && destinationSavingsAccounts.map((acc: any) => (
                                <SelectItem key={acc.id} value={acc.id}>
                                  {acc.account_number}
                                </SelectItem>
                              ))}
                              {watchedTransferAccountType === 'loan' && (clientLoans || []).map((ln: any) => (
                                <SelectItem key={ln.id} value={ln.id}>
                                  {ln.loan_number}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
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
                      <span className="font-medium">{formatCurrency(displayBalance)}</span>
                    </div>
                     
                     {((watchedAmount && parseFloat(watchedAmount) > 0) || watchedTransactionType === 'fee_charge') && (
                       <>
                         <div className="flex justify-between text-sm">
                           <span className="text-muted-foreground">
                             {watchedTransactionType === "deposit" ? "Amount to Deposit:" : 
                              watchedTransactionType === "fee_charge" ? "Charge Amount:" :
                              "Amount to Withdraw:"}
                           </span>
                           <span className={`font-medium ${
                             watchedTransactionType === "deposit" ? "text-green-600" : "text-red-600"
                           }`}>
                             {watchedTransactionType === "deposit" ? "+" : "-"}
                             {formatCurrency(watchedTransactionType === 'fee_charge' ? getChargeAmount() : parseFloat(watchedAmount || "0"))}
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