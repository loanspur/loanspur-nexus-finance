import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { UseFormReturn } from "react-hook-form";
import { LoanProductFormData } from "./LoanProductSchema";
import { useFeeStructures } from "@/hooks/useFeeManagement";

interface LoanProductInterestRepaymentTabProps {
  form: UseFormReturn<LoanProductFormData>;
}

export const LoanProductInterestRepaymentTab = ({ form }: LoanProductInterestRepaymentTabProps) => {
  const { data: feeStructures } = useFeeStructures();
  const activeLoanCharges = feeStructures?.filter(fee => fee.fee_type === 'loan' && fee.is_active) || [];

  return (
    <div className="space-y-4">
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

      <FormField
        control={form.control}
        name="grace_period"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Grace Period (Days)</FormLabel>
            <div className="text-sm text-muted-foreground mb-2">
              Minimum days between disbursement and first repayment
            </div>
            <FormControl>
              <Input type="number" placeholder="0" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-3 gap-4">
        <FormField
          control={form.control}
          name="moratorium_period"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Moratorium Period (Days)</FormLabel>
              <FormControl>
                <Input type="number" placeholder="0" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="moratorium_principal"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Moratorium on Principal</FormLabel>
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

        <FormField
          control={form.control}
          name="moratorium_interest"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Moratorium on Interest</FormLabel>
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

      <FormField
        control={form.control}
        name="other_loan_charges"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Other Loan Charges</FormLabel>
            <div className="text-sm text-muted-foreground mb-2">
              Select additional charges applied to the loan (other than overdue charges)
            </div>
            <FormControl>
              <div className="space-y-3">
                {activeLoanCharges.length === 0 ? (
                  <div className="text-sm text-muted-foreground p-4 border rounded-md">
                    No active loan charges available. Please create loan charges in Fee Management first.
                  </div>
                ) : (
                  activeLoanCharges.map((charge) => {
                    const currentCharges = field.value ? field.value.split(',').map(id => id.trim()) : [];
                    const isChecked = currentCharges.includes(charge.id);
                    
                    return (
                      <div key={charge.id} className="flex items-center space-x-3 p-3 border rounded-md">
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={(checked) => {
                            let updatedCharges: string[];
                            if (checked) {
                              updatedCharges = [...currentCharges, charge.id];
                            } else {
                              updatedCharges = currentCharges.filter(id => id !== charge.id);
                            }
                            field.onChange(updatedCharges.join(','));
                          }}
                        />
                        <div className="flex-1">
                          <div className="font-medium">{charge.fee_name}</div>
                          <div className="text-sm text-muted-foreground">
                            {charge.description} - {charge.calculation_method === 'fixed' 
                              ? `Fixed: ${charge.fixed_amount}` 
                              : `${charge.percentage_rate}%`}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

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
    </div>
  );
};