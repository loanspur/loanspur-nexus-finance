import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCreateLoanProduct, useUpdateLoanProduct, LoanProduct } from "@/hooks/useSupabase";
import { loanProductSchema, defaultValues, type LoanProductFormData } from "./loan-product/LoanProductSchema";
import { LoanProductBasicInfoTab } from "./loan-product/LoanProductBasicInfoTab";
import { LoanProductTermsTab } from "./loan-product/LoanProductTermsTab";
import { LoanProductInterestRepaymentTab } from "./loan-product/LoanProductInterestRepaymentTab";
import { LoanProductArrearsTab } from "./loan-product/LoanProductArrearsTab";
import { LoanProductAdvancedTab } from "./loan-product/LoanProductAdvancedTab";
import { LoanProductAccountingTab } from "./loan-product/LoanProductAccountingTab";

interface LoanProductFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenantId: string;
  editingProduct?: LoanProduct | null;
}

export const LoanProductForm = ({ open, onOpenChange, tenantId, editingProduct }: LoanProductFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createLoanProductMutation = useCreateLoanProduct();
  const updateLoanProductMutation = useUpdateLoanProduct();

  const form = useForm<LoanProductFormData>({
    resolver: zodResolver(loanProductSchema),
    defaultValues: editingProduct ? {
      name: editingProduct.name,
      short_name: editingProduct.short_name,
      description: editingProduct.description || "",
      currency_code: editingProduct.currency_code,
      min_principal: editingProduct.min_principal?.toString() || "",
      max_principal: editingProduct.max_principal?.toString() || "",
      default_principal: editingProduct.default_principal?.toString() || "",
      min_nominal_interest_rate: editingProduct.min_nominal_interest_rate?.toString() || "",
      max_nominal_interest_rate: editingProduct.max_nominal_interest_rate?.toString() || "",
      default_nominal_interest_rate: editingProduct.default_nominal_interest_rate?.toString() || "",
      min_term: editingProduct.min_term?.toString() || "",
      max_term: editingProduct.max_term?.toString() || "",
      default_term: editingProduct.default_term?.toString() || "",
      repayment_frequency: editingProduct.repayment_frequency || "monthly",
    } : defaultValues,
  });

  const onSubmit = async (data: LoanProductFormData) => {
    setIsSubmitting(true);
    try {
      const productData = {
        tenant_id: tenantId,
        name: data.name,
        short_name: data.short_name,
        description: data.description || null,
        currency_code: data.currency_code,
        min_principal: parseFloat(data.min_principal),
        max_principal: parseFloat(data.max_principal),
        default_principal: data.default_principal ? parseFloat(data.default_principal) : null,
        min_nominal_interest_rate: parseFloat(data.min_nominal_interest_rate),
        max_nominal_interest_rate: parseFloat(data.max_nominal_interest_rate),
        default_nominal_interest_rate: data.default_nominal_interest_rate ? parseFloat(data.default_nominal_interest_rate) : null,
        min_term: parseInt(data.min_term),
        max_term: parseInt(data.max_term),
        default_term: data.default_term ? parseInt(data.default_term) : null,
        repayment_frequency: data.repayment_frequency,
        is_active: true,
        mifos_product_id: null,
      };

      if (editingProduct) {
        await updateLoanProductMutation.mutateAsync({
          id: editingProduct.id,
          ...productData,
        });
      } else {
        await createLoanProductMutation.mutateAsync(productData);
      }
      
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving loan product:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingProduct ? 'Edit Loan Product' : 'Create Loan Product'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="terms">Loan Terms</TabsTrigger>
                <TabsTrigger value="interest">Interest & Repayment</TabsTrigger>
                <TabsTrigger value="arrears">Arrears & NPA</TabsTrigger>
                <TabsTrigger value="accounting">Accounting</TabsTrigger>
                <TabsTrigger value="advanced">Advanced</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
                <LoanProductBasicInfoTab form={form} />
              </TabsContent>

              <TabsContent value="terms" className="space-y-4">
                <LoanProductTermsTab form={form} />
              </TabsContent>

              <TabsContent value="interest" className="space-y-4">
                <LoanProductInterestRepaymentTab form={form} />
              </TabsContent>

              <TabsContent value="arrears" className="space-y-4">
                <LoanProductArrearsTab form={form} />
              </TabsContent>

              <TabsContent value="accounting" className="space-y-4">
                <LoanProductAccountingTab form={form} />
              </TabsContent>

              <TabsContent value="advanced" className="space-y-4">
                <LoanProductAdvancedTab form={form} />
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting 
                  ? (editingProduct ? "Updating..." : "Creating...") 
                  : (editingProduct ? "Update Product" : "Create Product")
                }
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};