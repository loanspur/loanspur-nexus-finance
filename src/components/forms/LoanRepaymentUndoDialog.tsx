import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, DollarSign, Calendar, CreditCard, Undo2 } from "lucide-react";
import { format } from "date-fns";
import { useLoanRepaymentUndo } from "@/hooks/useLoanRepaymentUndo";
import { useCurrency } from "@/contexts/CurrencyContext";

const undoSchema = z.object({
  reason: z.string().min(10, "Reason must be at least 10 characters"),
  notes: z.string().optional(),
});

type UndoFormData = z.infer<typeof undoSchema>;

interface LoanRepaymentUndoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment: {
    id: string;
    loan_id: string;
    payment_amount: number;
    principal_amount: number;
    interest_amount: number;
    fee_amount?: number;
    penalty_amount?: number;
    payment_date: string;
    payment_method: string;
    reference_number?: string;
    status?: string;
  } | null;
  loanNumber?: string;
}

export const LoanRepaymentUndoDialog = ({ 
  open, 
  onOpenChange, 
  payment,
  loanNumber 
}: LoanRepaymentUndoDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const undoMutation = useLoanRepaymentUndo();
  const { formatAmount } = useCurrency();

  const form = useForm<UndoFormData>({
    resolver: zodResolver(undoSchema),
    defaultValues: {
      reason: "",
      notes: "",
    },
  });

  const onSubmit = async (data: UndoFormData) => {
    if (!payment) return;

    setIsSubmitting(true);
    try {
      await undoMutation.mutateAsync({
        paymentId: payment.id,
        loanId: payment.loan_id,
        reason: data.reason,
        notes: data.notes,
      });
      
      form.reset();
      onOpenChange(false);
    } catch (error) {
      // Error is handled by the mutation's onError
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!payment) return null;

  const formatPaymentMethod = (method: string) => {
    return method.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  // Check if payment is already reversed or in invalid state
  const isReversed = payment.status === 'reversed' || payment.payment_method?.includes('_REVERSED');
  const canReverse = !isReversed;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Undo2 className="h-5 w-5 text-orange-600" />
            Undo Loan Repayment
          </DialogTitle>
          <DialogDescription>
            This action will reverse the selected loan repayment and all associated journal entries. This cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Payment Details */}
          <Card className={isReversed ? "border-gray-300 bg-gray-50" : "border-orange-200 bg-orange-50"}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className={`font-semibold ${isReversed ? 'text-gray-700' : 'text-orange-900'}`}>
                  Repayment to Reverse
                </h3>
                {isReversed && (
                  <Badge variant="secondary" className="bg-gray-200 text-gray-700">
                    Already Reversed
                  </Badge>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className={`font-medium ${isReversed ? 'text-gray-600' : 'text-orange-700'}`}>
                      Payment ID:
                    </span>
                    <span className="font-mono">{payment.reference_number || payment.id.slice(-8)}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Calendar className={`h-4 w-4 ${isReversed ? 'text-gray-500' : 'text-orange-600'}`} />
                    <span className={`font-medium ${isReversed ? 'text-gray-600' : 'text-orange-700'}`}>
                      Date:
                    </span>
                    <span>{format(new Date(payment.payment_date), "MMM dd, yyyy")}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <CreditCard className={`h-4 w-4 ${isReversed ? 'text-gray-500' : 'text-orange-600'}`} />
                    <span className={`font-medium ${isReversed ? 'text-gray-600' : 'text-orange-700'}`}>
                      Method:
                    </span>
                    <span>{formatPaymentMethod(payment.payment_method)}</span>
                  </div>

                  {loanNumber && (
                    <div className="flex items-center gap-2">
                      <span className={`font-medium ${isReversed ? 'text-gray-600' : 'text-orange-700'}`}>
                        Loan:
                      </span>
                      <span className="font-mono">{loanNumber}</span>
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <DollarSign className={`h-4 w-4 ${isReversed ? 'text-gray-500' : 'text-orange-600'}`} />
                    <span className={`font-medium ${isReversed ? 'text-gray-600' : 'text-orange-700'}`}>
                      Total Amount:
                    </span>
                    <span className="font-bold">{formatAmount(payment.payment_amount)}</span>
                  </div>
                  
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className={isReversed ? 'text-gray-600' : 'text-orange-700'}>Principal:</span>
                      <span className="font-medium">{formatAmount(payment.principal_amount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={isReversed ? 'text-gray-600' : 'text-orange-700'}>Interest:</span>
                      <span className="font-medium">{formatAmount(payment.interest_amount)}</span>
                    </div>
                    {payment.fee_amount && payment.fee_amount > 0 && (
                      <div className="flex justify-between">
                        <span className={isReversed ? 'text-gray-600' : 'text-orange-700'}>Fees:</span>
                        <span className="font-medium">{formatAmount(payment.fee_amount)}</span>
                      </div>
                    )}
                    {payment.penalty_amount && payment.penalty_amount > 0 && (
                      <div className="flex justify-between">
                        <span className={isReversed ? 'text-gray-600' : 'text-orange-700'}>Penalties:</span>
                        <span className="font-medium">{formatAmount(payment.penalty_amount)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Warning Alert */}
          {canReverse ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-yellow-800">Important Warning</h4>
                  <ul className="text-sm text-yellow-700 mt-2 space-y-1">
                    <li>• This will create reverse journal entries for all accounting impacts</li>
                    <li>• The loan outstanding balance will be increased by the payment amount</li>
                    <li>• Loan schedules will be updated to reflect the reversal</li>
                    <li>• If the loan was closed, it will be reopened as active</li>
                    <li>• This action cannot be undone - original transaction will be marked as reversed</li>
                    <li>• All stakeholders will be notified of the reversal</li>
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-gray-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-gray-800">Cannot Reverse Payment</h4>
                  <p className="text-sm text-gray-700 mt-2">
                    This payment has already been reversed and cannot be processed again.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Undo Form */}
          {canReverse && (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reason for Reversal *</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Provide a detailed reason for reversing this loan repayment..."
                          rows={4}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Notes</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Any additional information or instructions..."
                          rows={3}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    variant="destructive" 
                    disabled={isSubmitting || !canReverse}
                  >
                    {isSubmitting ? "Reversing..." : "Reverse Payment"}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};