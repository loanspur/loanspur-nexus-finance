import { UseFormReturn } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { FileText, DollarSign, Percent, Calculator } from "lucide-react";

interface ChargesAndFeesStepProps {
  form: UseFormReturn<any>;
}

interface LoanCharge {
  id: string;
  name: string;
  description?: string;
  fee_type: string;
  calculation_type: string;
  amount: number;
  percentage_rate?: number;
  min_amount?: number;
  max_amount?: number;
  charge_time_type: string;
  charge_payment_by: string;
  is_active: boolean;
  is_overdue_charge: boolean;
  selected: boolean;
  custom_amount?: number;
}

export function ChargesAndFeesStep({ form }: ChargesAndFeesStepProps) {
  const { profile } = useAuth();
  const [selectedCharges, setSelectedCharges] = useState<LoanCharge[]>([]);
  const loanProductId = form.watch('loan_product_id');

  // Fetch loan product to get linked fee IDs
  const { data: loanProduct } = useQuery({
    queryKey: ['loan-product', loanProductId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('loan_products')
        .select('*')
        .eq('id', loanProductId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!loanProductId,
  });

  // Fetch fee structures linked to the loan product
  const { data: availableFees = [], isLoading } = useQuery({
    queryKey: ['loan-product-fees', loanProductId, loanProduct?.linked_fee_ids],
    queryFn: async () => {
      if (!loanProduct?.linked_fee_ids || loanProduct.linked_fee_ids.length === 0) {
        return [];
      }

      const { data, error } = await supabase
        .from('fee_structures')
        .select('*')
        .in('id', loanProduct.linked_fee_ids)
        .eq('tenant_id', profile?.tenant_id)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data;
    },
    enabled: !!loanProduct?.linked_fee_ids && !!profile?.tenant_id,
  });

  // Initialize charges when available fees change
  useEffect(() => {
    if (availableFees.length > 0) {
      const charges: LoanCharge[] = availableFees.map(fee => ({
        ...fee,
        selected: false,
        custom_amount: fee.amount,
      }));
      setSelectedCharges(charges);
    }
  }, [availableFees]);

  // Update form when charges change
  useEffect(() => {
    const activeCharges = selectedCharges.filter(charge => charge.selected);
    form.setValue('charges', activeCharges);
  }, [selectedCharges, form]);

  const handleChargeToggle = (chargeId: string, selected: boolean) => {
    setSelectedCharges(prev => 
      prev.map(charge => 
        charge.id === chargeId ? { ...charge, selected } : charge
      )
    );
  };

  const handleAmountChange = (chargeId: string, amount: string) => {
    const numAmount = parseFloat(amount) || 0;
    setSelectedCharges(prev => 
      prev.map(charge => 
        charge.id === chargeId ? { ...charge, custom_amount: numAmount } : charge
      )
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getChargeTypeIcon = (type: string) => {
    switch (type) {
      case 'processing':
        return <Calculator className="w-4 h-4" />;
      case 'disbursement':
        return <DollarSign className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getCalculationTypeDisplay = (type: string) => {
    switch (type) {
      case 'flat':
        return 'Flat Amount';
      case 'percentage':
        return 'Percentage';
      default:
        return type;
    }
  };

  const getChargeTimeDisplay = (type: string) => {
    switch (type) {
      case 'disbursement':
        return 'At Disbursement';
      case 'specified_due_date':
        return 'Specified Due Date';
      case 'installment_fee':
        return 'Installment Fee';
      default:
        return type;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold">Charges & Fees</h3>
          <p className="text-muted-foreground">Loading charges and fees for this loan product...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">Charges & Fees</h3>
        <p className="text-muted-foreground">Configure applicable charges and fees for this loan.</p>
      </div>
      
      {availableFees.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              No Charges Available
            </CardTitle>
            <CardDescription>
              No charges are configured for this loan product.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="space-y-4">
          {selectedCharges.map((charge) => (
            <Card key={charge.id} className={`transition-all ${charge.selected ? 'ring-2 ring-primary' : ''}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={charge.selected}
                      onCheckedChange={(checked) => handleChargeToggle(charge.id, checked as boolean)}
                    />
                    <div className="flex items-center gap-2">
                      {getChargeTypeIcon(charge.fee_type)}
                      <CardTitle className="text-base">{charge.name}</CardTitle>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline">{getCalculationTypeDisplay(charge.calculation_type)}</Badge>
                    <Badge variant="secondary">{getChargeTimeDisplay(charge.charge_time_type)}</Badge>
                  </div>
                </div>
                {charge.description && (
                  <CardDescription>{charge.description}</CardDescription>
                )}
              </CardHeader>
              
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`charge-${charge.id}-amount`}>
                      {charge.calculation_type === 'percentage' ? 'Percentage Rate' : 'Amount'}
                    </Label>
                    <div className="relative">
                      {charge.calculation_type === 'percentage' ? (
                        <div className="flex items-center gap-2">
                          <Input
                            id={`charge-${charge.id}-amount`}
                            type="number"
                            step="0.01"
                            min="0"
                            max={charge.max_amount || 100}
                            value={charge.custom_amount || charge.percentage_rate || 0}
                            onChange={(e) => handleAmountChange(charge.id, e.target.value)}
                            disabled={!charge.selected}
                            className="pr-8"
                          />
                          <Percent className="w-4 h-4 text-muted-foreground" />
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-muted-foreground" />
                          <Input
                            id={`charge-${charge.id}-amount`}
                            type="number"
                            step="0.01"
                            min={charge.min_amount || 0}
                            max={charge.max_amount}
                            value={charge.custom_amount || charge.amount}
                            onChange={(e) => handleAmountChange(charge.id, e.target.value)}
                            disabled={!charge.selected}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Payment Method</Label>
                    <div className="text-sm text-muted-foreground">
                      {charge.charge_payment_by}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Charge Amount</Label>
                    <div className="text-sm font-medium">
                      {charge.calculation_type === 'percentage' 
                        ? `${charge.custom_amount || charge.percentage_rate || 0}%`
                        : formatCurrency(charge.custom_amount || charge.amount)
                      }
                    </div>
                  </div>
                </div>
                
                {(charge.min_amount || charge.max_amount) && (
                  <div className="mt-3 text-xs text-muted-foreground">
                    {charge.min_amount && `Min: ${formatCurrency(charge.min_amount)}`}
                    {charge.min_amount && charge.max_amount && ' • '}
                    {charge.max_amount && `Max: ${formatCurrency(charge.max_amount)}`}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {selectedCharges.some(charge => charge.selected) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Selected Charges Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {selectedCharges
                .filter(charge => charge.selected)
                .map(charge => (
                  <div key={charge.id} className="flex justify-between items-center">
                    <span className="text-sm">{charge.name}</span>
                    <span className="text-sm font-medium">
                      {charge.calculation_type === 'percentage' 
                        ? `${charge.custom_amount || charge.percentage_rate || 0}%`
                        : formatCurrency(charge.custom_amount || charge.amount)
                      }
                    </span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}