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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { PiggyBank } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const addSavingsAccountSchema = z.object({
  savings_product_id: z.string().min(1, "Please select a savings product"),
  initial_deposit: z.string().min(1, "Initial deposit is required"),
  account_purpose: z.string().optional(),
});

type AddSavingsAccountData = z.infer<typeof addSavingsAccountSchema>;

interface AddSavingsAccountDialogProps {
  clientId: string;
  clientName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const AddSavingsAccountDialog = ({ 
  clientId, 
  clientName, 
  open, 
  onOpenChange,
  onSuccess 
}: AddSavingsAccountDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<AddSavingsAccountData>({
    resolver: zodResolver(addSavingsAccountSchema),
    defaultValues: {
      savings_product_id: "",
      initial_deposit: "",
      account_purpose: "",
    },
  });

  const onSubmit = async (data: AddSavingsAccountData) => {
    setIsSubmitting(true);
    try {
      // Here you would call your API to create the savings account
      const savingsAccountData = {
        client_id: clientId,
        savings_product_id: data.savings_product_id,
        initial_deposit: parseFloat(data.initial_deposit),
        account_purpose: data.account_purpose,
        status: 'pending_approval',
      };

      console.log('Creating savings account:', savingsAccountData);

      toast({
        title: "Success",
        description: `Savings account created successfully for ${clientName}`,
      });

      form.reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Error creating savings account:", error);
      toast({
        title: "Error",
        description: "Failed to create savings account",
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
            <PiggyBank className="h-5 w-5 text-green-600" />
            Add Savings Account
          </DialogTitle>
          <DialogDescription>
            Create a new savings account for {clientName}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="savings_product_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Savings Product *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a savings product" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="regular">Regular Savings (3.5% p.a.)</SelectItem>
                      <SelectItem value="premium">Premium Savings (5.0% p.a.)</SelectItem>
                      <SelectItem value="fixed">Fixed Deposit (8.0% p.a.)</SelectItem>
                      <SelectItem value="target">Target Savings (4.0% p.a.)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="initial_deposit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Initial Deposit (KES) *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="e.g. 5000"
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
              name="account_purpose"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account Purpose (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. Emergency fund, School fees"
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
                {isSubmitting ? "Creating..." : "Create Account"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};