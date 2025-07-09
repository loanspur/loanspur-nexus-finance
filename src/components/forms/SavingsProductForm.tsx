import { useState } from "react";
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
import { useCreateSavingsProduct, useUpdateSavingsProduct, SavingsProduct } from "@/hooks/useSupabase";
import { useChartOfAccounts } from "@/hooks/useChartOfAccounts";
import { Loader2 } from "lucide-react";

const savingsProductSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  short_name: z.string().min(1, "Short name is required"),
  description: z.string().optional(),
  currency_code: z.string().min(3, "Currency code is required"),
  nominal_annual_interest_rate: z.number().min(0, "Interest rate must be positive"),
  min_required_opening_balance: z.number().min(0, "Minimum opening balance must be positive"),
  min_balance_for_interest_calculation: z.number().min(0, "Minimum balance for interest must be positive"),
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

  const assetAccounts = accounts?.filter(acc => acc.account_type === 'asset') || [];
  const liabilityAccounts = accounts?.filter(acc => acc.account_type === 'liability') || [];
  const incomeAccounts = accounts?.filter(acc => acc.account_type === 'revenue') || [];
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
    },
  });

  const onSubmit = async (values: SavingsProductFormValues) => {
    setIsSubmitting(true);
    try {
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
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error("Error creating savings product:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Create Savings Product</CardTitle>
        <CardDescription>
          Configure a new savings product with interest rates and minimum balance requirements
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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

            {/* Financial Terms */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        <SelectItem value="USD">USD - US Dollar</SelectItem>
                        <SelectItem value="KES">KES - Kenyan Shilling</SelectItem>
                        <SelectItem value="UGX">UGX - Ugandan Shilling</SelectItem>
                        <SelectItem value="TZS">TZS - Tanzanian Shilling</SelectItem>
                        <SelectItem value="EUR">EUR - Euro</SelectItem>
                        <SelectItem value="GBP">GBP - British Pound</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            </div>

            {/* Accounting Configuration */}
            <div className="space-y-4 border-t pt-6">
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Accounting Configuration</h3>
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

                <FormField
                  control={form.control}
                  name="income_from_penalties_account_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Income from Penalties Account</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select penalty income account" />
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

                <FormField
                  control={form.control}
                  name="overdraft_portfolio_control_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Overdraft Portfolio Control (Optional)</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select overdraft control account" />
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
                  name="escheatment_liability_account_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Escheatment Liability Account (Optional)</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select escheatment account" />
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
                  name="dormancy_tracking_account_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dormancy Tracking Account (Optional)</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select dormancy tracking account" />
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
                  name="withholding_tax_account_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Withholding Tax Account (Optional)</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select withholding tax account" />
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
                  name="savings_operation_expense_account_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Savings Operation Expense Account (Optional)</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select operation expense account" />
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
              </div>
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
                Create Product
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};