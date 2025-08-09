import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft, ChevronRight } from "lucide-react";
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
  const [currentTab, setCurrentTab] = useState("basic");
  const createLoanProductMutation = useCreateLoanProduct();
  const updateLoanProductMutation = useUpdateLoanProduct();
  const saveAdvancedRef = useRef<null | ((productId: string) => Promise<void>)>(null);

  console.log("=== LOAN PRODUCT FORM RENDER ===");
  console.log("Open:", open);
  console.log("Editing product:", editingProduct);
  console.log("Current tab:", currentTab);

  const tabs = [
    { value: "basic", label: "Basic Info" },
    { value: "terms", label: "Loan Terms" },
    { value: "interest", label: "Interest" },
    { value: "fees", label: "Fees" },
    { value: "accounting", label: "Accounting" },
    { value: "advanced", label: "Advanced" },
  ];

  const currentTabIndex = tabs.findIndex(tab => tab.value === currentTab);
  const isLastTab = currentTabIndex === tabs.length - 1;
  const isFirstTab = currentTabIndex === 0;

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
      
      // Fees & Charges
      processing_fee_amount: (editingProduct as any).processing_fee_amount?.toString() || "0",
      processing_fee_percentage: (editingProduct as any).processing_fee_percentage?.toString() || "0",
      late_payment_penalty_amount: (editingProduct as any).late_payment_penalty_amount?.toString() || "0",
      late_payment_penalty_percentage: (editingProduct as any).late_payment_penalty_percentage?.toString() || "0",
      early_repayment_penalty_amount: (editingProduct as any).early_repayment_penalty_amount?.toString() || "0",
      early_repayment_penalty_percentage: (editingProduct as any).early_repayment_penalty_percentage?.toString() || "0",
      
      // Fee Structure Mappings
      linked_fee_ids: (editingProduct as any).linked_fee_ids || [],
      
      // Use defaults for other fields
      fund_id: (editingProduct as any).fund_id || "",
      ...defaultValues,
    } : defaultValues,
  });

  // Reset form when editingProduct changes
  useEffect(() => {
    if (editingProduct) {
      form.reset({
        // Basic Information
        name: editingProduct.name,
        short_name: editingProduct.short_name,
        description: editingProduct.description || "",
        currency_code: editingProduct.currency_code,
        repayment_frequency: editingProduct.repayment_frequency || "monthly",
        fund_id: (editingProduct as any).fund_id || "",
        
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
        
        // Interest Calculation Settings
        interest_calculation_method: (editingProduct as any).interest_calculation_method || "declining_balance",
        interest_calculation_period: (editingProduct as any).interest_calculation_period || "monthly",
        compounding_frequency: (editingProduct as any).compounding_frequency || "monthly",
        allow_partial_period_interest: (editingProduct as any).allow_partial_period_interest ?? true,
        
        // Grace Period & Tolerance
        grace_period_type: (editingProduct as any).grace_period_type || "none",
        grace_period_duration: (editingProduct as any).grace_period_duration?.toString() || "0",
        arrears_tolerance_amount: (editingProduct as any).arrears_tolerance_amount?.toString() || "0",
        arrears_tolerance_days: (editingProduct as any).arrears_tolerance_days?.toString() || "0",
        moratorium_period: (editingProduct as any).moratorium_period?.toString() || "0",
        
        // Prepayment & Reschedule Settings
        pre_closure_interest_calculation_rule: (editingProduct as any).pre_closure_interest_calculation_rule || "till_pre_close_date",
        advance_payments_adjustment_type: (editingProduct as any).advance_payments_adjustment_type || "reduce_emi",
        reschedule_strategy: (editingProduct as any).reschedule_strategy || "reduce_emi",
        
        // Fees & Charges
        processing_fee_amount: (editingProduct as any).processing_fee_amount?.toString() || "0",
        processing_fee_percentage: (editingProduct as any).processing_fee_percentage?.toString() || "0",
        late_payment_penalty_amount: (editingProduct as any).late_payment_penalty_amount?.toString() || "0",
        late_payment_penalty_percentage: (editingProduct as any).late_payment_penalty_percentage?.toString() || "0",
        early_repayment_penalty_amount: (editingProduct as any).early_repayment_penalty_amount?.toString() || "0",
        early_repayment_penalty_percentage: (editingProduct as any).early_repayment_penalty_percentage?.toString() || "0",
        
        // Fee Structure Mappings - fix the loading of linked fees
        linked_fee_ids: (editingProduct as any).linked_fee_ids || [],
        
        // Accounting Configuration
        accounting_type: (editingProduct as any).accounting_type || "cash",
        
        // Accounting Journal Mappings
        loan_portfolio_account_id: (editingProduct as any).loan_portfolio_account_id || "",
        interest_receivable_account_id: (editingProduct as any).interest_receivable_account_id || "",
        fee_receivable_account_id: (editingProduct as any).fee_receivable_account_id || "",
        penalty_receivable_account_id: (editingProduct as any).penalty_receivable_account_id || "",
        interest_income_account_id: (editingProduct as any).interest_income_account_id || "",
        fee_income_account_id: (editingProduct as any).fee_income_account_id || "",
        penalty_income_account_id: (editingProduct as any).penalty_income_account_id || "",
        provision_account_id: (editingProduct as any).provision_account_id || "",
        writeoff_expense_account_id: (editingProduct as any).writeoff_expense_account_id || "",
        overpayment_liability_account_id: (editingProduct as any).overpayment_liability_account_id || "",
        suspended_income_account_id: (editingProduct as any).suspended_income_account_id || "",
        fund_source_account_id: (editingProduct as any).fund_source_account_id || "",
        
        // Advanced Payment Account Mappings
        principal_payment_account_id: (editingProduct as any).principal_payment_account_id || "",
        interest_payment_account_id: (editingProduct as any).interest_payment_account_id || "",
        fee_payment_account_id: (editingProduct as any).fee_payment_account_id || "",
        penalty_payment_account_id: (editingProduct as any).penalty_payment_account_id || "",
      });
    } else {
      form.reset(defaultValues);
    }
  }, [editingProduct, form]);

  const onSubmit = async (data: LoanProductFormData) => {
    console.log("Form submission started", { editingProduct: !!editingProduct, data });
    setIsSubmitting(true);
    
    const productData: Omit<LoanProduct, 'id' | 'created_at' | 'updated_at'> = {
      tenant_id: tenantId,
      name: data.name,
      short_name: data.short_name,
      description: data.description || null,
      currency_code: data.currency_code,
      
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
      
      // Required fields
      repayment_frequency: data.repayment_frequency,
      // Preserve current flags if editing, else default to active
      is_active: editingProduct ? editingProduct.is_active : true,
      mifos_product_id: editingProduct ? (editingProduct.mifos_product_id ?? null) : null,
    };


    try {
      if (editingProduct) {
        console.log("Updating loan product", { id: editingProduct.id });
        const updated = await updateLoanProductMutation.mutateAsync({
          id: editingProduct.id,
          ...productData,
        });
        await saveAdvancedRef.current?.(editingProduct.id);
      } else {
        console.log("Creating new loan product");
        const created: any = await createLoanProductMutation.mutateAsync(productData);
        if (created?.id) {
          await saveAdvancedRef.current?.(created.id);
        }
      }
      
      form.reset();
      onOpenChange(false);
    } catch (error) {
      // Let the mutation hooks handle error display
      console.error("Error saving loan product:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillSampleData = () => {
    const sampleData = {
      // Basic Information
      name: "Sample Personal Loan",
      short_name: "SPL",
      description: "A comprehensive personal loan product for testing all features",
      currency_code: "USD",
      repayment_frequency: "monthly",
      
      // Loan Terms
      min_principal: "1000",
      max_principal: "50000",
      default_principal: "10000",
      min_term: "6",
      max_term: "60",
      default_term: "24",
      
      // Interest & Rates
      min_nominal_interest_rate: "5.0",
      max_nominal_interest_rate: "25.0",
      default_nominal_interest_rate: "12.0",
      interest_calculation_method: "flat",
      interest_calculation_period: "same_as_repayment_period",
      compounding_frequency: "monthly",
      allow_partial_period_interest: false,
      
      // Grace Period & Tolerance
      grace_period_type: "none",
      grace_period_duration: "0",
      arrears_tolerance_amount: "100",
      arrears_tolerance_days: "3",
      moratorium_period: "0",
      
      // Prepayment & Reschedule
      pre_closure_interest_calculation_rule: "till_pre_closure_date",
      advance_payments_adjustment_type: "reduce_emi",
      reschedule_strategy: "reschedule_next_repayments",
      
      // Fees and Charges
      processing_fee_amount: "50",
      processing_fee_percentage: "2.5",
      late_payment_penalty_amount: "25",
      late_payment_penalty_percentage: "1.0",
      early_repayment_penalty_amount: "100",
      early_repayment_penalty_percentage: "3.0",
      
      // Fee mappings
      linked_fee_ids: [],
      accounting_type: "cash_based",
      
      // Fund mapping - will be set to empty, user can select
      fund_id: "",
      
      // Account mappings - these will be empty for user to select
      loan_portfolio_account_id: "",
      interest_receivable_account_id: "",
      interest_income_account_id: "",
      fee_income_account_id: "",
      penalty_income_account_id: "",
      provision_account_id: "",
      writeoff_expense_account_id: "",
      overpayment_liability_account_id: "",
      suspended_income_account_id: "",
      fund_source_account_id: "",
      principal_payment_account_id: "",
      interest_payment_account_id: "",
      fee_payment_account_id: "",
      penalty_payment_account_id: "",
    };
    
    Object.entries(sampleData).forEach(([key, value]) => {
      form.setValue(key as keyof LoanProductFormData, value);
    });
  };

  const validateCurrentTab = async () => {
    const currentTabFields = getTabFields(currentTab);
    const fieldPromises = currentTabFields.map(fieldName => form.trigger(fieldName));
    const results = await Promise.all(fieldPromises);
    return results.every(result => result);
  };

  const getTabFields = (tab: string): Array<keyof LoanProductFormData> => {
    switch (tab) {
      case 'basic':
        return ['name', 'short_name', 'currency_code', 'repayment_frequency', 'fund_id'];
      case 'terms':
        return ['min_principal', 'max_principal', 'min_term', 'max_term'];
      case 'interest':
        return ['min_nominal_interest_rate', 'max_nominal_interest_rate'];
      case 'fees':
        return ['linked_fee_ids', 'processing_fee_amount', 'processing_fee_percentage'];
      case 'accounting':
        return ['accounting_type'];
      case 'advanced':
        return [];
      default:
        return [];
    }
  };

  const handleNext = async () => {
    const isValid = await validateCurrentTab();
    if (!isValid) {
      return; // Don't move to next tab if current tab has validation errors
    }
    
    if (currentTabIndex < tabs.length - 1) {
      setCurrentTab(tabs[currentTabIndex + 1].value);
    }
  };

  const handlePrevious = () => {
    if (currentTabIndex > 0) {
      setCurrentTab(tabs[currentTabIndex - 1].value);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>{editingProduct ? 'Edit Loan Product' : 'Create Loan Product'}</DialogTitle>
            <SampleDataButton onFillSampleData={fillSampleData} />
          </div>
          <div className="flex items-center space-x-2 mt-4">
            <div className="text-sm text-muted-foreground">
              Step {currentTabIndex + 1} of {tabs.length}: {tabs[currentTabIndex].label}
            </div>
            <div className="flex-1 bg-muted rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-200"
                style={{ width: `${((currentTabIndex + 1) / tabs.length) * 100}%` }}
              />
            </div>
          </div>
        </DialogHeader>
        <Form {...form}>
          <div className="space-y-6">
            <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
              <TabsList className="grid w-full grid-cols-6">
                {tabs.map((tab) => (
                  <TabsTrigger key={tab.value} value={tab.value}>
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
                <LoanProductBasicInfoTab form={form} tenantId={tenantId} />
              </TabsContent>

              <TabsContent value="terms" className="space-y-4">
                <LoanProductTermsTab form={form} />
              </TabsContent>

              <TabsContent value="interest" className="space-y-4">
                <LoanProductInterestTab form={form} />
              </TabsContent>

              <TabsContent value="fees" className="space-y-4">
                <LoanProductFeesTab form={form} tenantId={tenantId} />
              </TabsContent>

              <TabsContent value="accounting" className="space-y-4">
                <LoanProductAccountingTab form={form} tenantId={tenantId} />
              </TabsContent>

              <TabsContent value="advanced" className="space-y-4">
                <LoanProductAdvancedTab form={form} tenantId={tenantId} productId={editingProduct?.id} productType="loan" onRegisterSave={(fn) => { saveAdvancedRef.current = fn; }} />
              </TabsContent>
            </Tabs>

            <div className="flex justify-between">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handlePrevious}
                disabled={isFirstTab}
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>
              
              <div className="flex space-x-2">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                
                {isLastTab ? (
                  <Button 
                    type="button"
                    onClick={(e) => {
                      console.log("=== BUTTON CLICKED ===");
                      console.log("Current tab:", currentTab);
                      console.log("Is last tab:", isLastTab);
                      console.log("Editing product:", editingProduct);
                      console.log("Is submitting:", isSubmitting);
                      console.log("Form errors:", form.formState.errors);
                      e.preventDefault();
                      try {
                        form.handleSubmit(onSubmit)(e);
                      } catch (error) {
                        console.error("Submit error:", error);
                      }
                    }}
                    disabled={isSubmitting}
                  >
                    {isSubmitting 
                      ? (editingProduct ? "Updating..." : "Creating...") 
                      : (editingProduct ? "Update Product" : "Create Product")
                    }
                  </Button>
                ) : (
                  <>
                    <Button type="button" onClick={handleNext}>
                      Next
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                    {/* {console.log("Showing Next button instead of Submit button")} */}
                  </>
                )}
              </div>
            </div>
          </div>
        </Form>
      </DialogContent>
    </Dialog>
  );
};