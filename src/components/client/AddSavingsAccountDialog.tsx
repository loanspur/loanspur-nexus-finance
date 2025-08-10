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
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { PiggyBank, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCreateSavingsAccount, useSavingsProducts } from "@/hooks/useSupabase";
import { useAuth } from "@/hooks/useAuth";
import { useFeeStructures } from "@/hooks/useFeeManagement";
import { useProcessSavingsTransaction } from "@/hooks/useSavingsManagement";
import { calculateFeeAmount } from "@/lib/fee-calculation";

const addSavingsAccountSchema = z
  .object({
    savings_product_id: z.string().min(1, "Please select a savings product"),
    initial_deposit: z.string().min(1, "Initial deposit is required"),
    account_purpose: z.string().optional(),
    created_date: z.string().min(1, "Created date is required"),
    approved_date: z.string().optional(),
    activated_date: z.string().optional(),
    activation_fee_ids: z.array(z.string()).default([]),
  })
  .superRefine((val, ctx) => {
    const amount = parseFloat(val.initial_deposit || "0");
    if (!isFinite(amount) || amount <= 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['initial_deposit'], message: 'Enter a positive amount' });
    }
    const cd = val.created_date ? new Date(val.created_date) : null;
    const ad = val.approved_date ? new Date(val.approved_date) : null;
    const actd = val.activated_date ? new Date(val.activated_date) : null;
    if (ad && cd && ad < cd) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['approved_date'], message: 'Approved date must be on/after created date' });
    }
    if (actd && cd && actd < cd) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['activated_date'], message: 'Activated date must be on/after created date' });
    }
    if (actd && ad && actd < ad) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['activated_date'], message: 'Activated date must be on/after approved date' });
    }
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
  const { profile } = useAuth();
const createSavingsAccount = useCreateSavingsAccount();
const { data: savingsProducts = [], isLoading } = useSavingsProducts();
const { data: allFeeStructures = [] } = useFeeStructures();
const activationFeeOptions = allFeeStructures.filter(
  (fee) => fee.is_active && ['savings', 'savings_maintenance', 'savings_charge', 'account_charge'].includes(fee.fee_type)
);
const processTransaction = useProcessSavingsTransaction();

const form = useForm<AddSavingsAccountData>({
  resolver: zodResolver(addSavingsAccountSchema),
  mode: 'onChange',
  defaultValues: {
    savings_product_id: "",
    initial_deposit: "",
    account_purpose: "",
    created_date: new Date().toISOString().split('T')[0],
    approved_date: "",
    activated_date: "",
    activation_fee_ids: [],
  },
});

