import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { LoanProductFormData } from "./LoanProductSchema";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface LoanProductFeesTabProps {
  form: UseFormReturn<LoanProductFormData>;
}

export const LoanProductFeesTab = ({ form }: LoanProductFeesTabProps) => {
  return (
    <div className="space-y-6">
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