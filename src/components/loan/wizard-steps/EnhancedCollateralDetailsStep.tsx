import { UseFormReturn } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, DollarSign, FileText } from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";

interface EnhancedCollateralDetailsStepProps {
  form: UseFormReturn<any>;
}

export function EnhancedCollateralDetailsStep({ form }: EnhancedCollateralDetailsStepProps) {
  const { profile } = useAuth();
  const { currency } = useCurrency();

  const { data: collateralTypes = [] } = useQuery({
    queryKey: ['collateral-types', profile?.tenant_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('collateral_types')
        .select('*')
        .eq('tenant_id', profile?.tenant_id)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data;
    },
    enabled: !!profile?.tenant_id,
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const collateralValue = form.watch('collateral_value') || 0;
  const loanAmount = form.watch('requested_amount') || 0;
  const collateralRatio = loanAmount > 0 ? (collateralValue / loanAmount) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">Collateral Details</h3>
        <p className="text-muted-foreground">
          Provide information about any collateral securing this loan.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Collateral Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Collateral Information
            </CardTitle>
            <CardDescription>
              Enter details about the collateral being offered
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="collateral_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Collateral Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select collateral type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {collateralTypes.map((type) => (
                        <SelectItem key={type.id} value={type.name}>
                          <div className="flex flex-col">
                            <span className="font-medium">{type.name}</span>
                            {type.description && (
                              <span className="text-sm text-muted-foreground">
                                {type.description}
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                      <SelectItem value="other">Other (Specify in description)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="collateral_value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Collateral Value ({currency})
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="collateral_description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Collateral Description
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Provide detailed description of the collateral including location, condition, ownership details, etc."
                      className="min-h-[120px] resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Right Column - Collateral Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Collateral Analysis
            </CardTitle>
            <CardDescription>
              Review the collateral coverage ratio and risk assessment
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Loan Amount:</span>
                <span className="font-semibold">{formatCurrency(loanAmount)}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Collateral Value:</span>
                <span className="font-semibold">{formatCurrency(collateralValue)}</span>
              </div>
              
              <div className="border-t pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Coverage Ratio:</span>
                  <span className={`font-semibold text-lg ${
                    collateralRatio >= 100 ? 'text-green-600' : 
                    collateralRatio >= 80 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {collateralRatio.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Risk Assessment */}
            <div className="mt-6 p-4 rounded-lg border">
              <h4 className="font-medium mb-2">Risk Assessment</h4>
              <div className="space-y-2 text-sm">
                {collateralRatio >= 150 && (
                  <div className="flex items-center gap-2 text-green-600">
                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                    <span>Excellent collateral coverage (≥150%)</span>
                  </div>
                )}
                {collateralRatio >= 100 && collateralRatio < 150 && (
                  <div className="flex items-center gap-2 text-green-600">
                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                    <span>Good collateral coverage (100-149%)</span>
                  </div>
                )}
                {collateralRatio >= 80 && collateralRatio < 100 && (
                  <div className="flex items-center gap-2 text-yellow-600">
                    <div className="w-2 h-2 bg-yellow-600 rounded-full"></div>
                    <span>Moderate risk - Below 100% coverage</span>
                  </div>
                )}
                {collateralRatio > 0 && collateralRatio < 80 && (
                  <div className="flex items-center gap-2 text-red-600">
                    <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                    <span>High risk - Insufficient collateral</span>
                  </div>
                )}
                {collateralRatio === 0 && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
                    <span>No collateral provided - Unsecured loan</span>
                  </div>
                )}
              </div>
            </div>

            {/* Recommendations */}
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">Recommendations</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Ensure all collateral documentation is complete</li>
                <li>• Consider professional valuation for high-value items</li>
                <li>• Verify ownership and legal status of collateral</li>
                <li>• Review insurance requirements for the collateral</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}