const watchedDeposit = form.watch('initial_deposit');
const watchedFeeIds = form.watch('activation_fee_ids');
const baseAmount = parseFloat(watchedDeposit || "0") || 0;

  const onSubmit = async (data: AddSavingsAccountData) => {
    if (!profile?.tenant_id) {
      toast({
        title: "Error",
        description: "No tenant information available",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
const savingsAccountData = {
  client_id: clientId,
  savings_product_id: data.savings_product_id,
  account_balance: parseFloat(data.initial_deposit),
  available_balance: parseFloat(data.initial_deposit),
  interest_earned: 0,
  tenant_id: profile.tenant_id,
  is_active: true,
  opened_date: data.created_date,
  created_date: data.created_date,
  approved_date: data.approved_date || null,
  activated_date: data.activated_date || null,
  account_number: `SAV-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
};

const created = await createSavingsAccount.mutateAsync(savingsAccountData);

// Apply selected activation fees immediately
if (created?.id && (data.activation_fee_ids?.length || 0) > 0) {
  const baseAmount = parseFloat(data.initial_deposit);
  const selectedFees = activationFeeOptions.filter((f) => data.activation_fee_ids?.includes(f.id));
  for (const fee of selectedFees) {
    const calc = calculateFeeAmount({
      id: fee.id,
      name: fee.name,
      calculation_type: fee.calculation_type as any,
      amount: fee.amount,
      min_amount: fee.min_amount,
      max_amount: fee.max_amount,
      fee_type: fee.fee_type,
      charge_time_type: fee.charge_time_type,
    }, baseAmount);

    if (calc.calculated_amount > 0) {
      await processTransaction.mutateAsync({
        savings_account_id: created.id,
        transaction_type: 'fee_charge',
        amount: calc.calculated_amount,
        transaction_date: (data.activated_date || data.created_date) || new Date().toISOString().split('T')[0],
        description: `${fee.name} activation fee`,
        reference_number: `FEE-${fee.id.slice(-6).toUpperCase()}`,
      });
    }
  }
}

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
                      {isLoading ? (
                        <SelectItem value="" disabled>Loading products...</SelectItem>
                      ) : savingsProducts.length === 0 ? (
                        <SelectItem value="" disabled>No savings products available</SelectItem>
                      ) : (
                        savingsProducts.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name} ({product.nominal_annual_interest_rate}% p.a.)
                          </SelectItem>
                        ))
                      )}
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

<div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
  <FormField
    control={form.control}
    name="created_date"
    render={({ field }) => (
      <FormItem>
        <FormLabel>Created Date *</FormLabel>
        <FormControl>
          <Input type="date" {...field} />
        </FormControl>
        <FormMessage />
      </FormItem>
    )}
  />
  <FormField
    control={form.control}
    name="approved_date"
    render={({ field }) => (
      <FormItem>
        <FormLabel>Approved Date</FormLabel>
        <FormControl>
          <Input type="date" {...field} />
        </FormControl>
        <FormMessage />
      </FormItem>
    )}
  />
  <FormField
    control={form.control}
    name="activated_date"
    render={({ field }) => (
      <FormItem>
        <FormLabel>Activated Date</FormLabel>
        <FormControl>
          <Input type="date" {...field} />
        </FormControl>
        <FormMessage />
      </FormItem>
    )}
  />
</div>

<div className="space-y-3 border-t pt-4">
  <div>
    <FormLabel>Fees to charge on activation</FormLabel>
    <p className="text-sm text-muted-foreground">These fees will post immediately after account creation.</p>
  </div>
  <TooltipProvider>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {activationFeeOptions.length === 0 ? (
        <div className="text-sm text-muted-foreground">No savings fees available.</div>
      ) : (
        activationFeeOptions.map((fee) => {
          const selected = (form.getValues('activation_fee_ids') || []).includes(fee.id);
          const calc = calculateFeeAmount({
            id: fee.id,
            name: fee.name,
            calculation_type: fee.calculation_type as any,
            amount: fee.amount,
            min_amount: fee.min_amount,
            max_amount: fee.max_amount,
            fee_type: fee.fee_type,
            charge_time_type: fee.charge_time_type,
          }, baseAmount);
          const applied = calc.applied_limit ? (calc.applied_limit === 'minimum' ? 'Min applied' : 'Max applied') : null;
          const amountStr = `KES ${calc.calculated_amount.toLocaleString('en-KE')}`;
          const detailText = fee.calculation_type === 'percentage'
            ? `${fee.amount}% of KES ${baseAmount.toLocaleString('en-KE')}${applied ? ` • ${applied}` : ''}`
            : `${amountStr}${applied ? ` • ${applied}` : ''}`;
          return (
            <div key={fee.id} className="flex items-center gap-3 p-3 border rounded-lg">
              <Checkbox
                checked={selected}
                onCheckedChange={(checked) => {
                  const current = new Set(form.getValues('activation_fee_ids') || []);
                  if (checked) current.add(fee.id); else current.delete(fee.id);
                  form.setValue('activation_fee_ids', Array.from(current));
                }}
                id={`fee-${fee.id}`}
              />
              <Label htmlFor={`fee-${fee.id}`} className="flex-1">
                <div className="font-medium">{fee.name}</div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  {amountStr}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3.5 w-3.5" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{detailText}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </Label>
            </div>
          );
        })
      )}
    </div>
  </TooltipProvider>
</div>

<div className="flex justify-end gap-2 pt-4">
  <Button
    type="button"
    variant="outline"
    onClick={() => onOpenChange(false)}
  >
    Cancel
  </Button>
  <Button type="submit" disabled={isSubmitting || !form.formState.isValid}>
    {isSubmitting ? "Creating..." : ((watchedFeeIds?.length || 0) > 0 ? "Create & Apply Fees" : "Create Account")}
  </Button>
</div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};