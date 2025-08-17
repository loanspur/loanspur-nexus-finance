import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useLoanRepaymentAccounting, useLoanChargeAccounting, useLoanDisbursementAccounting } from "@/hooks/useLoanAccounting";
import { supabase } from "@/integrations/supabase/client";
import { useFeeStructures } from "@/hooks/useFeeManagement";
import { getDerivedLoanStatus } from "@/lib/loan-status";
import { StatusHelpers } from "@/lib/status-management";

const paymentSchema = z.object({
  amount: z.string().min(1, "Amount is required").refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Amount must be a positive number",
  }),
  paymentType: z.enum(['cash', 'bank_transfer', 'mpesa', 'mobile_money', 'cheque']),
  transactionType: z.enum(['loan_repayment', 'savings_deposit', 'loan_disbursement', 'savings_withdrawal', 'fee_payment']),
  description: z.string().optional(),
  clientId: z.string().optional(),
  loanId: z.string().optional(),
  savingsAccountId: z.string().optional(),
  externalTransactionId: z.string().optional(),
  mpesaReceiptNumber: z.string().optional(),
  transactionDate: z.date().optional(),
  loanFeeId: z.string().optional(),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

interface PaymentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PaymentForm = ({ open, onOpenChange }: PaymentFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { profile } = useAuth();
  
  // Accounting hooks
  const loanRepaymentAccounting = useLoanRepaymentAccounting();
  const loanChargeAccounting = useLoanChargeAccounting();
  const loanDisbursementAccounting = useLoanDisbursementAccounting();

  // Fee structures for loan fee mapping
  const { data: feeStructures = [] } = useFeeStructures();
  const loanFeeStructures = feeStructures.filter((fee) => fee.fee_type === 'loan' && fee.is_active);


  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: "",
      paymentType: "mpesa",
      transactionType: "loan_repayment",
      description: "",
      transactionDate: new Date(),
      loanFeeId: "",
    },
  });

  const onSubmit = async (data: PaymentFormData) => {
    if (isSubmitting) return; // Prevent double submission
    
    setIsSubmitting(true);
    try {
      const amount = Number(data.amount);
      const transactionDate = data.transactionDate ? format(data.transactionDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');

      // Create accounting entries based on transaction type
      switch (data.transactionType) {
        case 'loan_repayment':
          if (data.loanId) {
            // Check loan status before processing payment
            const { data: loanData, error: loanError } = await supabase
              .from('loans')
              .select('status, loan_number')
              .eq('id', data.loanId)
              .single();

            if (loanError) {
              throw new Error('Failed to verify loan status');
            }

            // Use unified status system to check if loan can accept payments
            const { status: derivedStatus } = getDerivedLoanStatus({ ...loanData, status: loanData.status });
            if (StatusHelpers.isClosed(derivedStatus)) {
              throw new Error(`Cannot process payments on ${derivedStatus} loans (${loanData.loan_number})`);
            }

            await loanRepaymentAccounting.mutateAsync({
              loan_id: data.loanId,
              payment_amount: amount,
              principal_amount: amount, // For now, treating full amount as principal
              interest_amount: 0,
              payment_date: transactionDate,
              payment_reference: data.externalTransactionId,
              payment_method: data.paymentType,
            });
          }
          break;
        case 'fee_payment':
          if (data.loanId) {
            await loanChargeAccounting.mutateAsync({
              loan_id: data.loanId,
              charge_type: 'fee',
              amount: amount,
              charge_date: transactionDate,
              description: data.description || 'Loan fee charge',
              fee_structure_id: data.loanFeeId,
            });
          }
          break;
        case 'loan_disbursement':
          if (data.loanId) {
            // Fetch loan to get product and number
            const { data: loan, error } = await supabase
              .from('loans')
              .select('id, client_id, loan_product_id, loan_number')
              .eq('id', data.loanId)
              .single();
            if (!error && loan) {
              await loanDisbursementAccounting.mutateAsync({
                loan_id: loan.id,
                client_id: loan.client_id,
                loan_product_id: loan.loan_product_id,
                principal_amount: amount,
                disbursement_date: transactionDate,
                loan_number: loan.loan_number,
                payment_method: data.paymentType,
              });
            }
          }
          break;
        case 'savings_deposit':
        case 'savings_withdrawal':
          // Savings accounting integration will be handled by SavingsTransactionForm
          break;
      }
      
      toast({
        title: "Payment Processed",
        description: "The payment has been successfully recorded and accounting entries created.",
      });
      
      form.reset();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Payment processing error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to process payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      // Only update state if component is still mounted
      if (typeof setIsSubmitting === 'function') {
        setIsSubmitting(false);
      }
    }
  };

  const formatPaymentType = (type: string) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const formatTransactionType = (type: string) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Process Payment</DialogTitle>
          <DialogDescription>
            Record a new payment transaction in the system
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount (KSh)</FormLabel>
                    <FormControl>
                      <Input placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="transactionDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Transaction Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="paymentType"
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
                        <SelectItem value="mpesa">M-Pesa</SelectItem>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="mobile_money">Mobile Money</SelectItem>
                        <SelectItem value="cheque">Cheque</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                        <SelectItem value="loan_repayment">Loan Repayment</SelectItem>
                        <SelectItem value="savings_deposit">Savings Deposit</SelectItem>
                        <SelectItem value="loan_disbursement">Loan Disbursement</SelectItem>
                        <SelectItem value="savings_withdrawal">Savings Withdrawal</SelectItem>
                        <SelectItem value="fee_payment">Fee Payment</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {form.watch("transactionType") === "fee_payment" && (
              <FormField
                control={form.control}
                name="loanFeeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Loan Fee</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select loan fee" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {loanFeeStructures.length === 0 ? (
                          <SelectItem value="no-fees" disabled>No loan fees configured</SelectItem>
                        ) : (
                          loanFeeStructures.map((fee) => (
                            <SelectItem key={fee.id} value={fee.id}>
                              {fee.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {form.watch("paymentType") === "mpesa" && (
              <FormField
                control={form.control}
                name="mpesaReceiptNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>M-Pesa Receipt Number</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., NLJ7RT61SV" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="externalTransactionId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>External Transaction ID</FormLabel>
                  <FormControl>
                    <Input placeholder="External reference number (optional)" {...field} />
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
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Additional notes about this payment" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Processing..." : "Process Payment"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};