import { Control, UseFormSetValue } from "react-hook-form";
import { LoanProductSelector } from "./LoanProductSelector";
import { FundSourceSelector } from "./FundSourceSelector";
import { ProductDetailsDisplay } from "./ProductDetailsDisplay";
import { LoanAmountInput } from "./LoanAmountInput";
import { LoanPurposeInput } from "./LoanPurposeInput";

interface LoanProduct {
  id: string;
  name: string;
  default_nominal_interest_rate: number;
  default_term: number;
  default_principal?: number;
  min_principal?: number;
  max_principal?: number;
}

interface Fund {
  id: string;
  fund_name: string;
  fund_code: string;
  current_balance: number;
}

interface LoanApplicationFormFieldsProps {
  control: Control<any>;
  setValue: UseFormSetValue<any>;
  loanProducts: LoanProduct[];
  funds: Fund[];
  isLoadingProducts: boolean;
  fundsLoading: boolean;
  selectedProduct?: LoanProduct;
}

export const LoanApplicationFormFields = ({
  control,
  setValue,
  loanProducts,
  funds,
  isLoadingProducts,
  fundsLoading,
  selectedProduct
}: LoanApplicationFormFieldsProps) => {
  const handleProductChange = (productId: string) => {
    const product = loanProducts.find(p => p.id === productId);
    if (product) {
      setValue("requested_amount", product.default_principal?.toString() || "");
    }
  };

  return (
    <div className="space-y-6">
      <LoanProductSelector
        control={control}
        loanProducts={loanProducts}
        isLoadingProducts={isLoadingProducts}
        onProductChange={handleProductChange}
      />

      <FundSourceSelector
        control={control}
        funds={funds}
        fundsLoading={fundsLoading}
      />

      {selectedProduct && (
        <ProductDetailsDisplay selectedProduct={selectedProduct} />
      )}

      <LoanAmountInput
        control={control}
        selectedProduct={selectedProduct}
      />

      <LoanPurposeInput control={control} />
    </div>
  );
};