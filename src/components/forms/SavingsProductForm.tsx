import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCreateSavingsProduct, useUpdateSavingsProduct, SavingsProduct } from "@/hooks/useSupabase";
import { useChartOfAccounts } from "@/hooks/useChartOfAccounts";
import { usePaymentTypes } from "@/hooks/usePaymentTypes";
import { Loader2, Plus, X } from "lucide-react";
import { SampleDataButton } from "@/components/dev/SampleDataButton";
import { generateSampleSavingsProductData } from "@/lib/dev-utils";
import { useCurrency } from "@/contexts/CurrencyContext";

const savingsProductSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  short_name: z.string().min(1, "Short name is required"),
  description: z.string().optional(),
  currency_code: z.string().min(3, "Currency code is required"),
  nominal_annual_interest_rate: z.number().min(0, "Interest rate must be positive"),
  min_required_opening_balance: z.number().min(0, "Minimum opening balance must be positive"),
  min_balance_for_interest_calculation: z.number().min(0, "Minimum balance for interest must be positive"),
  max_overdraft_amount: z.number().min(0, "Maximum overdraft amount must be positive").optional(),
  is_active: z.boolean().default(true),
  
  // Accounting & General Ledger
  accounting_method: z.string().min(1, "Accounting method is required"),
  savings_reference_account_id: z.string().min(1, "Savings reference account is required"),
  savings_control_account_id: z.string().min(1, "Savings control account is required"),
  interest_on_savings_account_id: z.string().min(1, "Interest on savings account is required"),
  income_from_fees_account_id: z.string().min(1, "Income from fees account is required"),
  income_from_penalties_account_id: z.string().min(1, "Income from penalties account is required"),
  overdraft_portfolio_control_id: z.string().optional(),
  escheatment_liability_account_id: z.string().optional(),
  dormancy_tracking_account_id: z.string().optional(),
  withholding_tax_account_id: z.string().optional(),
  savings_operation_expense_account_id: z.string().optional(),
  
  // Advanced Accounting - Payment Type Mappings
  payment_type_mappings: z.array(z.object({
    payment_type: z.string(),
    asset_account_id: z.string(),
  })).optional(),
  
  // Advanced Accounting - Fee Mappings
  fee_mappings: z.array(z.object({
    fee_name: z.string(),
    fee_type: z.string(),
    income_account_id: z.string(),
  })).optional(),
});

type SavingsProductFormValues = z.infer<typeof savingsProductSchema>;

interface SavingsProductFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenantId: string;
  editingProduct?: SavingsProduct | null;
}

