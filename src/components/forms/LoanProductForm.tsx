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
import { LoanProductAccountingTab } from "./loan-product/LoanProductAccountingTab";
import { LoanProductInterestTab } from "./loan-product/LoanProductInterestTab";
import { LoanProductFeesTab } from "./loan-product/LoanProductFeesTab";
import { LoanProductAdvancedTab } from "./loan-product/LoanProductAdvancedTab";
import { SampleDataButton } from "@/components/dev/SampleDataButton";

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
      // Basic Information
      name: editingProduct.name,
      short_name: editingProduct.short_name,
      description: editingProduct.description || "",
      currency_code: editingProduct.currency_code,
      repayment_frequency: editingProduct.repayment_frequency || "monthly",
      
      // Loan Terms
      min_principal: editingProduct.min_principal?.toString() || "",
      max_principal: editingProduct.max_principal?.toString() || "",
      default_principal: editingProduct.default_principal?.toString() || "",
      min_term: editingProduct.min_term?.toString() || "",
      max_term: editingProduct.max_term?.toString() || "",
      default_term: editingProduct.default_term?.toString() || "",
      
      // Interest & Repayment
      min_nominal_interest_rate: editingProduct.min_nominal_interest_rate?.toString() || "",
      max_nominal_interest_rate: editingProduct.max_nominal_interest_rate?.toString() || "",
      default_nominal_interest_rate: editingProduct.default_nominal_interest_rate?.toString() || "",
      
      // Use defaults for new fields if not present
      ...defaultValues,
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
        repayment_frequency: data.repayment_frequency,
        
        // Principal amounts
        min_principal: parseFloat(data.min_principal),
        max_principal: parseFloat(data.max_principal),
        default_principal: data.default_principal ? parseFloat(data.default_principal) : null,
        
        // Terms
        min_term: parseInt(data.min_term),
        max_term: parseInt(data.max_term),
        default_term: data.default_term ? parseInt(data.default_term) : null,
        
        // Interest rates
        min_nominal_interest_rate: parseFloat(data.min_nominal_interest_rate),
        max_nominal_interest_rate: parseFloat(data.max_nominal_interest_rate),
        default_nominal_interest_rate: data.default_nominal_interest_rate ? parseFloat(data.default_nominal_interest_rate) : null,
        
        // Interest calculation settings
        interest_calculation_method: data.interest_calculation_method,
        interest_calculation_period: data.interest_calculation_period,
        compounding_frequency: data.compounding_frequency,
        allow_partial_period_interest: data.allow_partial_period_interest,
        
        // Grace period and tolerance
        grace_period_type: data.grace_period_type,
        grace_period_duration: parseInt(data.grace_period_duration),
        arrears_tolerance_amount: parseFloat(data.arrears_tolerance_amount),
        arrears_tolerance_days: parseInt(data.arrears_tolerance_days),
        moratorium_period: parseInt(data.moratorium_period),
        
        // Prepayment and reschedule settings
        pre_closure_interest_calculation_rule: data.pre_closure_interest_calculation_rule,
        advance_payments_adjustment_type: data.advance_payments_adjustment_type,
        reschedule_strategy: data.reschedule_strategy,
        
        // Fees and charges
        processing_fee_amount: parseFloat(data.processing_fee_amount),
        processing_fee_percentage: parseFloat(data.processing_fee_percentage),
        late_payment_penalty_amount: parseFloat(data.late_payment_penalty_amount),
        late_payment_penalty_percentage: parseFloat(data.late_payment_penalty_percentage),
        early_repayment_penalty_amount: parseFloat(data.early_repayment_penalty_amount),
        early_repayment_penalty_percentage: parseFloat(data.early_repayment_penalty_percentage),
        
        // Accounting journal mappings
        loan_portfolio_account_id: data.loan_portfolio_account_id || null,
        interest_receivable_account_id: data.interest_receivable_account_id || null,
        interest_income_account_id: data.interest_income_account_id || null,
        fee_income_account_id: data.fee_income_account_id || null,
        penalty_income_account_id: data.penalty_income_account_id || null,
        provision_account_id: data.provision_account_id || null,
        writeoff_expense_account_id: data.writeoff_expense_account_id || null,
        overpayment_liability_account_id: data.overpayment_liability_account_id || null,
        suspended_income_account_id: data.suspended_income_account_id || null,
        fund_source_account_id: data.fund_source_account_id || null,
        
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

  const fillSampleData = () => {
    const sampleData = {
      name: "Sample Personal Loan",
      short_name: "SPL",
      description: "A sample personal loan product for testing",
      currency_code: "USD",
      min_principal: "1000",
      max_principal: "50000",
      default_principal: "10000",
      min_term: "6",
      max_term: "60",
      default_term: "24",
      min_nominal_interest_rate: "5.0",
      max_nominal_interest_rate: "25.0",
      default_nominal_interest_rate: "12.0",
      repayment_frequency: "monthly"
    };
    
    Object.entries(sampleData).forEach(([key, value]) => {
      form.setValue(key as keyof LoanProductFormData, value);
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>{editingProduct ? 'Edit Loan Product' : 'Create Loan Product'}</DialogTitle>
            {!editingProduct && <SampleDataButton onFillSampleData={fillSampleData} />}
          </div>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="basic">Basic</TabsTrigger>
                <TabsTrigger value="terms">Terms</TabsTrigger>
                <TabsTrigger value="interest">Interest</TabsTrigger>
                <TabsTrigger value="fees">Fees</TabsTrigger>
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
                <LoanProductInterestTab form={form} />
              </TabsContent>

              <TabsContent value="fees" className="space-y-4">
                <LoanProductFeesTab form={form} />
              </TabsContent>

              <TabsContent value="accounting" className="space-y-4">
                <LoanProductAccountingTab form={form} tenantId={tenantId} />
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