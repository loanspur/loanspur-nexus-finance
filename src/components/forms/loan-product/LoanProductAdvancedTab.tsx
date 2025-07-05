import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { UseFormReturn } from "react-hook-form";
import { LoanProductFormData } from "./LoanProductSchema";

interface LoanProductAdvancedTabProps {
  form: UseFormReturn<LoanProductFormData>;
}

export const LoanProductAdvancedTab = ({ form }: LoanProductAdvancedTabProps) => {
  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="guarantee_funds_on_hold"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
            <div className="space-y-0.5">
              <FormLabel>Guarantee Funds on Hold</FormLabel>
              <div className="text-sm text-muted-foreground">
                Require guarantee funds to be held for this loan product
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

      {form.watch("guarantee_funds_on_hold") && (
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="minimum_guarantee_from_own_funds"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Min Guarantee from Own Funds (%)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="0.00" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="minimum_guarantee_from_guarantor_funds"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Min Guarantee from Guarantor Funds (%)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="0.00" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      )}

      <FormField
        control={form.control}
        name="include_in_borrower_cycle"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
            <div className="space-y-0.5">
              <FormLabel>Include in Borrower Cycle</FormLabel>
              <div className="text-sm text-muted-foreground">
                Include this product in borrower cycle calculations
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

      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="lock_in_period_frequency"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Lock-in Period Frequency</FormLabel>
              <FormControl>
                <Input type="number" placeholder="0" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="lock_in_period_frequency_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Lock-in Period Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="days">Days</SelectItem>
                  <SelectItem value="weeks">Weeks</SelectItem>
                  <SelectItem value="months">Months</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
};