export const SavingsProductForm = ({ open, onOpenChange, tenantId, editingProduct }: SavingsProductFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createSavingsProduct = useCreateSavingsProduct();
  const updateSavingsProduct = useUpdateSavingsProduct();
  const { data: accounts } = useChartOfAccounts();
  const { data: paymentTypes } = usePaymentTypes();
  const { currency, currencySymbol } = useCurrency();

  const assetAccounts = accounts?.filter(acc => acc.account_type === 'asset') || [];
  const liabilityAccounts = accounts?.filter(acc => acc.account_type === 'liability') || [];
  const incomeAccounts = accounts?.filter(acc => acc.account_type === 'income') || [];
  const expenseAccounts = accounts?.filter(acc => acc.account_type === 'expense') || [];

  const form = useForm<SavingsProductFormValues>({
    resolver: zodResolver(savingsProductSchema),
    defaultValues: {
      name: "",
      short_name: "",
      description: "",
      currency_code: "USD",
      nominal_annual_interest_rate: 5.0,
      min_required_opening_balance: 100,
      min_balance_for_interest_calculation: 50,
      max_overdraft_amount: 0,
      is_active: true,
      
      // Accounting & General Ledger
      accounting_method: "accrual_periodic",
      savings_reference_account_id: "",
      savings_control_account_id: "",
      interest_on_savings_account_id: "",
      income_from_fees_account_id: "",
      income_from_penalties_account_id: "",
      overdraft_portfolio_control_id: "",
      escheatment_liability_account_id: "",
      dormancy_tracking_account_id: "",
      withholding_tax_account_id: "",
      savings_operation_expense_account_id: "",
      
      // Advanced Accounting
      payment_type_mappings: [],
      fee_mappings: [],
    },
  });

  // Reset form when editingProduct changes
  useEffect(() => {
    if (editingProduct) {
      form.reset({
        name: editingProduct.name,
        short_name: editingProduct.short_name,
        description: editingProduct.description || "",
        currency_code: editingProduct.currency_code,
        nominal_annual_interest_rate: editingProduct.nominal_annual_interest_rate,
        min_required_opening_balance: editingProduct.min_required_opening_balance,
        min_balance_for_interest_calculation: editingProduct.min_balance_for_interest_calculation,
        max_overdraft_amount: (editingProduct as any).max_overdraft_amount || 0,
        is_active: editingProduct.is_active,
        
        // Accounting & General Ledger - use existing or default values
        accounting_method: (editingProduct as any).accounting_method || "accrual_periodic",
        savings_reference_account_id: (editingProduct as any).savings_reference_account_id || "",
        savings_control_account_id: (editingProduct as any).savings_control_account_id || "",
        interest_on_savings_account_id: (editingProduct as any).interest_on_savings_account_id || "",
        income_from_fees_account_id: (editingProduct as any).income_from_fees_account_id || "",
        income_from_penalties_account_id: (editingProduct as any).income_from_penalties_account_id || "",
        overdraft_portfolio_control_id: (editingProduct as any).overdraft_portfolio_control_id || "",
        escheatment_liability_account_id: (editingProduct as any).escheatment_liability_account_id || "",
        dormancy_tracking_account_id: (editingProduct as any).dormancy_tracking_account_id || "",
        withholding_tax_account_id: (editingProduct as any).withholding_tax_account_id || "",
        savings_operation_expense_account_id: (editingProduct as any).savings_operation_expense_account_id || "",
        
        // Advanced Accounting
        payment_type_mappings: (editingProduct as any).payment_type_mappings || [],
        fee_mappings: (editingProduct as any).fee_mappings || [],
      });
    } else {
      form.reset({
        name: "",
        short_name: "",
        description: "",
        currency_code: "USD",
        nominal_annual_interest_rate: 5.0,
        min_required_opening_balance: 100,
        min_balance_for_interest_calculation: 50,
        max_overdraft_amount: 0,
        is_active: true,
        
        // Accounting & General Ledger
        accounting_method: "accrual_periodic",
        savings_reference_account_id: "",
        savings_control_account_id: "",
        interest_on_savings_account_id: "",
        income_from_fees_account_id: "",
        income_from_penalties_account_id: "",
        overdraft_portfolio_control_id: "",
        escheatment_liability_account_id: "",
        dormancy_tracking_account_id: "",
        withholding_tax_account_id: "",
        savings_operation_expense_account_id: "",
        
        // Advanced Accounting
        payment_type_mappings: [],
        fee_mappings: [],
      });
    }
  }, [editingProduct, form]);

  const onSubmit = async (values: SavingsProductFormValues) => {
    setIsSubmitting(true);
    try {
      if (editingProduct) {
        await updateSavingsProduct.mutateAsync({
          id: editingProduct.id,
          name: values.name,
          short_name: values.short_name,
          description: values.description || null,
          currency_code: values.currency_code,
          nominal_annual_interest_rate: values.nominal_annual_interest_rate,
          min_required_opening_balance: values.min_required_opening_balance,
          min_balance_for_interest_calculation: values.min_balance_for_interest_calculation,
          is_active: values.is_active,
        });
      } else {
        await createSavingsProduct.mutateAsync({
          tenant_id: tenantId,
          name: values.name,
          short_name: values.short_name,
          description: values.description || null,
          currency_code: values.currency_code,
          nominal_annual_interest_rate: values.nominal_annual_interest_rate,
          min_required_opening_balance: values.min_required_opening_balance,
          min_balance_for_interest_calculation: values.min_balance_for_interest_calculation,
          is_active: values.is_active,
          mifos_product_id: null,
        });
      }
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving savings product:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillSampleData = () => {
    const sampleData = generateSampleSavingsProductData();
    Object.entries(sampleData).forEach(([key, value]) => {
      if (typeof value === 'string' && !isNaN(parseFloat(value))) {
        form.setValue(key as keyof SavingsProductFormValues, parseFloat(value));
      } else {
        form.setValue(key as keyof SavingsProductFormValues, value);
      }
    });
  };

  const addPaymentTypeMapping = () => {
    const current = form.getValues('payment_type_mappings') || [];
    form.setValue('payment_type_mappings', [...current, { payment_type: '', asset_account_id: '' }]);
  };

  const removePaymentTypeMapping = (index: number) => {
    const current = form.getValues('payment_type_mappings') || [];
    form.setValue('payment_type_mappings', current.filter((_, i) => i !== index));
  };

  const addFeeMapping = () => {
    const current = form.getValues('fee_mappings') || [];
    form.setValue('fee_mappings', [...current, { fee_name: '', fee_type: '', income_account_id: '' }]);
  };

  const removeFeeMapping = (index: number) => {
    const current = form.getValues('fee_mappings') || [];
    form.setValue('fee_mappings', current.filter((_, i) => i !== index));
  };

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{editingProduct ? 'Edit Savings Product' : 'Create Savings Product'}</CardTitle>
            <CardDescription>
              {editingProduct ? 'Update savings product configuration' : 'Configure a new savings product with interest rates and minimum balance requirements'}
            </CardDescription>
          </div>
          <SampleDataButton onFillSampleData={fillSampleData} />
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Basic Information</TabsTrigger>
                <TabsTrigger value="terms">Terms & Limits</TabsTrigger>
                <TabsTrigger value="accounting">Advanced Accounting</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Regular Savings" {...field} />
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
                          <Input placeholder="REG-SAV" {...field} />
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
                        <Textarea 
                          placeholder="Describe the savings product features and benefits..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="currency_code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currency</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value || currency}>
                        <FormControl>
                          <SelectTrigger className="bg-background">
                            <SelectValue placeholder="Default currency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-background border shadow-md z-50">
                          <SelectItem value={currency}>
                            {currency} - {currencySymbol}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="terms" className="space-y-6">
                {/* Interest Rate and Terms */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="nominal_annual_interest_rate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Annual Interest Rate (%)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.1" 
                            placeholder="5.0"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormDescription>
                          Annual interest rate as a percentage
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Balance Requirements and Limits */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="min_required_opening_balance"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Minimum Opening Balance</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01" 
                            placeholder="100.00"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormDescription>
                          Minimum amount required to open account
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="min_balance_for_interest_calculation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Minimum Balance for Interest</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01" 
                            placeholder="50.00"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormDescription>
                          Minimum balance to earn interest
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="max_overdraft_amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Maximum Overdraft Amount</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01" 
                            placeholder="0.00"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormDescription>
                          Maximum overdraft limit allowed (0 = No overdraft)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="is_active"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Active Product</FormLabel>
                        <FormDescription>
                          Enable this product for new account openings
                        </FormDescription>
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
              </TabsContent>

              <TabsContent value="accounting" className="space-y-6">
                {/* Basic Accounting Configuration */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Basic Accounting Configuration</h3>
                    <p className="text-sm text-muted-foreground">
                      Configure general ledger accounts and accounting method for this savings product
                    </p>
                  </div>

                  <FormField
                    control={form.control}
                    name="accounting_method"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Accounting Method</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select accounting method" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="accrual_periodic">Accrual Periodic</SelectItem>
                            <SelectItem value="cash">Cash Accounting</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="savings_reference_account_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Savings Reference Account</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select savings reference account" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {assetAccounts.map((account) => (
                                <SelectItem key={account.id} value={account.id}>
                                  {account.account_code} - {account.account_name}
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
                      name="savings_control_account_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Savings Control Account</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select savings control account" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {liabilityAccounts.map((account) => (
                                <SelectItem key={account.id} value={account.id}>
                                  {account.account_code} - {account.account_name}
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
                      name="interest_on_savings_account_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Interest on Savings Account</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select interest account" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {expenseAccounts.map((account) => (
                                <SelectItem key={account.id} value={account.id}>
                                  {account.account_code} - {account.account_name}
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
                      name="income_from_fees_account_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Income from Fees Account</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select fee income account" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {incomeAccounts.map((account) => (
                                <SelectItem key={account.id} value={account.id}>
                                  {account.account_code} - {account.account_name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Payment Type Mappings */}
                <div className="space-y-4 border-t pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium">Payment Type Mappings</h3>
                      <p className="text-sm text-muted-foreground">
                        Map payment types to specific asset accounts
                      </p>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={addPaymentTypeMapping}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Mapping
                    </Button>
                  </div>

                  {(form.watch('payment_type_mappings') || []).map((mapping, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg">
                      <FormField
                        control={form.control}
                        name={`payment_type_mappings.${index}.payment_type`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Payment Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select payment type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {paymentTypes?.map((type) => (
                                  <SelectItem key={type.id} value={type.name}>
                                    {type.name}
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
                        name={`payment_type_mappings.${index}.asset_account_id`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Asset Account</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select asset account" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {assetAccounts.map((account) => (
                                  <SelectItem key={account.id} value={account.id}>
                                    {account.account_code} - {account.account_name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex items-end">
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm" 
                          onClick={() => removePaymentTypeMapping(index)}
                          className="h-10"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Fee Mappings */}
                <div className="space-y-4 border-t pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium">Fee Mappings</h3>
                      <p className="text-sm text-muted-foreground">
                        Map savings fees to income accounts
                      </p>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={addFeeMapping}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Fee Mapping
                    </Button>
                  </div>

                  {(form.watch('fee_mappings') || []).map((mapping, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg">
                      <FormField
                        control={form.control}
                        name={`fee_mappings.${index}.fee_name`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Fee Name</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Monthly Fee" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`fee_mappings.${index}.fee_type`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Fee Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select fee type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="maintenance">Maintenance Fee</SelectItem>
                                <SelectItem value="withdrawal">Withdrawal Fee</SelectItem>
                                <SelectItem value="overdraft">Overdraft Fee</SelectItem>
                                <SelectItem value="closure">Account Closure Fee</SelectItem>
                                <SelectItem value="other">Other Fee</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`fee_mappings.${index}.income_account_id`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Income Account</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select income account" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {incomeAccounts.map((account) => (
                                  <SelectItem key={account.id} value={account.id}>
                                    {account.account_code} - {account.account_name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex items-end">
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm" 
                          onClick={() => removeFeeMapping(index)}
                          className="h-10"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingProduct ? 'Update Product' : 'Create Product'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};