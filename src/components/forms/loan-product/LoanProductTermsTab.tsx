import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UseFormReturn } from "react-hook-form";
import { LoanProductFormData } from "./LoanProductSchema";
import { useState, useEffect } from "react";

interface LoanProductTermsTabProps {
  form: UseFormReturn<LoanProductFormData>;
}

export const LoanProductTermsTab = ({ form }: LoanProductTermsTabProps) => {
  const [paymentFrequency, setPaymentFrequency] = useState("monthly");

  // Watch for payment frequency changes
  useEffect(() => {
    const subscription = form.watch((value) => {
      if (value.payment_frequency) {
        setPaymentFrequency(value.payment_frequency);
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  const getTermUnit = () => {
    switch (paymentFrequency) {
      case "daily":
        return "Days";
      case "weekly":
        return "Weeks";
      case "monthly":
        return "Months";
      default:
        return "Months";
    }
  };

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
              <FormLabel>Min Term ({getTermUnit()})</FormLabel>
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
              <FormLabel>Max Term ({getTermUnit()})</FormLabel>
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
              <FormLabel>Default Term ({getTermUnit()})</FormLabel>
              <FormControl>
                <Input type="number" placeholder="12" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

    </div>
  );
};