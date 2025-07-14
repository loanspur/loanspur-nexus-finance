import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Control } from "react-hook-form";

interface LoanProduct {
  min_principal?: number;
  max_principal?: number;
}

interface LoanAmountInputProps {
  control: Control<any>;
  selectedProduct?: LoanProduct;
}

export const LoanAmountInput = ({ 
  control, 
  selectedProduct 
}: LoanAmountInputProps) => {
  return (
    <FormField
      control={control}
      name="requested_amount"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Requested Amount *</FormLabel>
          <FormControl>
            <Input
              type="number"
              placeholder="Enter loan amount"
              {...field}
              step="0.01"
            />
          </FormControl>
          {selectedProduct && (
            <p className="text-sm text-muted-foreground">
              Amount must be between {selectedProduct.min_principal?.toLocaleString()} and {selectedProduct.max_principal?.toLocaleString()}
            </p>
          )}
          <FormMessage />
        </FormItem>
      )}
    />
  );
};