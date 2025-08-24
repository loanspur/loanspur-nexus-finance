import { UseFormReturn } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCurrency } from "@/contexts/CurrencyContext";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";
import { CreditCard, DollarSign, Calendar, Percent, Info } from "lucide-react";

interface LoanProductSelectionStepProps {
  form: UseFormReturn<any>;
}

export function LoanProductSelectionStep({ form }: LoanProductSelectionStepProps) {
  const { profile } = useAuth();
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  const { data: loanProducts = [], isLoading: isLoadingProducts } = useQuery({
    queryKey: ['loan-products', profile?.tenant_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('loan_products')
        .select('*')
        .eq('tenant_id', profile?.tenant_id)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data;
    },
    enabled: !!profile?.tenant_id,
  });

  const { data: funds = [], isLoading: isLoadingFunds } = useQuery({
    queryKey: ['funds', profile?.tenant_id],
    queryFn: async () => {
      if (!profile?.tenant_id) return [];

      const { data, error } = await supabase
        .from('funds')
        .select('*')
        .eq('tenant_id', profile.tenant_id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.tenant_id,
  });

  const { currency } = useCurrency();
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const handleProductSelect = (productId: string) => {
    const product = loanProducts.find(p => p.id === productId);
    setSelectedProduct(product);
    form.setValue('loan_product_id', productId);
    
    // Auto-populate form with product defaults
    if (product) {
      form.setValue('interest_rate', product.default_nominal_interest_rate || 0);
      form.setValue('calculation_method', product.interest_calculation_method || 'flat');
      form.setValue('repayment_frequency', product.repayment_frequency || 'monthly');
      form.setValue('requested_term', product.default_term || 12);
      form.setValue('requested_amount', product.default_principal || 0);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">Select Loan Product</h3>
        <p className="text-muted-foreground">
          Choose the loan product that best fits the client's needs and your institution's policies.
        </p>
      </div>

      {/* Loan Product Selection */}
      <div className="space-y-4">
        <FormField
          control={form.control}
          name="loan_product_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Loan Product *</FormLabel>
              <Select onValueChange={handleProductSelect} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a loan product" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {isLoadingProducts ? (
                    <SelectItem value="loading" disabled>Loading products...</SelectItem>
                  ) : loanProducts.length === 0 ? (
                    <SelectItem value="no-products" disabled>No loan products available</SelectItem>
                  ) : (
                    loanProducts.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{product.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatCurrency(product.min_principal)} - {formatCurrency(product.max_principal)}
                          </span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Product Details */}
        {selectedProduct && (
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-800">
                <CreditCard className="w-5 h-5" />
                {selectedProduct.name}
              </CardTitle>
              <CardDescription className="text-blue-600">
                {selectedProduct.description || 'No description available'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-blue-600" />
                  <div>
                    <p className="text-sm text-blue-600">Principal Range</p>
                    <p className="font-medium text-blue-800">
                      {formatCurrency(selectedProduct.min_principal)} - {formatCurrency(selectedProduct.max_principal)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Percent className="w-4 h-4 text-blue-600" />
                  <div>
                    <p className="text-sm text-blue-600">Interest Rate</p>
                    <p className="font-medium text-blue-800">
                      {selectedProduct.min_nominal_interest_rate}% - {selectedProduct.max_nominal_interest_rate}%
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <div>
                    <p className="text-sm text-blue-600">Term Range</p>
                    <p className="font-medium text-blue-800">
                      {selectedProduct.min_term} - {selectedProduct.max_term} {selectedProduct.repayment_frequency?.toLowerCase() === 'daily' ? 'days' : selectedProduct.repayment_frequency?.toLowerCase() === 'weekly' ? 'weeks' : 'months'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-blue-600" />
                  <div>
                    <p className="text-sm text-blue-600">Repayment</p>
                    <p className="font-medium text-blue-800 capitalize">
                      {selectedProduct.repayment_frequency}
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-blue-800 mb-2">Product Features</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2">
                      <Badge variant={selectedProduct.require_collateral ? "default" : "secondary"}>
                        {selectedProduct.require_collateral ? "Collateral Required" : "No Collateral"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={selectedProduct.require_guarantor ? "default" : "secondary"}>
                        {selectedProduct.require_guarantor ? "Guarantor Required" : "No Guarantor"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={selectedProduct.require_insurance ? "default" : "secondary"}>
                        {selectedProduct.require_insurance ? "Insurance Required" : "No Insurance"}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-blue-800 mb-2">Default Values</h4>
                  <div className="space-y-1 text-sm text-blue-600">
                    <p>Default Principal: {formatCurrency(selectedProduct.default_principal || 0)}</p>
                    <p>Default Term: {selectedProduct.default_term || 0} {selectedProduct.repayment_frequency?.toLowerCase() === 'daily' ? 'days' : selectedProduct.repayment_frequency?.toLowerCase() === 'weekly' ? 'weeks' : 'months'}</p>
                    <p>Default Interest Rate: {selectedProduct.default_nominal_interest_rate || 0}%</p>
                    <p>Calculation Method: {selectedProduct.interest_calculation_method || 'Not specified'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Fund Source Selection */}
        <FormField
          control={form.control}
          name="fund_source_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fund Type *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select fund type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {isLoadingFunds ? (
                    <SelectItem value="loading" disabled>Loading funds...</SelectItem>
                  ) : funds.length === 0 ? (
                    <SelectItem value="no-funds" disabled>No funds available</SelectItem>
                  ) : (
                    funds.map((fund) => (
                      <SelectItem key={fund.id} value={fund.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{fund.fund_name}</span>
                          <span className="text-xs text-muted-foreground">
                            Available: {formatCurrency(fund.current_balance || 0)}
                          </span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Requirements Notice */}
      {selectedProduct && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardHeader>
            <CardTitle className="text-yellow-800 flex items-center gap-2">
              <Info className="w-5 h-5" />
              Product Requirements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-yellow-700">
              {selectedProduct.require_collateral && (
                <p>• Collateral information will be required in the following steps</p>
              )}
              {selectedProduct.require_guarantor && (
                <p>• Guarantor information will be required in the following steps</p>
              )}
              {selectedProduct.require_insurance && (
                <p>• Insurance details will be required</p>
              )}
              {selectedProduct.require_income_proof && (
                <p>• Income proof documents will be required</p>
              )}
              {selectedProduct.require_bank_statements && (
                <p>• Bank statements will be required</p>
              )}
              {selectedProduct.require_business_plan && (
                <p>• Business plan documentation will be required</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}