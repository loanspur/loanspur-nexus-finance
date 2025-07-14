import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { UseFormReturn } from "react-hook-form";
import { LoanProductFormData } from "./LoanProductSchema";
import { Separator } from "@/components/ui/separator";

interface LoanProductInterestTabProps {
  form: UseFormReturn<LoanProductFormData>;
}

export const LoanProductInterestTab = ({ form }: LoanProductInterestTabProps) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Interest Rate Configuration</h3>
        <p className="text-sm text-muted-foreground mb-4">Configure interest rate ranges and calculation methods</p>
        
        <div className="grid grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="min_nominal_interest_rate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Min Interest Rate (%)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="5.0" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="max_nominal_interest_rate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Max Interest Rate (%)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="25.0" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="default_nominal_interest_rate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Default Interest Rate (%)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="12.0" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="text-lg font-medium">Interest Calculation Settings</h3>
        <p className="text-sm text-muted-foreground mb-4">Configure how interest is calculated</p>
        
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="interest_calculation_method"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Interest Calculation Method</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select calculation method" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="declining_balance">Declining Balance</SelectItem>
                    <SelectItem value="flat">Flat</SelectItem>
                    <SelectItem value="compound">Compound</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="interest_calculation_period"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Interest Calculation Period</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select calculation period" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="compounding_frequency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Compounding Frequency</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select compounding frequency" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="annually">Annually</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="allow_partial_period_interest"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Allow Partial Period Interest</FormLabel>
                  <div className="text-sm text-muted-foreground">
                    Allow interest calculation for partial periods
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
      </div>

      <Separator />

      <div>
        <h3 className="text-lg font-medium">Grace Period & Tolerance</h3>
        <p className="text-sm text-muted-foreground mb-4">Configure grace periods and tolerance settings</p>
        
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="grace_period_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Grace Period Type</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select grace period type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="principal">Principal Only</SelectItem>
                    <SelectItem value="interest">Interest Only</SelectItem>
                    <SelectItem value="both">Both Principal & Interest</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="grace_period_duration"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Grace Period Duration (Days)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="0" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="arrears_tolerance_amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Arrears Tolerance Amount</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" placeholder="0.00" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="arrears_tolerance_days"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Arrears Tolerance Days</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="0" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="moratorium_period"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Moratorium Period (Months)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="0" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
    </div>
  );
};