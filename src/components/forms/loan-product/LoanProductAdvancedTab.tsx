import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { UseFormReturn } from "react-hook-form";
import { LoanProductFormData } from "./LoanProductSchema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useChartOfAccounts } from "@/hooks/useChartOfAccounts";
import { Separator } from "@/components/ui/separator";

interface LoanProductAdvancedTabProps {
  form: UseFormReturn<LoanProductFormData>;
  tenantId: string;
}

export const LoanProductAdvancedTab = ({ form, tenantId }: LoanProductAdvancedTabProps) => {
  const { data: chartOfAccounts = [] } = useChartOfAccounts();

  const getAccountsByType = (type: string) => 
    chartOfAccounts.filter(account => account.account_type === type);

  const assetAccounts = getAccountsByType('asset');
  const incomeAccounts = getAccountsByType('income');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Payment Account Mappings</CardTitle>
          <CardDescription>
            Configure advanced payment account mappings for different payment types
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="principal_payment_account_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Principal Payment Account</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select principal payment account" />
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
              name="interest_payment_account_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Interest Payment Account</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select interest payment account" />
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
              name="fee_payment_account_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fee Payment Account</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select fee payment account" />
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
              name="penalty_payment_account_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Penalty Payment Account</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select penalty payment account" />
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
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Prepayment Settings</CardTitle>
          <CardDescription>
            Configure how prepayments and early closures are handled
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="pre_closure_interest_calculation_rule"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pre-closure Interest Calculation</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select calculation rule" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="till_pre_close_date">Till Pre-close Date</SelectItem>
                      <SelectItem value="till_rest_frequency_date">Till Rest Frequency Date</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="advance_payments_adjustment_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Advance Payments Adjustment</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select adjustment type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="reduce_emi">Reduce EMI</SelectItem>
                      <SelectItem value="reduce_number_of_installments">Reduce Number of Installments</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Configure how advance payments affect the loan schedule and calculations.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Reschedule Settings</CardTitle>
          <CardDescription>
            Configure loan rescheduling and restructuring options
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FormField
            control={form.control}
            name="reschedule_strategy"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Reschedule Strategy</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select reschedule strategy" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="reduce_emi">Reduce EMI</SelectItem>
                    <SelectItem value="reduce_number_of_installments">Reduce Number of Installments</SelectItem>
                    <SelectItem value="reschedule_next_repayments">Reschedule Next Repayments</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <p className="text-sm text-muted-foreground mt-2">
            Determines how loan rescheduling affects the repayment schedule.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Additional Information</CardTitle>
          <CardDescription>
            Important notes about advanced loan product configuration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-lg bg-muted p-4">
            <h4 className="font-medium text-sm mb-2">Interest Calculation Methods:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li><strong>Declining Balance:</strong> Interest calculated on outstanding principal</li>
              <li><strong>Flat:</strong> Interest calculated on original principal amount</li>
              <li><strong>Compound:</strong> Interest calculated with compounding</li>
            </ul>
          </div>
          
          <div className="rounded-lg bg-muted p-4">
            <h4 className="font-medium text-sm mb-2">Grace Period Types:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li><strong>None:</strong> No grace period</li>
              <li><strong>Principal:</strong> Grace period applies to principal only</li>
              <li><strong>Interest:</strong> Grace period applies to interest only</li>
              <li><strong>Both:</strong> Grace period applies to both principal and interest</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};