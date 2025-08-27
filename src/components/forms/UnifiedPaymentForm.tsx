import { useState, useEffect } from "react";
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
import { CalendarIcon, DollarSign, CreditCard, Receipt } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useLoanTransactionManager, type LoanTransactionData } from "@/hooks/useUnifiedLoanManagement";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const paymentSchema = z.object({
  type: z.enum(['disbursement', 'repayment', 'charge', 'reversal']),
  amount: z.string().min(1, "Amount is required").refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Amount must be a positive number",
  }),
  loan_id: z.string().min(1, "Loan selection is required"),
  payment_method: z.string().optional(),
  reference_number: z.string().optional(),
  transaction_date: z.date(),
  description: z.string().optional(),
  
  // Repayment allocation fields
  use_strategy_allocation: z.boolean().default(true),
  principal_amount: z.string().optional(),
  interest_amount: z.string().optional(),
  fee_amount: z.string().optional(),
  penalty_amount: z.string().optional(),
  
  // Charge fields
  charge_type: z.enum(['fee', 'penalty', 'interest']).optional(),
  fee_structure_id: z.string().optional(),
  
  // Reversal fields
  original_payment_id: z.string().optional(),
  reversal_reason: z.string().optional(),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

interface UnifiedPaymentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultType?: 'disbursement' | 'repayment' | 'charge' | 'reversal';
  defaultLoanId?: string;
  clientId?: string;
}

