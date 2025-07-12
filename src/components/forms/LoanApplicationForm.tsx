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

const loanApplicationSchema = z.object({
  client_id: z.string().min(1, "Please select a client"),
  loan_product_id: z.string().min(1, "Please select a loan product"),
  requested_amount: z.number().min(1, "Amount must be greater than 0"),
  requested_term: z.number().min(1, "Term must be at least 1 month"),
  purpose: z.string().min(10, "Purpose must be at least 10 characters"),
  collateral_description: z.string().optional(),
  guarantor_ids: z.array(z.string()).optional(),
});

type LoanApplicationFormData = z.infer<typeof loanApplicationSchema>;

interface LoanApplicationFormProps {
  children: React.ReactNode;
}

export const LoanApplicationForm = ({ children }: LoanApplicationFormProps) => {
  const [open, setOpen] = useState(false);
  const { profile } = useAuth();
  const createLoanApplication = useCreateLoanApplication();

  const form = useForm<LoanApplicationFormData>({
    resolver: zodResolver(loanApplicationSchema),
    defaultValues: {
      requested_amount: 0,
      requested_term: 12,
      purpose: "",
      collateral_description: "",
      guarantor_ids: [],
    },
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

  // Fetch loan products
  const { data: loanProducts } = useQuery({
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

  const selectedProduct = loanProducts?.find(p => p.id === form.watch('loan_product_id'));

  const onSubmit = async (data: LoanApplicationFormData) => {
    try {
      await createLoanApplication.mutateAsync({
        client_id: data.client_id,
        loan_product_id: data.loan_product_id,
        requested_amount: data.requested_amount,
        requested_term: data.requested_term,
        purpose: data.purpose,
        status: 'pending',
      });
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
                    <Badge variant="secondary" className="ml-2">{selectedProduct.default_term} months</Badge>
                  </div>
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
                      Term (Months)
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="12"
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