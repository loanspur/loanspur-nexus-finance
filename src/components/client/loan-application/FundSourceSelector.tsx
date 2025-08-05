import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Control } from "react-hook-form";
import { useFunds } from "@/hooks/useFundsManagement";

interface FundSourceSelectorProps {
  control: Control<any>;
}

export const FundSourceSelector = ({ control }: FundSourceSelectorProps) => {
  const { data: funds = [], isLoading: fundsLoading } = useFunds();

  return (
    <FormField
      control={control}
      name="fund_source_id"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Fund Source *</FormLabel>
          <Select 
            onValueChange={field.onChange} 
            value={field.value}
            disabled={fundsLoading}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder={fundsLoading ? "Loading funds..." : "Select fund source"} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {funds && funds.length > 0 ? (
                funds.map((fund) => (
                  <SelectItem key={fund.id} value={fund.id}>
                    {fund.fund_name} ({fund.fund_code}) - Balance: {fund.current_balance?.toLocaleString() || 0}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="" disabled>
                  No funds available
                </SelectItem>
              )}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};