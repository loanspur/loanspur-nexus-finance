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
import { AlertTriangle, DollarSign, Calendar, CreditCard } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

const reversalSchema = z.object({
  reason: z.string().min(10, "Reason must be at least 10 characters"),
  notes: z.string().optional(),
});

type ReversalFormData = z.infer<typeof reversalSchema>;

interface PaymentReversalFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: any;
}

export const PaymentReversalForm = ({ open, onOpenChange, transaction }: PaymentReversalFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<ReversalFormData>({
    resolver: zodResolver(reversalSchema),
    defaultValues: {
      reason: "",
      notes: "",
    },
  });

  const onSubmit = async (data: ReversalFormData) => {
    setIsSubmitting(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Payment Reversed",
        description: "The payment has been successfully reversed.",
      });
      
      form.reset();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reverse payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!transaction) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            Reverse Payment
          </DialogTitle>
          <DialogDescription>
            This action will reverse the selected payment transaction. This cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Transaction Details */}
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <h3 className="font-semibold text-red-900 mb-3">Transaction to Reverse</h3>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-red-700 font-medium">Transaction ID:</span>
                    <span className="font-mono">{transaction.transaction_id}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-red-600" />
                    <span className="text-red-700 font-medium">Date:</span>
                    <span>{format(new Date(transaction.transaction_date), "MMM dd, yyyy")}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-red-600" />
                    <span className="text-red-700 font-medium">Payment Method:</span>
                    <span>{formatPaymentType(transaction.payment_type)}</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-red-600" />
                    <span className="text-red-700 font-medium">Amount:</span>
                    <span className="font-bold">KSh {Number(transaction.amount).toLocaleString()}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-red-700 font-medium">Type:</span>
                    <Badge className="bg-red-100 text-red-800">
                      {formatTransactionType(transaction.transaction_type)}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-red-700 font-medium">Status:</span>
                    <Badge className={getStatusColor(transaction.payment_status)}>
                      {transaction.payment_status}
                    </Badge>
                  </div>
                </div>
              </div>
              
              {transaction.description && (
                <div className="mt-3 pt-3 border-t border-red-200">
                  <span className="text-red-700 font-medium">Description:</span>
                  <p className="text-red-800 mt-1">{transaction.description}</p>
                </div>
              )}
              
              {transaction.mpesa_receipt_number && (
                <div className="mt-2">
                  <span className="text-red-700 font-medium">M-Pesa Receipt:</span>
                  <span className="ml-2 font-mono">{transaction.mpesa_receipt_number}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Warning Alert */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-yellow-800">Important Warning</h4>
                <ul className="text-sm text-yellow-700 mt-2 space-y-1">
                  <li>• This will create a reversal transaction</li>
                  <li>• The original transaction will be marked as reversed</li>
                  <li>• Account balances will be adjusted accordingly</li>
                  <li>• This action cannot be undone</li>
                  <li>• All stakeholders will be notified</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Reversal Form */}
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
                        placeholder="Provide a detailed reason for reversing this payment..."
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
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Reversing..." : "Reverse Payment"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
};