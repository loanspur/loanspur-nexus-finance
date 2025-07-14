import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Control } from "react-hook-form";

interface Fund {
  id: string;
  fund_name: string;
  fund_code: string;
  current_balance: number;
}

interface FundSourceSelectorProps {
  control: Control<any>;
  funds: Fund[];
  fundsLoading: boolean;
}

export const FundSourceSelector = ({ 
  control, 
  funds, 
  fundsLoading 
}: FundSourceSelectorProps) => {
  return (
    <FormField
      control={control}
      name="fund_id"
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