import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useCreateLoanProduct } from "@/hooks/useSupabase";

const loanProductSchema = z.object({
  // Basic Information
  name: z.string().min(1, "Product name is required"),
  short_name: z.string().min(1, "Short name is required"),
  description: z.string().optional(),
  currency_code: z.string().min(1, "Currency is required"),
  start_date: z.string().min(1, "Start date is required"),
  end_date: z.string().optional(),
  fund_type: z.string().min(1, "Fund type is required"),
  
  // Loan Terms
  min_principal: z.string().min(1, "Minimum principal is required"),
  max_principal: z.string().min(1, "Maximum principal is required"),
  default_principal: z.string().optional(),
  term_unit: z.string().min(1, "Term unit is required"),
  min_term: z.string().min(1, "Minimum term is required"),
  max_term: z.string().min(1, "Maximum term is required"),
  default_term: z.string().optional(),
  
  // Interest & Repayment
  min_nominal_interest_rate: z.string().min(1, "Minimum interest rate is required"),
  max_nominal_interest_rate: z.string().min(1, "Maximum interest rate is required"),
  default_nominal_interest_rate: z.string().optional(),
  interest_rate_per_period: z.string().optional(),
  repayment_frequency: z.string().min(1, "Repayment frequency is required"),
  grace_period: z.string().optional(),
  grace_period_type: z.string().optional(),
  amortization_method: z.string().min(1, "Amortization method is required"),
  interest_calculation_method: z.string().min(1, "Interest calculation method is required"),
  repayment_strategy: z.string().min(1, "Repayment strategy is required"),
  
  // Moratorium & Arrears
  moratorium_period: z.string().optional(),
  moratorium_interest: z.string().optional(),
  days_in_month_type: z.string().min(1, "Days in month type is required"),
  days_in_year_type: z.string().min(1, "Days in year type is required"),
  overdue_days_for_arrears: z.string().min(1, "Days for arrears is required"),
  overdue_days_for_npa: z.string().min(1, "Days for NPA is required"),
  account_moves_out_of_npa_only_on_arrears_completion: z.boolean(),
  
  // Guarantee & Funds
  guarantee_funds_on_hold: z.boolean(),
  minimum_guarantee_from_own_funds: z.string().optional(),
  minimum_guarantee_from_guarantor_funds: z.string().optional(),
  
  // Charges & Penalties
  include_in_borrower_cycle: z.boolean(),
  lock_in_period_frequency: z.string().optional(),
  lock_in_period_frequency_type: z.string().optional(),
  overdue_charge_calculation_method: z.string().optional(),
  overdue_charge_applicable: z.boolean(),
});

type LoanProductFormData = z.infer<typeof loanProductSchema>;

interface LoanProductFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenantId: string;
}

