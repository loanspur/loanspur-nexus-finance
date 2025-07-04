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
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const addLoanAccountSchema = z.object({
  loan_product_id: z.string().min(1, "Please select a loan product"),
  requested_amount: z.string().min(1, "Loan amount is required"),
  loan_purpose: z.string().min(1, "Loan purpose is required"),
  repayment_period: z.string().min(1, "Repayment period is required"),
  collateral_description: z.string().optional(),
});

type AddLoanAccountData = z.infer<typeof addLoanAccountSchema>;

interface AddLoanAccountDialogProps {
  clientId: string;
  clientName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const AddLoanAccountDialog = ({ 
  clientId, 
  clientName, 
  open, 
  onOpenChange,
  onSuccess 
}: AddLoanAccountDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<AddLoanAccountData>({
    resolver: zodResolver(addLoanAccountSchema),
    defaultValues: {
      loan_product_id: "",
      requested_amount: "",
      loan_purpose: "",
      repayment_period: "",
      collateral_description: "",
    },
  });

  const onSubmit = async (data: AddLoanAccountData) => {
    setIsSubmitting(true);
    try {
      // Here you would call your API to create the loan application
      const loanApplicationData = {
        client_id: clientId,
        loan_product_id: data.loan_product_id,
        requested_amount: parseFloat(data.requested_amount),
        loan_purpose: data.loan_purpose,
        repayment_period_months: parseInt(data.repayment_period),
        collateral_description: data.collateral_description,
        status: 'pending_approval',
        application_date: new Date().toISOString(),
      };

      console.log('Creating loan application:', loanApplicationData);

      toast({
        title: "Success",
        description: `Loan application submitted successfully for ${clientName}`,
      });

      form.reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Error creating loan application:", error);
      toast({
        title: "Error",
        description: "Failed to submit loan application",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-orange-600" />
            Add Loan Account
          </DialogTitle>
          <DialogDescription>
            Create a new loan application for {clientName}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="loan_product_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Loan Product *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a loan product" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="personal">Personal Loan (12% p.a.)</SelectItem>
                      <SelectItem value="business">Business Loan (10% p.a.)</SelectItem>
                      <SelectItem value="emergency">Emergency Loan (15% p.a.)</SelectItem>
                      <SelectItem value="asset">Asset Finance (14% p.a.)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="requested_amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Requested Amount (KES) *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="e.g. 100000"
                      min="0"
                      step="0.01"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="repayment_period"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Repayment Period *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select repayment period" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="6">6 months</SelectItem>
                      <SelectItem value="12">12 months</SelectItem>
                      <SelectItem value="18">18 months</SelectItem>
                      <SelectItem value="24">24 months</SelectItem>
                      <SelectItem value="36">36 months</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="loan_purpose"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Loan Purpose *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. Business expansion, School fees"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="collateral_description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Collateral Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe any collateral or security for this loan"
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit Application"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};