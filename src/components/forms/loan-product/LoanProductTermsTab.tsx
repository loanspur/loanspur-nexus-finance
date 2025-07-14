import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UseFormReturn } from "react-hook-form";
import { LoanProductFormData } from "./LoanProductSchema";

interface LoanProductTermsTabProps {
  form: UseFormReturn<LoanProductFormData>;
}

export const LoanProductTermsTab = ({ form }: LoanProductTermsTabProps) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <FormField
          control={form.control}
          name="min_principal"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Min Principal</FormLabel>
              <FormControl>
                <Input type="number" placeholder="1000" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="max_principal"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Max Principal</FormLabel>
              <FormControl>
                <Input type="number" placeholder="50000" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="default_principal"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Default Principal</FormLabel>
              <FormControl>
                <Input type="number" placeholder="10000" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <FormField
          control={form.control}
          name="min_term"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Min Term (Months)</FormLabel>
              <FormControl>
                <Input type="number" placeholder="1" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="max_term"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Max Term (Months)</FormLabel>
              <FormControl>
                <Input type="number" placeholder="60" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="default_term"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Default Term (Months)</FormLabel>
              <FormControl>
                <Input type="number" placeholder="12" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

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
  );
};