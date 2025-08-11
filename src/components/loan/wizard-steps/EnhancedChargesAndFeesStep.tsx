import { useState } from "react";
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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, CreditCard, Search, AlertCircle } from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";
import { calculateFeeAmount, calculateTotalFees, formatFeeDisplay, getFeeWarningMessage, type FeeStructure } from "@/lib/fee-calculation";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface EnhancedChargesAndFeesStepProps {
  form: UseFormReturn<any>;
}

interface Charge {
  id: string;
  name: string;
  type: string;
  amount: number;
  collected_on: string;
  due_date?: string;
}

export function EnhancedChargesAndFeesStep({ form }: EnhancedChargesAndFeesStepProps) {
  const { profile } = useAuth();
  const { currency } = useCurrency();
  const [selectedChargeId, setSelectedChargeId] = useState("");
  const [customAmount, setCustomAmount] = useState<number | undefined>();
  const [searchTerm, setSearchTerm] = useState("");

  // Selected product to filter charges
  const loanProductId = form.watch('loan_product_id');
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

  const { data: availableCharges = [] } = useQuery({
    queryKey: ['loan-product-fees', profile?.tenant_id, loanProduct?.linked_fee_ids],
    queryFn: async () => {
      if (!profile?.tenant_id || !loanProduct?.linked_fee_ids || loanProduct.linked_fee_ids.length === 0) return [];
      const { data, error } = await supabase
        .from('fee_structures')
        .select('*')
        .in('id', loanProduct.linked_fee_ids)
        .eq('tenant_id', profile.tenant_id)
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.tenant_id && !!loanProduct?.linked_fee_ids,
  });

  const { data: linkedSavingsAccounts = [] } = useQuery({
    queryKey: ['linked-savings-accounts', profile?.tenant_id],
    queryFn: async () => {
      const clientId = form.getValues('client_id');
      if (!clientId) return [];

      const { data, error } = await supabase
        .from('savings_accounts')
        .select(`
          *,
          savings_product:savings_products(name)
        `)
        .eq('client_id', clientId)
        .eq('is_active', true);

      if (error) throw error;
      return data;
    },
    enabled: !!form.getValues('client_id'),
  });

  const selectedCharges = form.watch('selected_charges') || [];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

    const filteredCharges = availableCharges.filter(charge =>
      charge.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      charge.fee_type.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const addCharge = () => {
    if (!selectedChargeId) return;

    const selectedCharge = availableCharges.find(c => c.id === selectedChargeId);
    if (!selectedCharge) return;

    const charge: Charge = {
      id: selectedCharge.id,
      name: selectedCharge.name,
      type: selectedCharge.fee_type,
      amount: customAmount || selectedCharge.amount,
      collected_on: selectedCharge.charge_time_type,
      due_date: selectedCharge.charge_payment_by,
    };

    const currentCharges = form.getValues('selected_charges') || [];
    
    // Check if charge already exists
    if (currentCharges.find((c: Charge) => c.id === charge.id)) {
      return;
    }

    form.setValue('selected_charges', [...currentCharges, charge]);
    setSelectedChargeId("");
    setCustomAmount(undefined);
  };

  const removeCharge = (chargeId: string) => {
    const currentCharges = form.getValues('selected_charges') || [];
    const updatedCharges = currentCharges.filter((c: Charge) => c.id !== chargeId);
    form.setValue('selected_charges', updatedCharges);
  };

  const getTotalCharges = () => {
    return selectedCharges.reduce((total: number, charge: Charge) => total + charge.amount, 0);
  };

  const selectedCharge = availableCharges.find(c => c.id === selectedChargeId);

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">Charges & Fees</h3>
        <p className="text-muted-foreground">
          Select and configure charges and fees for this loan application.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Add Charges */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Add Charges
            </CardTitle>
            <CardDescription>
              Search and select charges to apply to this loan
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search charges..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Charge Selection */}
            <div className="space-y-3">
              <FormField
                control={form.control}
                name="charge_selection"
                render={({ field }) => (
                  <FormItem>
                    {/* Removed label per requirements */}
                    <Select 
                      value={selectedChargeId} 
                      onValueChange={setSelectedChargeId}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a charge" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {filteredCharges.map((charge) => (
                          <SelectItem key={charge.id} value={charge.id}>
                            <div className="flex flex-col">
                              <span className="font-medium">{charge.name}</span>
                              <span className="text-sm text-muted-foreground">
                                {charge.fee_type} - {formatCurrency(charge.amount)}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              {/* Custom Amount Input */}
              {selectedCharge && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Custom Amount (Optional)</label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder={`Default: ${formatCurrency(selectedCharge.amount)}`}
                    value={customAmount || ""}
                    onChange={(e) => setCustomAmount(parseFloat(e.target.value) || undefined)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave empty to use default amount of {formatCurrency(selectedCharge.amount)}
                  </p>
                </div>
              )}

              <Button 
                onClick={addCharge} 
                disabled={!selectedChargeId}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Charge
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Right Column - Selected Charges */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Selected Charges
            </CardTitle>
            <CardDescription>
              Review and manage selected charges
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedCharges.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CreditCard className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No charges selected</p>
                <p className="text-sm">Add charges from the left panel</p>
              </div>
            ) : (
              <div className="space-y-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Charge</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedCharges.map((charge: Charge) => (
                      <TableRow key={charge.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{charge.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {charge.collected_on}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{charge.type}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(charge.amount)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeCharge(charge.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <div className="flex justify-between items-center pt-4 border-t">
                  <span className="font-medium">Total Charges:</span>
                  <span className="text-lg font-bold text-primary">
                    {formatCurrency(getTotalCharges())}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Linked Savings Account Section */}
      <Card>
        <CardHeader>
          <CardTitle>Linked Savings Account</CardTitle>
          <CardDescription>
            Link a savings account for fee transfers (only available for charges with "Transfer" payment option)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FormField
            control={form.control}
            name="linked_savings_account_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Savings Account</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select savings account (optional)" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {linkedSavingsAccounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.account_number} - {account.savings_product?.name} 
                        (Balance: {formatCurrency(account.account_balance || 0)})
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
}