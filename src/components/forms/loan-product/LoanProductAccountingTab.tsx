import { UseFormReturn } from "react-hook-form";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoanProductFormData } from "./LoanProductSchema";
import { useChartOfAccounts } from "@/hooks/useChartOfAccounts";

interface LoanProductAccountingTabProps {
  form: UseFormReturn<LoanProductFormData>;
}

export const LoanProductAccountingTab = ({ form }: LoanProductAccountingTabProps) => {
  const { data: accounts } = useChartOfAccounts();

  const assetAccounts = accounts?.filter(acc => acc.account_type === 'asset') || [];
  const liabilityAccounts = accounts?.filter(acc => acc.account_type === 'liability') || [];
  const incomeAccounts = accounts?.filter(acc => acc.account_type === 'income') || [];
  const expenseAccounts = accounts?.filter(acc => acc.account_type === 'expense') || [];

  return (
    <div className="space-y-6">
      {/* Accounting Method */}
      <Card>
        <CardHeader>
          <CardTitle>Accounting Method</CardTitle>
          <CardDescription>
            Choose how financial transactions for this loan product will be recorded
          </CardDescription>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>

      {/* Asset Accounts */}
      <Card>
        <CardHeader>
          <CardTitle>Asset Accounts</CardTitle>
          <CardDescription>
            Configure asset accounts for loan disbursements and receivables
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="fund_source_account_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fund Source Account</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select fund source account" />
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
              name="loan_portfolio_account_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Loan Portfolio Account</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select loan portfolio account" />
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
              name="suspense_account_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Suspense Account</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select suspense account" />
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
              name="overpayment_account_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Overpayment Account</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select overpayment account" />
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
          </div>
        </CardContent>
      </Card>

      {/* Income Accounts */}
      <Card>
        <CardHeader>
          <CardTitle>Income Accounts</CardTitle>
          <CardDescription>
            Configure income accounts for interest, fees, and penalties
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="interest_on_loans_account_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Interest on Loans Account</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select interest income account" />
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
              name="losses_written_off_account_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Losses Written Off Account</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select losses account" />
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
        </CardContent>
      </Card>

      {/* Transfer Accounts */}
      <Card>
        <CardHeader>
          <CardTitle>Transfer Accounts</CardTitle>
          <CardDescription>
            Configure accounts for loan transfers and suspense transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FormField
            control={form.control}
            name="transferred_in_suspense_account_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Transferred in Suspense Account</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select transfer suspense account" />
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
        </CardContent>
      </Card>
    </div>
  );
};