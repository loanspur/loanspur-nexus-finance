import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreditCard, DollarSign, Calendar, Percent, FileText } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCreateLoanApplication } from "@/hooks/useLoanManagement";
import { useMifosIntegration } from "@/hooks/useMifosIntegration";
import { useToast } from "@/hooks/use-toast";

const loanApplicationSchema = z.object({
  loan_product_id: z.string().min(1, "Please select a loan product"),
  requested_amount: z.number().min(1, "Amount must be greater than 0"),
  requested_term: z.number().min(1, "Term must be at least 1 month"),
  purpose: z.string().optional(),
  interest_rate: z.number().optional(),
  repayment_frequency: z.string().optional(),
});

type LoanApplicationData = z.infer<typeof loanApplicationSchema>;

interface NewLoanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
}

export const NewLoanDialog = ({ open, onOpenChange, clientId }: NewLoanDialogProps) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const createLoanApplication = useCreateLoanApplication();
  const { createMifosLoanApplication, mifosConfig, isLoadingConfig } = useMifosIntegration();
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  const form = useForm<LoanApplicationData>({
    resolver: zodResolver(loanApplicationSchema),
    defaultValues: {
      loan_product_id: "",
      requested_amount: 0,
      requested_term: 12,
      purpose: "",
      interest_rate: 0,
      repayment_frequency: "monthly",
    },
  });

  // Fetch loan products
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
    enabled: !!profile?.tenant_id && open,
  });

  // Fetch client details
  const { data: client } = useQuery({
    queryKey: ['client', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!clientId && open,
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const handleProductSelect = (productId: string) => {
    const product = loanProducts.find(p => p.id === productId);
    setSelectedProduct(product);
    
    if (product) {
      form.setValue('interest_rate', product.default_nominal_interest_rate || 0);
      form.setValue('repayment_frequency', product.repayment_frequency || 'monthly');
      form.setValue('requested_term', product.default_term || 12);
      form.setValue('requested_amount', product.default_principal || 0);
    }
  };

  const onSubmit = async (data: LoanApplicationData) => {
    try {
      console.log('Creating loan application:', data);
      
      // Create local loan application first
      const localApplication = await createLoanApplication.mutateAsync({
        client_id: clientId,
        loan_product_id: data.loan_product_id,
        requested_amount: data.requested_amount,
        requested_term: data.requested_term,
        purpose: data.purpose || '',
        status: 'pending',
      });

      console.log('Local application created:', localApplication);

      // If Mifos is configured, also create in Mifos X
      if (mifosConfig && client?.mifos_client_id) {
        try {
          console.log('Creating Mifos loan application...');
          
          const mifosLoanData = {
            loanApplicationId: localApplication.id,
            clientMifosId: client.mifos_client_id,
            productMifosId: selectedProduct?.mifos_product_id || 1, // Default to product 1 if not mapped
            principal: data.requested_amount,
            termFrequency: data.requested_term,
            numberOfRepayments: data.requested_term,
            interestRate: data.interest_rate || 10,
            expectedDisbursementDate: new Date().toISOString().split('T')[0],
          };

          const mifosResult = await createMifosLoanApplication.mutateAsync(mifosLoanData);
          console.log('Mifos loan application created:', mifosResult);

          // Log successful Mifos integration
          if (mifosResult?.loanId) {
            console.log('Successfully created loan in Mifos X with ID:', mifosResult.loanId);
          }
        } catch (mifosError) {
          console.error('Failed to create Mifos loan application:', mifosError);
          toast({
            title: "Warning",
            description: "Loan application created locally but failed to sync with Mifos X. You can manually sync later.",
            variant: "destructive",
          });
        }
      }

      toast({
        title: "Success",
        description: "Loan application created successfully",
      });

      form.reset();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error creating loan application:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create loan application",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            New Loan Application
          </DialogTitle>
          <DialogDescription>
            Create a new loan application for {client?.first_name} {client?.last_name}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Loan Product Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Loan Product
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="loan_product_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Select Loan Product *</FormLabel>
                      <Select onValueChange={(value) => {
                        field.onChange(value);
                        handleProductSelect(value);
                      }} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose a loan product" />
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
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-800 mb-3">{selectedProduct.name}</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-blue-600" />
                        <div>
                          <p className="text-blue-600">Principal Range</p>
                          <p className="font-medium text-blue-800">
                            {formatCurrency(selectedProduct.min_principal)} - {formatCurrency(selectedProduct.max_principal)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Percent className="w-4 h-4 text-blue-600" />
                        <div>
                          <p className="text-blue-600">Interest Rate</p>
                          <p className="font-medium text-blue-800">
                            {selectedProduct.min_nominal_interest_rate}% - {selectedProduct.max_nominal_interest_rate}%
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-blue-600" />
                        <div>
                          <p className="text-blue-600">Term Range</p>
                          <p className="font-medium text-blue-800">
                            {selectedProduct.min_term} - {selectedProduct.max_term} months
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-blue-600" />
                        <div>
                          <p className="text-blue-600">Repayment</p>
                          <p className="font-medium text-blue-800 capitalize">
                            {selectedProduct.repayment_frequency}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Loan Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Loan Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="requested_amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Requested Amount *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Enter amount"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="requested_term"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Loan Term (Months) *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Enter term in months"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="interest_rate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Interest Rate (%)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="Interest rate"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="repayment_frequency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Repayment Frequency</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select frequency" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="quarterly">Quarterly</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="purpose"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Loan Purpose</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe the purpose of this loan..."
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createLoanApplication.isPending || createMifosLoanApplication.isPending}
              >
                {createLoanApplication.isPending || createMifosLoanApplication.isPending ? 'Creating...' : 'Create Loan Application'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};