export const UnifiedPaymentForm = ({ 
  open, 
  onOpenChange, 
  defaultType = 'repayment',
  defaultLoanId,
  clientId 
}: UnifiedPaymentFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableLoans, setAvailableLoans] = useState<any[]>([]);
  const [availablePayments, setAvailablePayments] = useState<any[]>([]);
  const [selectedLoanDetails, setSelectedLoanDetails] = useState<any>(null);
  
  const { profile } = useAuth();
  const loanTransactionManager = useLoanTransactionManager();

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      type: defaultType,
      amount: "",
      loan_id: defaultLoanId || "",
      use_strategy_allocation: true,
      transaction_date: new Date(),
      payment_method: "mpesa",
      principal_amount: "",
      interest_amount: "",
      fee_amount: "",
      penalty_amount: "",
    },
  });

  const watchedType = form.watch("type");
  const watchedLoanId = form.watch("loan_id");
  const watchedUseStrategy = form.watch("use_strategy_allocation");

  // Load available loans based on transaction type
  useEffect(() => {
    if (!profile?.tenant_id || !open) return;

    const loadLoans = async () => {
      let query = supabase
        .from('loans')
        .select(`
          *,
          clients!inner(first_name, last_name, client_number),
          loan_products!inner(name, currency_code)
        `)
        .eq('tenant_id', profile.tenant_id);

      if (clientId) {
        query = query.eq('client_id', clientId);
      }

      // Filter by loan status based on transaction type
      if (watchedType === 'disbursement') {
        query = query.eq('status', 'approved');
      } else if (['repayment', 'charge'].includes(watchedType)) {
        query = query.in('status', ['active', 'overdue']);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (!error && data) {
        setAvailableLoans(data);
      }
    };

    loadLoans();
  }, [profile?.tenant_id, watchedType, clientId, open]);

  // Load loan details when loan is selected
  useEffect(() => {
    if (!watchedLoanId) {
      setSelectedLoanDetails(null);
      return;
    }

    const loadLoanDetails = async () => {
      const { data: loan } = await supabase
        .from('loans')
        .select(`
          *,
          clients!inner(first_name, last_name),
          loan_products!inner(
            name,
            currency_code,
            repayment_strategy,
            default_nominal_interest_rate
          )
        `)
        .eq('id', watchedLoanId)
        .single();

      setSelectedLoanDetails(loan);

      // Load available payments for reversal
      if (watchedType === 'reversal') {
        const { data: payments } = await supabase
          .from('loan_payments')
          .select('*')
          .eq('loan_id', watchedLoanId)
          .eq('tenant_id', profile?.tenant_id)
          .not('payment_method', 'like', '%_REVERSED')
          .order('payment_date', { ascending: false });
        
        setAvailablePayments(payments || []);
      }
    };

    loadLoanDetails();
  }, [watchedLoanId, watchedType, profile?.tenant_id]);

  const onSubmit = async (data: PaymentFormData) => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      const transactionData: LoanTransactionData = {
        type: data.type,
        loan_id: data.loan_id,
        amount: Number(data.amount),
        transaction_date: format(data.transaction_date, 'yyyy-MM-dd'),
        payment_method: data.payment_method,
        reference_number: data.reference_number,
        description: data.description,
        use_strategy_allocation: data.use_strategy_allocation,
        principal_amount: data.principal_amount ? Number(data.principal_amount) : undefined,
        interest_amount: data.interest_amount ? Number(data.interest_amount) : undefined,
        fee_amount: data.fee_amount ? Number(data.fee_amount) : undefined,
        penalty_amount: data.penalty_amount ? Number(data.penalty_amount) : undefined,
        charge_type: data.charge_type,
        fee_structure_id: data.fee_structure_id,
        original_payment_id: data.original_payment_id,
        reversal_reason: data.reversal_reason,
      };

      await loanTransactionManager.mutateAsync(transactionData);
      
      form.reset();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Transaction processing error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTransactionIcon = () => {
    switch (watchedType) {
      case 'disbursement':
        return <DollarSign className="h-5 w-5 text-green-600" />;
      case 'repayment':
        return <CreditCard className="h-5 w-5 text-blue-600" />;
      case 'charge':
        return <Receipt className="h-5 w-5 text-orange-600" />;
      case 'reversal':
        return <CreditCard className="h-5 w-5 text-red-600" />;
      default:
        return <DollarSign className="h-5 w-5" />;
    }
  };

  const getTransactionTitle = () => {
    switch (watchedType) {
      case 'disbursement':
        return 'Loan Disbursement';
      case 'repayment':
        return 'Loan Repayment';
      case 'charge':
        return 'Apply Loan Charge';
      case 'reversal':
        return 'Reverse Payment';
      default:
        return 'Loan Transaction';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getTransactionIcon()}
            {getTransactionTitle()}
          </DialogTitle>
          <DialogDescription>
            Process loan transactions with unified accounting and schedule management
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Transaction Type and Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="type"
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
                        <SelectItem value="disbursement">Disbursement</SelectItem>
                        <SelectItem value="repayment">Repayment</SelectItem>
                        <SelectItem value="charge">Charge/Fee</SelectItem>
                        <SelectItem value="reversal">Reversal</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="loan_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select Loan</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a loan" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableLoans.map((loan) => (
                          <SelectItem key={loan.id} value={loan.id}>
                            <div className="flex flex-col">
                              <span>{loan.loan_number}</span>
                              <span className="text-sm text-muted-foreground">
                                {loan.clients.first_name} {loan.clients.last_name} - 
                                {new Intl.NumberFormat('en-KE', {
                                  style: 'currency',
                                  currency: 'KES',
                                }).format(loan.principal_amount || loan.outstanding_balance || 0)}
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
            </div>

            {/* Loan Details Display */}
            {selectedLoanDetails && (
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">Loan Details</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Client:</span>
                    <p>{selectedLoanDetails.clients.first_name} {selectedLoanDetails.clients.last_name}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Product:</span>
                    <p>{selectedLoanDetails.loan_products.name}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Outstanding:</span>
                    <p>{new Intl.NumberFormat('en-KE', {
                      style: 'currency',
                      currency: 'KES',
                    }).format(selectedLoanDetails.outstanding_balance || 0)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Status:</span>
                    <Badge variant="outline">{selectedLoanDetails.status}</Badge>
                  </div>
                </div>
              </div>
            )}

            {/* Payment Method and Date */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="payment_method"
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
                name="transaction_date"
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

            {/* Repayment-specific fields */}
            {watchedType === 'repayment' && (
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="use_strategy_allocation"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Use automatic allocation strategy
                        </FormLabel>
                        <p className="text-sm text-muted-foreground">
                          Automatically allocate payment according to the loan product's repayment strategy
                        </p>
                      </div>
                    </FormItem>
                  )}
                />

                {!watchedUseStrategy && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <FormField
                      control={form.control}
                      name="principal_amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Principal Amount</FormLabel>
                          <FormControl>
                            <Input placeholder="0.00" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="interest_amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Interest Amount</FormLabel>
                          <FormControl>
                            <Input placeholder="0.00" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="fee_amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fee Amount</FormLabel>
                          <FormControl>
                            <Input placeholder="0.00" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="penalty_amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Penalty Amount</FormLabel>
                          <FormControl>
                            <Input placeholder="0.00" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Charge-specific fields */}
            {watchedType === 'charge' && (
              <FormField
                control={form.control}
                name="charge_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Charge Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select charge type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="fee">Fee</SelectItem>
                        <SelectItem value="penalty">Penalty</SelectItem>
                        <SelectItem value="interest">Interest</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Reversal-specific fields */}
            {watchedType === 'reversal' && (
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="original_payment_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment to Reverse</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select payment to reverse" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availablePayments.map((payment) => (
                            <SelectItem key={payment.id} value={payment.id}>
                              <div className="flex flex-col">
                                <span>{format(new Date(payment.payment_date), 'PPP')}</span>
                                <span className="text-sm text-muted-foreground">
                                  {new Intl.NumberFormat('en-KE', {
                                    style: 'currency',
                                    currency: 'KES',
                                  }).format(payment.payment_amount)} - {payment.payment_method}
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

                <FormField
                  control={form.control}
                  name="reversal_reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reversal Reason</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Provide a detailed reason for the reversal..." 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Common fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="reference_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reference Number</FormLabel>
                    <FormControl>
                      <Input placeholder="External reference (optional)" {...field} />
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
                      <Input placeholder="Additional notes (optional)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Processing..." : `Process ${getTransactionTitle()}`}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};