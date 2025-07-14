interface LoanProduct {
  default_nominal_interest_rate: number;
  default_term: number;
  min_principal?: number;
  max_principal?: number;
}

interface ProductDetailsDisplayProps {
  selectedProduct: LoanProduct;
}

export const ProductDetailsDisplay = ({ selectedProduct }: ProductDetailsDisplayProps) => {
  return (
    <div className="p-4 bg-muted rounded-lg">
      <h4 className="font-medium mb-2">Product Details</h4>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-muted-foreground">Interest Rate:</span>
          <span className="ml-2 font-medium">{selectedProduct.default_nominal_interest_rate}%</span>
        </div>
        <div>
          <span className="text-muted-foreground">Default Term:</span>
          <span className="ml-2 font-medium">{selectedProduct.default_term} months</span>
        </div>
        <div>
          <span className="text-muted-foreground">Min Amount:</span>
          <span className="ml-2 font-medium">{selectedProduct.min_principal?.toLocaleString()}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Max Amount:</span>
          <span className="ml-2 font-medium">{selectedProduct.max_principal?.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};