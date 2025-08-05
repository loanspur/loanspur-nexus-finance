import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Control, useFormContext } from "react-hook-form";
import { useEffect } from "react";

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
  const { trigger } = useFormContext();

  // Re-validate amount when product changes
  useEffect(() => {
    if (selectedProduct) {
      trigger('requested_amount');
    }
  }, [selectedProduct, trigger]);

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
              onChange={(e) => {
                field.onChange(e.target.value);
                // Trigger validation on change
                setTimeout(() => trigger('requested_amount'), 100);
              }}
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