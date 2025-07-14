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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCreateLoanApplication } from "@/hooks/useLoanManagement";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { SampleDataButton } from "@/components/dev/SampleDataButton";

const simpleLoanSchema = z.object({
  loan_product_id: z.string().min(1, "Please select a loan product"),
  requested_amount: z.string().min(1, "Loan amount is required"),
  loan_purpose: z.string().min(10, "Please provide a detailed purpose (min 10 characters)"),
});

type SimpleLoanData = z.infer<typeof simpleLoanSchema>;

interface SimpleLoanApplicationDialogProps {
  clientId: string;
  clientName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const SimpleLoanApplicationDialog = ({ 
  clientId, 
  clientName, 
  open, 
  onOpenChange,
  onSuccess 
}: SimpleLoanApplicationDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { profile } = useAuth();
  const createLoanApplication = useCreateLoanApplication();

  const form = useForm<SimpleLoanData>({
    resolver: zodResolver(simpleLoanSchema),
    defaultValues: {
      loan_product_id: "",
      requested_amount: "",
      loan_purpose: "",
    },
  });

  // Fetch loan products
  const { data: loanProducts = [], isLoading: isLoadingProducts } = useQuery({
    queryKey: ['loan-products', profile?.tenant_id],
    queryFn: async () => {
      if (!profile?.tenant_id) return [];
      const { data, error } = await supabase
        .from('loan_products')
        .select('*')
        .eq('tenant_id', profile.tenant_id)
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.tenant_id,
  });

  const selectedProduct = loanProducts.find(p => p.id === form.watch("loan_product_id"));

  // Auto-populate defaults when product is selected
  const handleProductChange = (productId: string) => {
    const product = loanProducts.find(p => p.id === productId);
    if (product) {
      form.setValue("requested_amount", product.default_principal?.toString() || "");
    }
  };

  const fillSampleData = () => {
    if (loanProducts.length > 0) {
      form.setValue("loan_product_id", loanProducts[0].id);
      form.setValue("requested_amount", loanProducts[0].default_principal?.toString() || "5000");
      form.setValue("loan_purpose", "Business expansion and working capital requirements");
      handleProductChange(loanProducts[0].id);
    }
  };

  const onSubmit = async (data: SimpleLoanData) => {
    setIsSubmitting(true);
    try {
      const selectedProduct = loanProducts.find(p => p.id === data.loan_product_id);
      
      const loanApplicationData = {
        client_id: clientId,
        loan_product_id: data.loan_product_id,
        requested_amount: parseFloat(data.requested_amount),
        requested_term: selectedProduct?.default_term || 12,
        purpose: data.loan_purpose,
        status: 'pending' as const
      };

      console.log('Submitting loan application:', loanApplicationData);

      await createLoanApplication.mutateAsync(loanApplicationData);

      form.reset();
      onOpenChange(false);
      onSuccess?.();
      
      toast({
        title: "Success",
        description: `Loan application submitted successfully for ${clientName}`,
      });
    } catch (error) {
      console.error("Error creating loan application:", error);
      toast({
        title: "Error",
        description: "Failed to submit loan application. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-green-600" />
                Create Loan Application
              </DialogTitle>
              <DialogDescription>
                Submit a loan application for {clientName}
              </DialogDescription>
            </div>
            <SampleDataButton onFillSampleData={fillSampleData} />
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="loan_product_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Loan Product *</FormLabel>
                  <Select 
                    onValueChange={(value) => {
                      field.onChange(value);
                      handleProductChange(value);
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

            {selectedProduct && (
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
            )}

            <FormField
              control={form.control}
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

            <FormField
              control={form.control}
              name="loan_purpose"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Loan Purpose *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the purpose of this loan in detail..."
                      className="resize-none"
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <p className="text-sm text-muted-foreground">
                    Please provide a detailed explanation of how the loan will be used
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting || isLoadingProducts}
                className="bg-orange-600 hover:bg-orange-700"
              >
                {isSubmitting ? "Submitting..." : "Submit Application"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};