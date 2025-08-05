import { UseFormReturn } from "react-hook-form";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { AlertTriangle } from "lucide-react";

interface FeeFormFieldsProps {
  form: UseFormReturn<any>;
}

export const FeeFormFields = ({ form }: FeeFormFieldsProps) => {
  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fee Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Loan Processing Fee" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="loan">Loan</SelectItem>
                  <SelectItem value="savings">Savings</SelectItem>
                  <SelectItem value="account">Account</SelectItem>
                  <SelectItem value="transaction">Transaction</SelectItem>
                  <SelectItem value="penalty">Penalty</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fee Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select fee type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="fixed">Fixed Amount</SelectItem>
                  <SelectItem value="percentage">Percentage</SelectItem>
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
              <FormLabel>
                {form.watch("type") === "percentage" ? "Percentage (%)" : "Amount (KSh)"}
              </FormLabel>
              <FormControl>
                <Input 
                  type="number"
                  step="0.01"
                  placeholder={form.watch("type") === "percentage" ? "e.g., 2.5" : "e.g., 1000"} 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="applicableFor"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Applicable For</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select applicability" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="all">All Clients</SelectItem>
                <SelectItem value="new_clients">New Clients Only</SelectItem>
                <SelectItem value="existing_clients">Existing Clients Only</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="chargeTimeType"
          render={({ field }) => {
            const category = form.watch("category");
            const getChargeTimeOptions = () => {
              if (category === "savings") {
                return [
                  { value: "upfront", label: "Account Opening" },
                  { value: "monthly", label: "Monthly Maintenance" },
                  { value: "quarterly", label: "Quarterly" },
                  { value: "annually", label: "Annual Service" },
                  { value: "on_transaction", label: "Per Transaction" },
                  { value: "on_withdrawal", label: "On Withdrawal" },
                  { value: "on_deposit", label: "On Deposit" },
                ];
              } else if (category === "loan") {
                return [
                  { value: "upfront", label: "Application Fee" },
                  { value: "on_disbursement", label: "On Disbursement" },
                  { value: "monthly", label: "Monthly Service" },
                  { value: "instalment", label: "Per Instalment" },
                  { value: "on_maturity", label: "On Maturity" },
                  { value: "late_payment", label: "Late Payment" },
                  { value: "early_settlement", label: "Early Settlement" },
                ];
              } else {
                return [
                  { value: "upfront", label: "Upfront" },
                  { value: "monthly", label: "Monthly" },
                  { value: "annually", label: "Annually" },
                  { value: "on_transaction", label: "Per Transaction" },
                ];
              }
            };

            return (
              <FormItem>
                <FormLabel>Charge Time Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select charge time" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {getChargeTimeOptions().map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            );
          }}
        />

        <FormField
          control={form.control}
          name="chargePaymentBy"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Charge Payment By</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="regular">Regular</SelectItem>
                  <SelectItem value="transfer">Transfer</SelectItem>
                  <SelectItem value="client">Client</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                  <SelectItem value="automatic">Automatic</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Description</FormLabel>
            <FormControl>
              <Textarea 
                placeholder="Describe when this fee applies and any conditions..."
                {...field} 
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="space-y-4">
        <FormField
          control={form.control}
          name="isOverdueCharge"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 bg-orange-50 dark:bg-orange-950">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <FormLabel className="text-base font-semibold">Overdue/Penalty Charge</FormLabel>
                </div>
                <div className="text-sm text-muted-foreground">
                  Mark this fee as an overdue or penalty charge that applies only when loans go into arrears. 
                  This fee will be automatically triggered when payments become overdue.
                </div>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="isActive"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <FormLabel className="text-base">Active Status</FormLabel>
              <div className="text-sm text-muted-foreground">
                Enable this fee to be automatically applied
              </div>
            </div>
            <FormControl>
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </FormControl>
          </FormItem>
        )}
      />
    </>
  );
};