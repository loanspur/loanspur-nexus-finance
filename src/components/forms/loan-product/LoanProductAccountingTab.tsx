import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UseFormReturn } from "react-hook-form";
import { LoanProductFormData } from "./LoanProductSchema";
import { useChartOfAccounts } from "@/hooks/useChartOfAccounts";
import { Separator } from "@/components/ui/separator";

interface LoanProductAccountingTabProps {
  form: UseFormReturn<LoanProductFormData>;
  tenantId: string;
}

export const LoanProductAccountingTab = ({ form, tenantId }: LoanProductAccountingTabProps) => {
  const { data: chartOfAccounts = [] } = useChartOfAccounts();

  const getAccountsByType = (type: string) => 
    chartOfAccounts.filter(account => account.account_type === type);

  const assetAccounts = getAccountsByType('asset');
  const incomeAccounts = getAccountsByType('income');
  const expenseAccounts = getAccountsByType('expense');
  const liabilityAccounts = getAccountsByType('liability');

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Asset Accounts</h3>
        <p className="text-sm text-muted-foreground mb-4">Configure asset account mappings for loan operations</p>
        
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="loan_portfolio_account_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Loan Portfolio Account *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
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
            name="interest_receivable_account_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Interest Receivable Account</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select interest receivable account" />
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
            name="fund_source_account_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fund Source Account</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
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
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="text-lg font-medium">Income Accounts</h3>
        <p className="text-sm text-muted-foreground mb-4">Configure income account mappings for loan revenue</p>
        
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="interest_income_account_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Interest Income Account</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
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
            name="fee_income_account_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fee Income Account</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
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
            name="penalty_income_account_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Penalty Income Account</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
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
            name="suspended_income_account_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Suspended Income Account</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select suspended income account" />
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

      <Separator />

      <div>
        <h3 className="text-lg font-medium">Expense & Liability Accounts</h3>
        <p className="text-sm text-muted-foreground mb-4">Configure expense and liability account mappings</p>
        
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="provision_account_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Provision Account</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select provision account" />
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
            name="writeoff_expense_account_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Write-off Expense Account</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select write-off expense account" />
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
            name="overpayment_liability_account_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Overpayment Liability Account</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select overpayment liability account" />
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
      </div>
    </div>
  );
};