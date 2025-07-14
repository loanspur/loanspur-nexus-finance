import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { LoanProductFormData } from "./LoanProductSchema";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useFeeStructures } from "@/hooks/useFeeManagement";

interface LoanProductFeesTabProps {
  form: UseFormReturn<LoanProductFormData>;
  tenantId: string;
}

export const LoanProductFeesTab = ({ form, tenantId }: LoanProductFeesTabProps) => {
  const { data: feeStructures = [] } = useFeeStructures();
  const activeFeeStructures = feeStructures.filter(fee => fee.is_active);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Fee Structure Mappings</CardTitle>
          <CardDescription>
            Link active fee structures to this loan product
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FormField
            control={form.control}
            name="linked_fee_ids"
            render={() => (
              <FormItem>
                <div className="grid grid-cols-1 gap-4 max-h-60 overflow-y-auto">
                  {activeFeeStructures.map((fee) => (
                    <FormField
                      key={fee.id}
                      control={form.control}
                      name="linked_fee_ids"
                      render={({ field }) => {
                        return (
                          <FormItem
                            key={fee.id}
                            className="flex flex-row items-start space-x-3 space-y-0 p-3 border rounded-lg"
                          >
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(fee.id)}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([...field.value, fee.id])
                                    : field.onChange(
                                        field.value?.filter(
                                          (value) => value !== fee.id
                                        )
                                      )
                                }}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel className="font-medium">
                                {fee.name}
                              </FormLabel>
                              <p className="text-sm text-muted-foreground">
                                {fee.description || `${fee.fee_type} - ${fee.calculation_type}`}
                              </p>
                              <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                                <span>Amount: {fee.amount}</span>
                                {fee.percentage_rate && <span>Rate: {fee.percentage_rate}%</span>}
                                <span>Charge Time: {fee.charge_time_type}</span>
                              </div>
                            </div>
                          </FormItem>
                        )
                      }}
                    />
                  ))}
                </div>
                {activeFeeStructures.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No active fee structures available. Create fee structures first to link them to this product.
                  </p>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Processing Fees</CardTitle>
          <CardDescription>
            Configure fees charged during loan origination and processing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="processing_fee_amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Processing Fee Amount</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="0.00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="processing_fee_percentage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Processing Fee Percentage (%)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="0.00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            If both amount and percentage are specified, the higher value will be applied.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Late Payment Penalties</CardTitle>
          <CardDescription>
            Configure penalties for late or missed payments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="late_payment_penalty_amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Late Payment Penalty Amount</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="0.00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="late_payment_penalty_percentage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Late Payment Penalty Percentage (%)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="0.00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Penalty applied when payments are made after the due date.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Early Repayment Penalties</CardTitle>
          <CardDescription>
            Configure penalties for early loan repayment or prepayment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="early_repayment_penalty_amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Early Repayment Penalty Amount</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="0.00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="early_repayment_penalty_percentage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Early Repayment Penalty Percentage (%)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="0.00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Penalty applied when loans are paid off before the scheduled maturity date.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};