import { useState, useEffect } from "react";
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
import { Form } from "@/components/ui/form";
import { CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCreateLoanApplication } from "@/hooks/useLoanManagement";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { SampleDataButton } from "@/components/dev/SampleDataButton";
import { useFunds } from "@/hooks/useFundsManagement";
import { LoanApplicationFormFields } from "./loan-application/LoanApplicationFormFields";

// Create dynamic schema function with product validation
const createSimpleLoanSchema = (selectedProduct?: any) => z.object({
  loan_product_id: z.string().min(1, "Please select a loan product"),
  requested_amount: z.string()
    .min(1, "Loan amount is required")
    .refine((val) => {
      const amount = parseFloat(val);
      return !isNaN(amount) && amount > 0;
    }, "Please enter a valid amount")
    .refine((val) => {
      if (!selectedProduct) return true;
      const amount = parseFloat(val);
      console.log('Validating amount:', amount, 'against product limits:', { 
        min: selectedProduct.min_principal, 
        max: selectedProduct.max_principal,
        product: selectedProduct.name 
      });
      if (selectedProduct.min_principal && amount < selectedProduct.min_principal) {
        return false;
      }
      if (selectedProduct.max_principal && amount > selectedProduct.max_principal) {
        return false;
      }
      return true;
    }, (ctx) => {
      if (!selectedProduct) return { message: "Please select a loan product first" };
      const min = selectedProduct.min_principal || 0;
      const max = selectedProduct.max_principal || Infinity;
      return { message: `Amount must be between ${min.toLocaleString()} and ${max.toLocaleString()}` };
    }),
  loan_purpose: z.string().min(10, "Please provide a detailed purpose (min 10 characters)"),
  fund_id: z.string().min(1, "Fund selection is required"),
});

type SimpleLoanData = z.infer<ReturnType<typeof createSimpleLoanSchema>>;

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
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const { toast } = useToast();
  const { profile } = useAuth();
  const createLoanApplication = useCreateLoanApplication();

  // Debug logging
  console.log('SimpleLoanApplicationDialog render:', { open, clientId, clientName });

  // Fetch loan products and funds
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

  const { data: funds = [], isLoading: fundsLoading } = useFunds();

  // Debug logging for data
  console.log('SimpleLoanApplicationDialog data:', { 
    loanProducts: loanProducts.length, 
    funds: funds.length, 
    isLoadingProducts, 
    fundsLoading,
    loanProductsData: loanProducts,
    fundsData: funds
  });

  // Initialize form with dynamic schema
  const selectedProduct = loanProducts?.find(p => p.id === selectedProductId);
  
  const form = useForm<SimpleLoanData>({
    resolver: zodResolver(createSimpleLoanSchema(selectedProduct)),
    defaultValues: {
      loan_product_id: "",
      requested_amount: "",
      loan_purpose: "",
      fund_id: "",
    },
  });

  // Watch product selection and update schema
  const watchedProductId = form.watch('loan_product_id');
  
  useEffect(() => {
    if (watchedProductId !== selectedProductId) {
      setSelectedProductId(watchedProductId);
      // Reset resolver with new product validation
      const newSchema = createSimpleLoanSchema(loanProducts?.find(p => p.id === watchedProductId));
      form.clearErrors();
      // Re-validate fields that depend on product
      setTimeout(() => {
        form.trigger(['requested_amount']);
      }, 100);
    }
  }, [watchedProductId, selectedProductId, loanProducts, form]);

  const fillSampleData = () => {
    if (loanProducts.length > 0 && funds.length > 0) {
      form.setValue("loan_product_id", loanProducts[0].id);
      form.setValue("requested_amount", loanProducts[0].default_principal?.toString() || "5000");
      form.setValue("loan_purpose", "Business expansion and working capital requirements");
      form.setValue("fund_id", funds[0].id);
      // Auto-populate amount based on selected product
      const product = loanProducts.find(p => p.id === loanProducts[0].id);
      if (product) {
        form.setValue("requested_amount", product.default_principal?.toString() || "");
      }
    }
  };

  const onSubmit = async (data: SimpleLoanData) => {
    setIsSubmitting(true);
    try {
      const selectedProduct = loanProducts.find(p => p.id === data.loan_product_id);
      const requestedAmount = parseFloat(data.requested_amount);
      
      // Final validation before submission
      if (selectedProduct) {
        console.log('Final validation before submission:', {
          amount: requestedAmount,
          product: selectedProduct.name,
          limits: { min: selectedProduct.min_principal, max: selectedProduct.max_principal }
        });
        
        if (selectedProduct.min_principal && requestedAmount < selectedProduct.min_principal) {
          form.setError('requested_amount', { 
            message: `Amount must be at least ${selectedProduct.min_principal.toLocaleString()}` 
          });
          setIsSubmitting(false);
          return;
        }
        
        if (selectedProduct.max_principal && requestedAmount > selectedProduct.max_principal) {
          form.setError('requested_amount', { 
            message: `Amount cannot exceed ${selectedProduct.max_principal.toLocaleString()}` 
          });
          setIsSubmitting(false);
          return;
        }
      }
      
      const loanApplicationData = {
        client_id: clientId,
        loan_product_id: data.loan_product_id,
        requested_amount: requestedAmount,
        requested_term: selectedProduct?.default_term || 12,
        purpose: data.loan_purpose,
        fund_id: data.fund_id,
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
            <LoanApplicationFormFields
              control={form.control}
              setValue={form.setValue}
              loanProducts={loanProducts}
              funds={funds}
              isLoadingProducts={isLoadingProducts}
              fundsLoading={fundsLoading}
              selectedProduct={selectedProduct}
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
                disabled={isSubmitting || isLoadingProducts || fundsLoading}
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