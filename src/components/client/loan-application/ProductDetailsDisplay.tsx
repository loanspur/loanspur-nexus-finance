interface LoanProduct {
  default_nominal_interest_rate: number;
  default_term: number;
  min_principal?: number;
  max_principal?: number;
  min_term?: number;
  max_term?: number;
  repayment_frequency?: string;
}

interface ProductDetailsDisplayProps {
  selectedProduct: LoanProduct;
}

export const ProductDetailsDisplay = ({ selectedProduct }: ProductDetailsDisplayProps) => {
  // Helper function to get the correct term unit based on repayment frequency
  const getTermUnit = (frequency?: string) => {
    switch (frequency?.toLowerCase()) {
      case 'daily':
        return 'days';
      case 'weekly':
        return 'weeks';
      case 'monthly':
      default:
        return 'months';
    }
  };

  const termUnit = getTermUnit(selectedProduct.repayment_frequency);

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
          <span className="ml-2 font-medium">{selectedProduct.default_term} {termUnit}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Min Amount:</span>
          <span className="ml-2 font-medium">{selectedProduct.min_principal?.toLocaleString()}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Max Amount:</span>
          <span className="ml-2 font-medium">{selectedProduct.max_principal?.toLocaleString()}</span>
        </div>
        {selectedProduct.min_term && selectedProduct.max_term && (
          <div className="col-span-2">
            <span className="text-muted-foreground">Term Range:</span>
            <span className="ml-2 font-medium">{selectedProduct.min_term}-{selectedProduct.max_term} {termUnit}</span>
          </div>
        )}
        {selectedProduct.repayment_frequency && (
          <div className="col-span-2">
            <span className="text-muted-foreground">Payment Frequency:</span>
            <span className="ml-2 font-medium capitalize">{selectedProduct.repayment_frequency}</span>
          </div>
        )}
      </div>
    </div>
  );
};