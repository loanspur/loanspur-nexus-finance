import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Control } from "react-hook-form";

interface LoanProduct {
  id: string;
  name: string;
  default_nominal_interest_rate: number;
  default_term: number;
  default_principal?: number;
}

interface LoanProductSelectorProps {
  control: Control<any>;
  loanProducts: LoanProduct[];
  isLoadingProducts: boolean;
  onProductChange: (productId: string) => void;
}

export const LoanProductSelector = ({ 
  control, 
  loanProducts, 
  isLoadingProducts, 
  onProductChange 
}: LoanProductSelectorProps) => {
  return (
    <FormField
      control={control}
      name="loan_product_id"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Loan Product *</FormLabel>
          <Select 
            onValueChange={(value) => {
              field.onChange(value);
              onProductChange(value);
            }} 
            value={field.value}
            disabled={isLoadingProducts}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder={isLoadingProducts ? "Loading products..." : "Select a loan product"} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {loanProducts.map((product) => (
                <SelectItem key={product.id} value={product.id}>
                  {product.name} - {product.default_nominal_interest_rate}% ({product.default_term} months)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};