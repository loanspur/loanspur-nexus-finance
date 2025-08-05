import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UseFormReturn } from "react-hook-form";
import { LoanProductFormData } from "./LoanProductSchema";
import { useFunds } from "@/hooks/useFundsManagement";
import { useCurrency } from "@/contexts/CurrencyContext";

interface LoanProductBasicInfoTabProps {
  form: UseFormReturn<LoanProductFormData>;
  tenantId: string;
}

export const LoanProductBasicInfoTab = ({ form, tenantId }: LoanProductBasicInfoTabProps) => {
  const { data: funds = [], isLoading: fundsLoading } = useFunds();
  const { currency, currencySymbol } = useCurrency();
  
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Product Name</FormLabel>
              <FormControl>
                <Input placeholder="Personal Loan" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="short_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Short Name</FormLabel>
              <FormControl>
                <Input placeholder="PL" {...field} />
              </FormControl>
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
              <Textarea placeholder="Loan product description..." {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="currency_code"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Currency</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value || currency}>
              <FormControl>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Default currency" />
                </SelectTrigger>
              </FormControl>
              <SelectContent className="bg-background border shadow-md z-50">
                <SelectItem value={currency}>
                  {currency} - {currencySymbol}
                </SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="fund_id"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Fund Type *</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value} disabled={fundsLoading}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder={fundsLoading ? "Loading funds..." : "Select fund type"} />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {funds.map((fund) => (
                  <SelectItem key={fund.id} value={fund.id}>
                    {fund.fund_name} ({fund.fund_code}) - {fund.fund_type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="repayment_frequency"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Repayment Frequency</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
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
    </div>
  );
};