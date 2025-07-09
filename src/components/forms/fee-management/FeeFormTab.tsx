import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { FeeFormFields } from "./FeeFormFields";
import { Fee } from "./types";
import { useToast } from "@/hooks/use-toast";

const feeSchema = z.object({
  name: z.string().min(1, "Fee name is required"),
  type: z.enum(['fixed', 'percentage']),
  amount: z.string().min(1, "Amount is required").refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Amount must be a positive number",
  }),
  category: z.enum(['loan', 'savings', 'account', 'transaction', 'penalty']),
  chargeTimeType: z.enum(['upfront', 'monthly', 'annually', 'on_maturity', 'on_disbursement']),
  chargePaymentBy: z.enum(['client', 'system', 'automatic', 'manual']),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
  applicableFor: z.enum(['all', 'new_clients', 'existing_clients']),
});

type FeeFormData = z.infer<typeof feeSchema>;

interface FeeFormTabProps {
  editingFee: Fee | null;
  onComplete: () => void;
  onCancel: () => void;
}

export const FeeFormTab = ({ editingFee, onComplete, onCancel }: FeeFormTabProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<FeeFormData>({
    resolver: zodResolver(feeSchema),
    defaultValues: {
      name: editingFee?.name || "",
      type: editingFee?.type || "fixed",
      amount: editingFee?.amount?.toString() || "",
      category: editingFee?.category || "loan",
      chargeTimeType: editingFee?.chargeTimeType || "upfront",
      chargePaymentBy: editingFee?.chargePaymentBy || "client",
      description: editingFee?.description || "",
      isActive: editingFee?.isActive ?? true,
      applicableFor: editingFee?.applicableFor || "all",
    },
  });

  const onSubmit = async (data: FeeFormData) => {
    setIsSubmitting(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: editingFee ? "Fee Updated" : "Fee Created",
        description: editingFee 
          ? "The fee has been successfully updated." 
          : "The new fee has been successfully created.",
      });
      
      form.reset();
      onComplete();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save fee. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FeeFormFields form={form} />

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting 
              ? (editingFee ? "Updating..." : "Creating...") 
              : (editingFee ? "Update Fee" : "Create Fee")
            }
          </Button>
        </div>
      </form>
    </Form>
  );
};