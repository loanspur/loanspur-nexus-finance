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
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { DollarSign, CreditCard } from "lucide-react";

const paymentSchema = z.object({
  amount: z.number().min(1, "Amount must be greater than 0"),
  paymentMethod: z.string().min(1, "Payment method is required"),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

interface QuickPaymentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "loan_payment" | "deposit" | "withdrawal";
  accountId: string;
  clientName: string;
  maxAmount?: number;
}

export const QuickPaymentForm = ({ 
  open, 
  onOpenChange, 
  type, 
  accountId, 
  clientName,
  maxAmount 
}: QuickPaymentFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
  });

  const watchedAmount = watch("amount");

  const getTitle = () => {
    switch (type) {
      case "loan_payment":
        return "Record Loan Payment";
      case "deposit":
        return "Make Deposit";
      case "withdrawal":
        return "Make Withdrawal";
      default:
        return "Process Payment";
    }
  };

  const getDescription = () => {
    switch (type) {
      case "loan_payment":
        return `Record a payment for ${clientName}'s loan`;
      case "deposit":
        return `Make a deposit to ${clientName}'s savings account`;
      case "withdrawal":
        return `Process a withdrawal from ${clientName}'s savings account`;
      default:
        return "Process payment transaction";
    }
  };

  const onSubmit = async (data: PaymentFormData) => {
    setIsSubmitting(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: "Payment Processed",
        description: `${getTitle()} of ${new Intl.NumberFormat('en-KE', {
          style: 'currency',
          currency: 'KES',
        }).format(data.amount)} has been processed successfully.`,
      });
      
      reset();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {type === "loan_payment" ? (
              <CreditCard className="h-5 w-5 text-orange-600" />
            ) : (
              <DollarSign className="h-5 w-5 text-green-600" />
            )}
            {getTitle()}
          </DialogTitle>
          <DialogDescription>
            {getDescription()}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">
              Amount {maxAmount && `(Max: ${new Intl.NumberFormat('en-KE', {
                style: 'currency',
                currency: 'KES',
              }).format(maxAmount)})`}
            </Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder="Enter amount"
              {...register("amount", { 
                valueAsNumber: true,
                max: maxAmount || undefined,
              })}
              className={errors.amount ? "border-red-500" : ""}
            />
            {errors.amount && (
              <p className="text-sm text-red-500">{errors.amount.message}</p>
            )}
            {maxAmount && watchedAmount > maxAmount && (
              <p className="text-sm text-red-500">Amount exceeds maximum allowed</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentMethod">Payment Method</Label>
            <Select onValueChange={(value) => setValue("paymentMethod", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="mpesa">M-Pesa</SelectItem>
                <SelectItem value="cheque">Cheque</SelectItem>
                <SelectItem value="card">Debit/Credit Card</SelectItem>
              </SelectContent>
            </Select>
            {errors.paymentMethod && (
              <p className="text-sm text-red-500">{errors.paymentMethod.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="reference">Reference Number (Optional)</Label>
            <Input
              id="reference"
              placeholder="Transaction reference"
              {...register("reference")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Additional notes"
              {...register("notes")}
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || (maxAmount && watchedAmount > maxAmount)}
              className="flex-1"
            >
              {isSubmitting ? "Processing..." : `Process ${getTitle()}`}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};