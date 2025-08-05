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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCreateLoanApplication } from "@/hooks/useLoanManagement";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { CalendarDays, DollarSign, FileText } from "lucide-react";
import { SampleDataButton } from "@/components/dev/SampleDataButton";
import { generateSampleLoanApplicationData } from "@/lib/dev-utils";
import { useGetApprovalWorkflow, useCreateApprovalRequest } from "@/hooks/useApprovalRequests";

// Create dynamic schema function to include product validation
const createLoanApplicationSchema = (selectedProduct?: any) => z.object({
  client_id: z.string().min(1, "Please select a client"),
  loan_product_id: z.string().min(1, "Please select a loan product"),
  requested_amount: z.number()
    .min(1, "Amount must be greater than 0")
    .refine((amount) => {
      if (!selectedProduct) return true;
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
  requested_term: z.number()
    .min(1, "Term must be at least 1")
    .refine((term) => {
      if (!selectedProduct) return true;
      console.log('Validating term:', term, 'against product limits:', { 
        min: selectedProduct.min_term, 
        max: selectedProduct.max_term,
        product: selectedProduct.name,
        frequency: selectedProduct.repayment_frequency
      });
      if (selectedProduct.min_term && term < selectedProduct.min_term) {
        return false;
      }
      if (selectedProduct.max_term && term > selectedProduct.max_term) {
        return false;
      }
      return true;
    }, (ctx) => {
      if (!selectedProduct) return { message: "Please select a loan product first" };
      const min = selectedProduct.min_term || 1;
      const max = selectedProduct.max_term || 360;
      const unit = selectedProduct.repayment_frequency === 'daily' ? 'days' : 
                   selectedProduct.repayment_frequency === 'weekly' ? 'weeks' : 'months';
      return { message: `Term must be between ${min} and ${max} ${unit}` };
    }),
  purpose: z.string().min(10, "Purpose must be at least 10 characters"),
  collateral_description: z.string().optional(),
  guarantor_ids: z.array(z.string()).optional(),
});

type LoanApplicationFormData = z.infer<ReturnType<typeof createLoanApplicationSchema>>;

interface LoanApplicationFormProps {
  children: React.ReactNode;
}

export const LoanApplicationForm = ({ children }: LoanApplicationFormProps) => {
  const [open, setOpen] = useState(false);
  const { profile } = useAuth();
  const createLoanApplication = useCreateLoanApplication();
  const createApprovalRequest = useCreateApprovalRequest();
  
  // Get loan application approval workflow
  const { data: approvalWorkflow } = useGetApprovalWorkflow('loan_applications', 'loan_approval');

  // Fetch loan products
  const { data: loanProducts } = useQuery({
    queryKey: ['loan-products', profile?.tenant_id],
    queryFn: async () => {
      if (!profile?.tenant_id) return [];
      const { data, error } = await supabase
        .from('loan_products')
        .select('*, repayment_frequency, min_term, max_term')
        .eq('tenant_id', profile.tenant_id)
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.tenant_id,
  });

  // Fetch clients
  const { data: clients } = useQuery({
    queryKey: ['clients', profile?.tenant_id],
    queryFn: async () => {
      if (!profile?.tenant_id) return [];
      const { data, error } = await supabase
        .from('clients')
        .select('id, first_name, last_name, client_number')
        .eq('tenant_id', profile.tenant_id)
        .eq('is_active', true)
        .order('first_name');
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.tenant_id,
  });

  // Initialize form with basic schema first
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const selectedProduct = loanProducts?.find(p => p.id === selectedProductId);
  
  const form = useForm<LoanApplicationFormData>({
    resolver: zodResolver(createLoanApplicationSchema(selectedProduct)),
    defaultValues: {
      client_id: "",
      loan_product_id: "",
      requested_amount: 0,
      requested_term: 0,
      purpose: "",
      collateral_description: "",
      guarantor_ids: [],
    },
  });

  // Watch product selection and update schema
  const watchedProductId = form.watch('loan_product_id');
  
  useEffect(() => {
    if (watchedProductId !== selectedProductId) {
      setSelectedProductId(watchedProductId);
      // Reset resolver with new product validation
      const newSchema = createLoanApplicationSchema(loanProducts?.find(p => p.id === watchedProductId));
      form.clearErrors();
      // Re-validate fields that depend on product
      setTimeout(() => {
        form.trigger(['requested_amount', 'requested_term']);
      }, 100);
    }
  }, [watchedProductId, selectedProductId, loanProducts, form]);

  const onSubmit = async (data: LoanApplicationFormData) => {
    try {
      // Additional validation before submission
      if (selectedProduct) {
        console.log('Final validation before submission:', {
          amount: data.requested_amount,
          product: selectedProduct.name,
          limits: { min: selectedProduct.min_principal, max: selectedProduct.max_principal }
        });
        
        if (selectedProduct.min_principal && data.requested_amount < selectedProduct.min_principal) {
          form.setError('requested_amount', { 
            message: `Amount must be at least ${selectedProduct.min_principal.toLocaleString()}` 
          });
          return;
        }
        
        if (selectedProduct.max_principal && data.requested_amount > selectedProduct.max_principal) {
          form.setError('requested_amount', { 
            message: `Amount cannot exceed ${selectedProduct.max_principal.toLocaleString()}` 
          });
          return;
        }
      }

      // Create the loan application
      const application = await createLoanApplication.mutateAsync({
        client_id: data.client_id,
        loan_product_id: data.loan_product_id,
        requested_amount: data.requested_amount,
        requested_term: data.requested_term,
        purpose: data.purpose,
        status: approvalWorkflow ? 'under_review' : 'pending',
      });

      // If approval workflow exists, create approval request
      if (approvalWorkflow && application) {
        await createApprovalRequest.mutateAsync({
          workflow_id: approvalWorkflow.id,
          record_id: application.id,
          record_data: {
            client_id: data.client_id,
            loan_product_id: data.loan_product_id,
            requested_amount: data.requested_amount,
            requested_term: data.requested_term,
            purpose: data.purpose,
          },
          priority: data.requested_amount > 100000 ? 'high' : 'normal',
          reason: `Loan application for $${data.requested_amount.toLocaleString()}`,
        });
      }
      
      form.reset();
      setOpen(false);
    } catch (error) {
      console.error("Error creating loan application:", error);
    }
  };

  const fillSampleData = () => {
    const sampleData = generateSampleLoanApplicationData();
    Object.entries(sampleData).forEach(([key, value]) => {
      form.setValue(key as keyof LoanApplicationFormData, value);
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                New Loan Application
              </DialogTitle>
              <DialogDescription>
                Submit a new loan application for review and processing
              </DialogDescription>
            </div>
            <SampleDataButton onFillSampleData={fillSampleData} />
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="client_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select client" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {clients?.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.first_name} {client.last_name} ({client.client_number})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="loan_product_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Loan Product</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select product" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {loanProducts?.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name} ({product.default_nominal_interest_rate}% - {product.default_term}mo)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {selectedProduct && (
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">Product Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Interest Rate:</span>
                    <Badge variant="secondary" className="ml-2">{selectedProduct.default_nominal_interest_rate}%</Badge>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Max Amount:</span>
                    <Badge variant="secondary" className="ml-2">${selectedProduct.max_principal?.toLocaleString()}</Badge>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Min Amount:</span>
                    <Badge variant="secondary" className="ml-2">${selectedProduct.min_principal?.toLocaleString()}</Badge>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Term:</span>
                    <Badge variant="secondary" className="ml-2">
                      {selectedProduct.default_term} {
                        selectedProduct.repayment_frequency === 'daily' ? 'days' : 
                        selectedProduct.repayment_frequency === 'weekly' ? 'weeks' : 'months'
                      }
                    </Badge>
                  </div>
                  {selectedProduct.repayment_frequency && (
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Payment Frequency:</span>
                      <Badge variant="outline" className="ml-2 capitalize">{selectedProduct.repayment_frequency}</Badge>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="requested_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      Requested Amount
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
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
                    <FormLabel className="flex items-center gap-2">
                      <CalendarDays className="w-4 h-4" />
                      Term ({
                        selectedProduct?.repayment_frequency === 'daily' ? 'Days' : 
                        selectedProduct?.repayment_frequency === 'weekly' ? 'Weeks' : 'Months'
                      })
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder={
                          selectedProduct?.repayment_frequency === 'daily' ? '10' : 
                          selectedProduct?.repayment_frequency === 'weekly' ? '4' : '12'
                        }
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
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

            <FormField
              control={form.control}
              name="collateral_description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Collateral Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe any collateral for this loan..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createLoanApplication.isPending}
              >
                {createLoanApplication.isPending ? "Submitting..." : "Submit Application"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};