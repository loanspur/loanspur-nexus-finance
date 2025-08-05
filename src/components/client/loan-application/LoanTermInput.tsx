import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Control, useFormContext } from "react-hook-form";
import { useEffect } from "react";
import { CalendarDays } from "lucide-react";

interface LoanProduct {
  min_term?: number;
  max_term?: number;
  repayment_frequency?: string;
}

interface LoanTermInputProps {
  control: Control<any>;
  selectedProduct?: LoanProduct;
}

export const LoanTermInput = ({ 
  control, 
  selectedProduct 
}: LoanTermInputProps) => {
  const { trigger } = useFormContext();

  // Re-validate term when product changes
  useEffect(() => {
    if (selectedProduct) {
      trigger('requested_term');
    }
  }, [selectedProduct, trigger]);

  // Helper function to get the correct term unit based on repayment frequency
  const getTermUnit = (frequency?: string) => {
    switch (frequency?.toLowerCase()) {
      case 'daily':
        return 'Days';
      case 'weekly':
        return 'Weeks';
      case 'monthly':
      default:
        return 'Months';
    }
  };

  // Helper function to get appropriate placeholder
  const getPlaceholder = (frequency?: string) => {
    switch (frequency?.toLowerCase()) {
      case 'daily':
        return '10';
      case 'weekly':
        return '4';
      case 'monthly':
      default:
        return '12';
    }
  };

  const termUnit = getTermUnit(selectedProduct?.repayment_frequency);
  const placeholder = getPlaceholder(selectedProduct?.repayment_frequency);

  return (
    <FormField
      control={control}
      name="requested_term"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4" />
            Term ({termUnit})
          </FormLabel>
          <FormControl>
            <Input
              type="number"
              placeholder={placeholder}
              {...field}
              onChange={(e) => {
                field.onChange(parseInt(e.target.value) || 0);
                // Trigger validation on change
                setTimeout(() => trigger('requested_term'), 100);
              }}
            />
          </FormControl>
          {selectedProduct && selectedProduct.min_term && selectedProduct.max_term && (
            <p className="text-sm text-muted-foreground">
              Term must be between {selectedProduct.min_term} and {selectedProduct.max_term} {termUnit.toLowerCase()}
            </p>
          )}
          <FormMessage />
        </FormItem>
      )}
    />
  );
};