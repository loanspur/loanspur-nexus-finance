import { useState } from "react";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { UseFormReturn } from "react-hook-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PiggyBank, CheckCircle, AlertCircle } from "lucide-react";
import { useSavingsProducts } from "@/hooks/useSupabase";
import { useCurrency } from "@/contexts/CurrencyContext";

interface SavingsAccountStepProps {
  form: UseFormReturn<any>;
  nextStep: () => void;
  prevStep: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export const SavingsAccountStep = ({ 
  form, 
  onSubmit, 
  isSubmitting 
}: SavingsAccountStepProps) => {
  const [createAccount, setCreateAccount] = useState(false);
  const { data: savingsProducts } = useSavingsProducts();
  const { currency } = useCurrency();

  const watchCreateAccount = form.watch("create_savings_account");

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PiggyBank className="h-5 w-5" />
            Savings Account Setup
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField
            control={form.control}
            name="create_savings_account"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={(checked) => {
                      field.onChange(checked);
                      setCreateAccount(!!checked);
                    }}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="text-base font-medium">
                    Create Savings Account
                  </FormLabel>
                  <p className="text-sm text-muted-foreground">
                    Create savings account during onboarding
                  </p>
                </div>
              </FormItem>
            )}
          />

          {(watchCreateAccount || createAccount) && (
            <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
              <FormField
                control={form.control}
                name="savings_product_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Savings Product</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select savings product" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {savingsProducts?.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            <div className="flex items-center justify-between w-full">
                              <span>{product.name}</span>
                              <Badge variant="outline" className="ml-2">
                                {product.nominal_annual_interest_rate}% p.a.
                              </Badge>
                            </div>
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
                name="initial_deposit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Initial Deposit ({currency})</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="1000" 
                        min="0"
                        step="0.01"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="text-sm text-muted-foreground bg-blue-50 p-3 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 mt-0.5 text-blue-600" />
                  <div>
                    <p className="font-medium text-blue-800">Account will be pending approval</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Onboarding Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Client Information</p>
              <p className="text-sm text-muted-foreground">
                {form.watch("first_name")} {form.watch("last_name")}
              </p>
              <p className="text-sm text-muted-foreground">
                #{form.watch("client_number")}
              </p>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm font-medium">Status After Submission</p>
              <div className="flex flex-col gap-1">
                <Badge variant="outline">KYC: Completed</Badge>
                <Badge variant="secondary">Approval: Pending</Badge>
                <Badge variant="secondary">Account: Inactive</Badge>
              </div>
            </div>
          </div>

          <div className="text-sm text-muted-foreground bg-amber-50 p-3 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 mt-0.5 text-amber-600" />
              <div>
                <p className="font-medium text-amber-800">Client will be created pending approval</p>
              </div>
            </div>
          </div>

          <Button 
            onClick={onSubmit}
            disabled={isSubmitting}
            className="w-full bg-success hover:bg-success/90"
            size="lg"
          >
            {isSubmitting ? "Processing..." : "Complete Client Onboarding"}
            <CheckCircle className="h-5 w-5 ml-2" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};