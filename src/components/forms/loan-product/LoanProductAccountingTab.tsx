import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UseFormReturn } from "react-hook-form";
import { LoanProductFormData } from "./LoanProductSchema";
import { useChartOfAccounts } from "@/hooks/useChartOfAccounts";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface LoanProductAccountingTabProps {
  form: UseFormReturn<LoanProductFormData>;
  tenantId: string;
}

export const LoanProductAccountingTab = ({ form, tenantId }: LoanProductAccountingTabProps) => {
  const { data: chartOfAccounts = [], isLoading } = useChartOfAccounts();
  const accountingType = form.watch('accounting_type');

  const getAccountsByType = (type: string) => 
    chartOfAccounts.filter(account => account.account_type === type && account.is_active);

  const getAccountsByCategory = (category: string) =>
    chartOfAccounts.filter(account => account.account_category === category && account.is_active);

  // Categorize accounts for better organization
  const assetAccounts = getAccountsByType('asset');
  const incomeAccounts = getAccountsByType('income');
  const expenseAccounts = getAccountsByType('expense');
  const liabilityAccounts = getAccountsByType('liability');

  // Get specific account categories
  const cashAccounts = getAccountsByCategory('cash_and_cash_equivalents');
  const loanAccounts = getAccountsByCategory('loans_and_advances');
  const receivableAccounts = getAccountsByCategory('receivables');
  const operatingExpenseAccounts = getAccountsByCategory('operating_expenses');
  const provisionAccounts = getAccountsByCategory('provisions');

  const isCashAccounting = accountingType === 'cash';
  const isAccrualAccounting = accountingType === 'accrual_periodic' || accountingType === 'accrual_upfront';

  // Helper function to render account options with better organization
  const renderAccountOptions = (accounts: any[], showBalance = false) => (
    accounts.map((account) => (
      <SelectItem key={account.id} value={account.id}>
        <div className="flex items-center justify-between w-full">
          <span>{account.account_code} - {account.account_name}</span>
          {showBalance && (
            <Badge variant={account.balance >= 0 ? "default" : "destructive"}>
              {new Intl.NumberFormat('en-US', { 
                style: 'currency', 
                currency: 'USD' 
              }).format(account.balance)}
            </Badge>
          )}
        </div>
      </SelectItem>
    ))
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              <span>Loading chart of accounts...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {chartOfAccounts.length === 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No chart of accounts found. Please set up your chart of accounts in the Accounting module first.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>Accounting Configuration</span>
            <Badge variant="outline">{chartOfAccounts.length} accounts available</Badge>
          </CardTitle>
          <CardDescription>
            Select the accounting method and map accounts from your chart of accounts to this loan product
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FormField
            control={form.control}
            name="accounting_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Accounting Type *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select accounting type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="cash">Cash Accounting</SelectItem>
                    <SelectItem value="accrual_periodic">Accrual Periodic</SelectItem>
                    <SelectItem value="accrual_upfront">Accrual Upfront</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>Asset Accounts</span>
            <Badge variant="secondary">{assetAccounts.length} available</Badge>
          </CardTitle>
          <CardDescription>Configure asset account mappings for loan operations from your chart of accounts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="loan_portfolio_account_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center space-x-2">
                  <span>Loan Portfolio Account *</span>
                  <Info className="h-3 w-3 text-muted-foreground" />
                </FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select from loan accounts" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <div className="px-2 py-1 text-sm font-medium text-muted-foreground">Loan & Advances Accounts</div>
                    {renderAccountOptions(loanAccounts.length > 0 ? loanAccounts : assetAccounts, true)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {isAccrualAccounting && (
            <FormField
              control={form.control}
              name="interest_receivable_account_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Interest Receivable Account</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select from receivable accounts" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <div className="px-2 py-1 text-sm font-medium text-muted-foreground">Receivable Accounts</div>
                      {renderAccountOptions(receivableAccounts.length > 0 ? receivableAccounts : assetAccounts, true)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="fund_source_account_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fund Source Account</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select from cash accounts" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <div className="px-2 py-1 text-sm font-medium text-muted-foreground">Cash & Cash Equivalents</div>
                    {renderAccountOptions(cashAccounts.length > 0 ? cashAccounts : assetAccounts, true)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {isAccrualAccounting && (
            <FormField
              control={form.control}
              name="fee_receivable_account_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fee Receivable Account</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select fee receivable account" />
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
          )}

          {isAccrualAccounting && (
            <FormField
              control={form.control}
              name="penalty_receivable_account_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Penalty Receivable Account</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select penalty receivable account" />
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
          )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>Income Accounts</span>
            <Badge variant="secondary">{incomeAccounts.length} available</Badge>
          </CardTitle>
          <CardDescription>Configure income account mappings for loan income from your chart of accounts</CardDescription>
        </CardHeader>
        <CardContent>
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
                      <SelectValue placeholder="Select from income accounts" />
                    </SelectTrigger>
                  </FormControl>
                   <SelectContent>
                     <div className="px-2 py-1 text-sm font-medium text-muted-foreground">Income Accounts</div>
                     {renderAccountOptions(incomeAccounts, true)}
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
                     <div className="px-2 py-1 text-sm font-medium text-muted-foreground">Income Accounts</div>
                     {renderAccountOptions(incomeAccounts, true)}
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
                     <div className="px-2 py-1 text-sm font-medium text-muted-foreground">Income Accounts</div>
                     {renderAccountOptions(incomeAccounts, true)}
                   </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {isAccrualAccounting && (
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
                       <div className="px-2 py-1 text-sm font-medium text-muted-foreground">Income Accounts</div>
                       {renderAccountOptions(incomeAccounts, true)}
                     </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <span>Expense & Liability Accounts</span>
            <Badge variant="secondary">{expenseAccounts.length + liabilityAccounts.length} available</Badge>
          </CardTitle>
          <CardDescription>Configure expense and liability account mappings from your chart of accounts</CardDescription>
        </CardHeader>
        <CardContent>
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
                      <SelectValue placeholder="Select from provision accounts" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <div className="px-2 py-1 text-sm font-medium text-muted-foreground">Provision Accounts</div>
                    {renderAccountOptions(provisionAccounts.length > 0 ? provisionAccounts : expenseAccounts, true)}
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
                      <SelectValue placeholder="Select from operating expenses" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <div className="px-2 py-1 text-sm font-medium text-muted-foreground">Operating Expense Accounts</div>
                    {renderAccountOptions(operatingExpenseAccounts.length > 0 ? operatingExpenseAccounts : expenseAccounts, true)}
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
                      <SelectValue placeholder="Select from liability accounts" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <div className="px-2 py-1 text-sm font-medium text-muted-foreground">Liability Accounts</div>
                    {renderAccountOptions(liabilityAccounts, true)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          </div>
        </CardContent>
      </Card>

      {chartOfAccounts.length > 0 && (
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>
            Accounts are automatically filtered from your chart of accounts and organized by category for easier selection.
            Account balances are shown for reference.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};