export const LoanProductForm = ({ open, onOpenChange, tenantId }: LoanProductFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createLoanProductMutation = useCreateLoanProduct();

  const form = useForm<LoanProductFormData>({
    resolver: zodResolver(loanProductSchema),
    defaultValues: {
      // Basic Information
      name: "",
      short_name: "",
      description: "",
      currency_code: "USD",
      start_date: "",
      end_date: "",
      fund_type: "internal",
      
      // Loan Terms
      min_principal: "",
      max_principal: "",
      default_principal: "",
      term_unit: "months",
      min_term: "",
      max_term: "",
      default_term: "",
      
      // Interest & Repayment
      min_nominal_interest_rate: "",
      max_nominal_interest_rate: "",
      default_nominal_interest_rate: "",
      interest_rate_per_period: "",
      repayment_frequency: "monthly",
      grace_period: "",
      grace_period_type: "none",
      amortization_method: "equal_installments",
      interest_calculation_method: "declining_balance",
      repayment_strategy: "penalties_fees_interest_principal",
      
      // Moratorium & Arrears
      moratorium_period: "",
      moratorium_interest: "none",
      days_in_month_type: "actual",
      days_in_year_type: "actual",
      overdue_days_for_arrears: "1",
      overdue_days_for_npa: "90",
      account_moves_out_of_npa_only_on_arrears_completion: true,
      
      // Guarantee & Funds
      guarantee_funds_on_hold: false,
      minimum_guarantee_from_own_funds: "",
      minimum_guarantee_from_guarantor_funds: "",
      
      // Charges & Penalties
      include_in_borrower_cycle: true,
      lock_in_period_frequency: "",
      lock_in_period_frequency_type: "days",
      overdue_charge_calculation_method: "outstanding_principal",
      overdue_charge_applicable: false,
    },
  });

  const onSubmit = async (data: LoanProductFormData) => {
    setIsSubmitting(true);
    try {
      await createLoanProductMutation.mutateAsync({
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
      });
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error("Error creating loan product:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Loan Product</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="terms">Loan Terms</TabsTrigger>
                <TabsTrigger value="interest">Interest & Repayment</TabsTrigger>
                <TabsTrigger value="arrears">Arrears & NPA</TabsTrigger>
                <TabsTrigger value="advanced">Advanced</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Personal Loan" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="short_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Short Name</FormLabel>
                        <FormControl>
                          <Input placeholder="PL" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Loan product description..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="currency_code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Currency</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select currency" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="USD">USD</SelectItem>
                            <SelectItem value="KES">KES</SelectItem>
                            <SelectItem value="EUR">EUR</SelectItem>
                            <SelectItem value="GBP">GBP</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="start_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="end_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Date (Optional)</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="fund_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fund Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select fund type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="internal">Internal Fund</SelectItem>
                          <SelectItem value="external">External Fund</SelectItem>
                          <SelectItem value="donor">Donor Fund</SelectItem>
                          <SelectItem value="government">Government Fund</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="terms" className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="min_principal"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Min Principal</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="1000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="max_principal"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Principal</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="50000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="default_principal"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Default Principal</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="10000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="term_unit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Term Unit</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select term unit" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="days">Days</SelectItem>
                            <SelectItem value="weeks">Weeks</SelectItem>
                            <SelectItem value="months">Months</SelectItem>
                            <SelectItem value="years">Years</SelectItem>
                          </SelectContent>
                        </Select>
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
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select frequency" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="bi_weekly">Bi-Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="quarterly">Quarterly</SelectItem>
                            <SelectItem value="semi_annually">Semi-Annually</SelectItem>
                            <SelectItem value="annually">Annually</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="min_term"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Min Term</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="1" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="max_term"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Term</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="60" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="default_term"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Default Term</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="12" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              <TabsContent value="interest" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="min_nominal_interest_rate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Min Interest Rate (% p.a.)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="5.0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="max_nominal_interest_rate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Interest Rate (% p.a.)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="15.0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="default_nominal_interest_rate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Default Interest Rate (% p.a.)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="10.0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="interest_rate_per_period"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Interest Rate Per Period (%)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="1.0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="amortization_method"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amortization Method</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select method" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="equal_installments">Equal Installments</SelectItem>
                            <SelectItem value="equal_principal_payments">Equal Principal Payments</SelectItem>
                            <SelectItem value="interest_only">Interest Only</SelectItem>
                            <SelectItem value="irregular">Irregular</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="interest_calculation_method"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Interest Calculation Method</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select method" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="declining_balance">Declining Balance</SelectItem>
                            <SelectItem value="flat">Flat</SelectItem>
                            <SelectItem value="declining_balance_equal_installments">Declining Balance Equal Installments</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="repayment_strategy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Repayment Strategy</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select strategy" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="penalties_fees_interest_principal">Penalties, Fees, Interest, Principal</SelectItem>
                          <SelectItem value="principal_interest_penalties_fees">Principal, Interest, Penalties, Fees</SelectItem>
                          <SelectItem value="interest_principal_penalties_fees">Interest, Principal, Penalties, Fees</SelectItem>
                          <SelectItem value="fees_penalties_interest_principal">Fees, Penalties, Interest, Principal</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="grace_period"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Grace Period</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="grace_period_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Grace Period Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            <SelectItem value="principal_only">Principal Only</SelectItem>
                            <SelectItem value="interest_only">Interest Only</SelectItem>
                            <SelectItem value="both">Both Principal & Interest</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="moratorium_period"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Moratorium Period</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="moratorium_interest"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Moratorium Interest</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select option" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            <SelectItem value="waived">Waived</SelectItem>
                            <SelectItem value="capitalize">Capitalize</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="days_in_month_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Days in Month</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="actual">Actual</SelectItem>
                            <SelectItem value="30">30 Days</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="days_in_year_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Days in Year</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="actual">Actual</SelectItem>
                            <SelectItem value="360">360 Days</SelectItem>
                            <SelectItem value="364">364 Days</SelectItem>
                            <SelectItem value="365">365 Days</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>

              <TabsContent value="arrears" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="overdue_days_for_arrears"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Days Overdue for Arrears</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="1" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="overdue_days_for_npa"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Days Overdue for NPA</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="90" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="account_moves_out_of_npa_only_on_arrears_completion"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Account moves out of NPA only after all arrears are cleared</FormLabel>
                        <div className="text-sm text-muted-foreground">
                          When enabled, loans can only exit NPA status after clearing all outstanding amounts
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="overdue_charge_applicable"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Overdue Charge Applicable</FormLabel>
                        <div className="text-sm text-muted-foreground">
                          Enable automatic overdue charges on late payments
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {form.watch("overdue_charge_applicable") && (
                  <FormField
                    control={form.control}
                    name="overdue_charge_calculation_method"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Overdue Charge Calculation Method</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select method" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="outstanding_principal">Outstanding Principal</SelectItem>
                            <SelectItem value="original_principal">Original Principal</SelectItem>
                            <SelectItem value="overdue_principal">Overdue Principal</SelectItem>
                            <SelectItem value="overdue_principal_interest">Overdue Principal + Interest</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </TabsContent>

              <TabsContent value="advanced" className="space-y-4">
                <FormField
                  control={form.control}
                  name="guarantee_funds_on_hold"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Guarantee Funds on Hold</FormLabel>
                        <div className="text-sm text-muted-foreground">
                          Require guarantee funds to be held for this loan product
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {form.watch("guarantee_funds_on_hold") && (
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="minimum_guarantee_from_own_funds"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Min Guarantee from Own Funds (%)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" placeholder="0.00" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="minimum_guarantee_from_guarantor_funds"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Min Guarantee from Guarantor Funds (%)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" placeholder="0.00" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                <FormField
                  control={form.control}
                  name="include_in_borrower_cycle"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Include in Borrower Cycle</FormLabel>
                        <div className="text-sm text-muted-foreground">
                          Include this product in borrower cycle calculations
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="lock_in_period_frequency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Lock-in Period Frequency</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="lock_in_period_frequency_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Lock-in Period Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="days">Days</SelectItem>
                            <SelectItem value="weeks">Weeks</SelectItem>
                            <SelectItem value="months">Months</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Product"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};