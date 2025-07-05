import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { UseFormReturn } from "react-hook-form";
import { LoanProductFormData } from "./LoanProductSchema";

interface LoanProductArrearsTabProps {
  form: UseFormReturn<LoanProductFormData>;
}

export const LoanProductArrearsTab = ({ form }: LoanProductArrearsTabProps) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="overdue_days_for_arrears"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Days Overdue for Arrears</FormLabel>
              <FormControl>
                <Input type="number" placeholder="1" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="overdue_days_for_npa"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Days Overdue for NPA</FormLabel>
              <FormControl>
                <Input type="number" placeholder="90" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="account_moves_out_of_npa_only_on_arrears_completion"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
            <div className="space-y-0.5">
              <FormLabel>Account moves out of NPA only after all arrears are cleared</FormLabel>
              <div className="text-sm text-muted-foreground">
                When enabled, loans can only exit NPA status after clearing all outstanding amounts
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

      <FormField
        control={form.control}
        name="overdue_charge_applicable"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
            <div className="space-y-0.5">
              <FormLabel>Overdue Charge Applicable</FormLabel>
              <div className="text-sm text-muted-foreground">
                Enable automatic overdue charges on late payments
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

      {form.watch("overdue_charge_applicable") && (
        <FormField
          control={form.control}
          name="overdue_charge_calculation_method"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Overdue Charge Calculation Method</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="outstanding_principal">Outstanding Principal</SelectItem>
                  <SelectItem value="original_principal">Original Principal</SelectItem>
                  <SelectItem value="overdue_principal">Overdue Principal</SelectItem>
                  <SelectItem value="overdue_principal_interest">Overdue Principal + Interest</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
    </div>
  );
};