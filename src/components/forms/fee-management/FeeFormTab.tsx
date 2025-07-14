import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { FeeFormFields } from "./FeeFormFields";
import { Fee } from "./types";
import { useToast } from "@/hooks/use-toast";
import { useCreateFeeStructure, useUpdateFeeStructure } from "@/hooks/useFeeManagement";

const feeSchema = z.object({
  name: z.string().min(1, "Fee name is required"),
  type: z.enum(['fixed', 'percentage']),
  amount: z.string().min(1, "Amount is required").refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Amount must be a positive number",
  }),
  category: z.enum(['loan', 'savings', 'account', 'transaction', 'penalty']),
  chargeTimeType: z.enum(['upfront', 'monthly', 'quarterly', 'annually', 'on_maturity', 'on_disbursement', 'on_transaction', 'on_withdrawal', 'on_deposit', 'late_payment', 'early_settlement']),
  chargePaymentBy: z.enum(['regular', 'transfer', 'client', 'system', 'automatic', 'manual']),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
  applicableFor: z.enum(['all', 'new_clients', 'existing_clients']),
  isOverdueCharge: z.boolean().default(false),
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
  const createFeeStructure = useCreateFeeStructure();
  const updateFeeStructure = useUpdateFeeStructure();

  const form = useForm<FeeFormData>({
    resolver: zodResolver(feeSchema),
    defaultValues: {
      name: editingFee?.name || "",
      type: editingFee?.type || "fixed",
      amount: editingFee?.amount?.toString() || "",
      category: editingFee?.category || "loan",
      chargeTimeType: editingFee?.chargeTimeType || "upfront",
      chargePaymentBy: editingFee?.chargePaymentBy || "regular",
      description: editingFee?.description || "",
      isActive: editingFee?.isActive ?? true,
      applicableFor: editingFee?.applicableFor || "all",
      isOverdueCharge: editingFee?.isOverdueCharge ?? false,
    },
  });

  const onSubmit = async (data: FeeFormData) => {
    setIsSubmitting(true);
    try {
      const feeData = {
        name: data.name,
        description: data.description,
        fee_type: data.category,
        calculation_type: data.type,
        amount: Number(data.amount),
        percentage_rate: data.type === 'percentage' ? Number(data.amount) : undefined,
        min_amount: 0,
        charge_time_type: data.chargeTimeType,
        charge_payment_by: data.chargePaymentBy,
        is_active: data.isActive,
        is_overdue_charge: data.isOverdueCharge,
      };

      if (editingFee) {
        await updateFeeStructure.mutateAsync({ 
          id: editingFee.id, 
          data: feeData 
        });
      } else {
        await createFeeStructure.mutateAsync(feeData);
      }
      
      form.reset();
      onComplete();
    } catch (error) {
      console.error('Error saving fee:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const mapChargeTimeToFrequency = (chargeTime: string): 'one_time' | 'monthly' | 'quarterly' | 'annually' => {
    switch (chargeTime) {
      case 'monthly':
        return 'monthly';
      case 'quarterly':
        return 'quarterly';
      case 'annually':
        return 'annually';
      default:
        return 'one_time';
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