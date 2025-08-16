import { useState, useEffect } from "react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { UseFormReturn } from "react-hook-form";
import { LoanProductFormData } from "./LoanProductSchema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useChartOfAccounts } from "@/hooks/useChartOfAccounts";
import { useFeeStructures } from "@/hooks/useFeeManagement";
import { usePaymentTypes } from "@/hooks/usePaymentTypes";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { X } from "lucide-react";

interface LoanProductAdvancedTabProps {
  form: UseFormReturn<LoanProductFormData>;
  tenantId: string;
  productId?: string;
  productType?: 'loan' | 'savings';
  onRegisterSave?: (fn: (productId: string) => Promise<void>) => void;
}

interface PaymentChannelMapping {
  id: string;
  paymentType: string;
  assetAccount: string;
}

interface FeeMapping {
  id: string;
  feeType: string;
  incomeAccount: string;
}

export const LoanProductAdvancedTab = ({ form, tenantId, productId, productType = 'loan', onRegisterSave }: LoanProductAdvancedTabProps) => {
  const { data: chartOfAccounts = [] } = useChartOfAccounts();
  const { data: feeStructures = [] } = useFeeStructures();
  const { data: paymentTypes = [], isLoading: paymentTypesLoading } = usePaymentTypes();
  const { profile } = useAuth();
  const { toast } = useToast();
  const [existingMappings, setExistingMappings] = useState<Array<{ channel_id: string; account_id: string }>>([]);

  const [paymentChannelMappings, setPaymentChannelMappings] = useState<PaymentChannelMapping[]>([]);
  const [feeMappings, setFeeMappings] = useState<FeeMapping[]>([]);

  // Load existing mappings for this product
  useEffect(() => {
    const load = async () => {
      if (!profile?.tenant_id || !productId) return;
      const { data, error } = await supabase
        .from('product_fund_source_mappings')
        .select('channel_id, account_id')
        .eq('tenant_id', profile.tenant_id)
        .eq('product_id', productId)
        .eq('product_type', productType);
      if (error) {
        console.error('Failed to load product fund source mappings', error);
        return;
      }
      const rows = (data || []) as Array<{ channel_id: string; account_id: string }>;
      setExistingMappings(rows);
      setPaymentChannelMappings(rows.map(r => ({ id: r.channel_id, paymentType: r.channel_id, assetAccount: r.account_id })));

      // Load fee mappings for loan products
      if (productType === 'loan') {
        const { data: lp, error: lpErr } = await supabase
          .from('loan_products')
          .select('fee_mappings')
          .eq('id', productId)
          .maybeSingle();
        if (!lpErr && lp?.fee_mappings) {
          const fm = (lp.fee_mappings as any[]) || [];
          setFeeMappings(
            fm.map((m: any) => ({ id: m.fee_id || m.feeType, feeType: m.fee_id || m.feeType, incomeAccount: m.income_account_id || m.incomeAccount }))
          );
        }
      }
    };
    load();
  }, [profile?.tenant_id, productId, productType]);

  // Register save handler so parent can call it on submit
  useEffect(() => {
    if (!onRegisterSave || !profile?.tenant_id) return;
    onRegisterSave(async (pid: string) => {
      // 1) Save payment channel -> asset account mappings
      const configured = paymentChannelMappings.filter(m => m.paymentType && m.assetAccount);
      const upsertPayload = configured.map(m => ({
        tenant_id: profile.tenant_id!,
        product_id: pid,
        product_type: productType,
        channel_id: m.paymentType,
        channel_name: (paymentTypes.find(pt => pt.id === m.paymentType)?.name) || m.paymentType,
        account_id: m.assetAccount,
      }));

      const { error: upsertError } = await supabase
        .from('product_fund_source_mappings')
        .upsert(upsertPayload, { onConflict: 'tenant_id,product_id,product_type,channel_id' });
      if (upsertError) throw upsertError;

      const selectedIds = new Set(configured.map(c => c.paymentType));
      const toDelete = (existingMappings || [])
        .filter(m => !selectedIds.has(m.channel_id))
        .map(m => m.channel_id);
      if (toDelete.length > 0) {
        const { error: delError } = await supabase
          .from('product_fund_source_mappings')
          .delete()
          .eq('tenant_id', profile.tenant_id!)
          .eq('product_id', pid)
          .eq('product_type', productType)
          .in('channel_id', toDelete);
        if (delError) throw delError;
      }

      // 2) Save fee -> income account mappings for loan products
      if (productType === 'loan') {
        const configuredFees = feeMappings.filter(m => m.feeType && m.incomeAccount);
        const feePayload = configuredFees.map(m => ({
          fee_id: m.feeType,
          fee_type: feeStructures.find(f => f.id === m.feeType)?.fee_type || 'loan',
          income_account_id: m.incomeAccount,
        }));
        const { error: lpErr } = await supabase
          .from('loan_products' as any)
          .update({ fee_mappings: feePayload } as any)
          .eq('id', pid);
        if (lpErr) throw lpErr;
      }

      toast({ title: 'Advanced mappings saved', description: `${configured.length} payment channel(s) and ${feeMappings.length} fee mapping(s) saved.` });
    });
  }, [onRegisterSave, profile?.tenant_id, paymentChannelMappings, existingMappings, productType, paymentTypes, feeMappings, feeStructures, toast]);

  const assetAccounts = chartOfAccounts.filter(account => account.account_type === 'asset');
  const incomeAccounts = chartOfAccounts.filter(account => account.account_type === 'income');

  const addPaymentChannelMapping = () => {
    const newMapping: PaymentChannelMapping = {
      id: Date.now().toString(),
      paymentType: "",
      assetAccount: ""
    };
    setPaymentChannelMappings([...paymentChannelMappings, newMapping]);
  };

  const removePaymentChannelMapping = (id: string) => {
    setPaymentChannelMappings(paymentChannelMappings.filter(mapping => mapping.id !== id));
  };

  const updatePaymentChannelMapping = (id: string, field: keyof PaymentChannelMapping, value: string) => {
    setPaymentChannelMappings(paymentChannelMappings.map(mapping => 
      mapping.id === id ? { ...mapping, [field]: value } : mapping
    ));
  };

  const addFeeMapping = () => {
    const newMapping: FeeMapping = {
      id: Date.now().toString(),
      feeType: "",
      incomeAccount: ""
    };
    setFeeMappings([...feeMappings, newMapping]);
  };

  const removeFeeMapping = (id: string) => {
    setFeeMappings(feeMappings.filter(mapping => mapping.id !== id));
  };

  const updateFeeMapping = (id: string, field: keyof FeeMapping, value: string) => {
    setFeeMappings(feeMappings.map(mapping => 
      mapping.id === id ? { ...mapping, [field]: value } : mapping
    ));
  };

  return (
    <div className="space-y-6">
      {/* Repayment Strategy */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Repayment Strategy</CardTitle>
          <CardDescription className="text-muted-foreground">Order used to allocate repayments</CardDescription>
        </CardHeader>
        <CardContent>
          <FormField
            control={form.control}
            name="repayment_strategy"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Repayment allocation order</FormLabel>
                <FormControl>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select strategy" />
                    </SelectTrigger>
                    <SelectContent className="z-[60] bg-background">
                      <SelectItem value="penalties_fees_interest_principal">Penalties → Fees → Interest → Principal (default)</SelectItem>
                      <SelectItem value="interest_principal_penalties_fees">Interest → Principal → Penalties → Fees</SelectItem>
                      <SelectItem value="interest_penalties_fees_principal">Interest → Penalties → Fees → Principal</SelectItem>
                      <SelectItem value="principal_interest_fees_penalties">Principal → Interest → Fees → Penalties</SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      {/* Advanced Accounting Rule Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Advanced Accounting Rule <span className="text-blue-600 text-sm cursor-pointer">[hide]</span></CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          
          {/* Configure Asset Accounts for Payment Channels */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-medium text-muted-foreground">Configure Asset Accounts for Payment Channels</h3>
              <Button onClick={addPaymentChannelMapping} size="sm" className="bg-blue-500 hover:bg-blue-600">
                Add
              </Button>
            </div>
            
            <div className="space-y-3">
              {/* Header Row */}
              <div className="grid grid-cols-12 gap-4 text-sm font-medium text-muted-foreground pb-2 border-b">
                <div className="col-span-5">Payment Type</div>
                <div className="col-span-5">Asset Account</div>
                <div className="col-span-2">Actions</div>
              </div>
              
              {/* Data Rows */}
              {paymentChannelMappings.map((mapping) => (
                <div key={mapping.id} className="grid grid-cols-12 gap-4 items-center">
                  <div className="col-span-5">
                    <Select
                      value={mapping.paymentType}
                      onValueChange={(value) => updatePaymentChannelMapping(mapping.id, 'paymentType', value)}
                      disabled={paymentTypesLoading}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={paymentTypesLoading ? "Loading..." : "Select payment type"} />
                      </SelectTrigger>
                      <SelectContent>
                        {paymentTypes.map((type) => (
                          <SelectItem key={type.id} value={type.id}>
                            {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-5">
                    <Select
                      value={mapping.assetAccount}
                      onValueChange={(value) => updatePaymentChannelMapping(mapping.id, 'assetAccount', value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select asset account" />
                      </SelectTrigger>
                      <SelectContent>
                        {assetAccounts.map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            {account.account_code} - {account.account_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removePaymentChannelMapping(mapping.id)}
                      className="text-blue-500 hover:text-blue-600 p-1"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Map Fees to Income Accounts */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-medium text-muted-foreground">Map Fees to Income Accounts</h3>
              <Button onClick={addFeeMapping} size="sm" className="bg-blue-500 hover:bg-blue-600">
                Add
              </Button>
            </div>
            
            <div className="space-y-3">
              {/* Header Row */}
              <div className="grid grid-cols-12 gap-4 text-sm font-medium text-muted-foreground pb-2 border-b">
                <div className="col-span-5">Fees</div>
                <div className="col-span-5">Income Account</div>
                <div className="col-span-2">Actions</div>
              </div>
              
              {/* Data Rows */}
              {feeMappings.map((mapping) => (
                <div key={mapping.id} className="grid grid-cols-12 gap-4 items-center">
                  <div className="col-span-5">
                    <Select
                      value={mapping.feeType}
                      onValueChange={(value) => updateFeeMapping(mapping.id, 'feeType', value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select fee type" />
                      </SelectTrigger>
                      <SelectContent>
                        {feeStructures.map((fee) => (
                          <SelectItem key={fee.id} value={fee.id}>
                            {fee.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-5">
                    <Select
                      value={mapping.incomeAccount}
                      onValueChange={(value) => updateFeeMapping(mapping.id, 'incomeAccount', value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select income account" />
                      </SelectTrigger>
                      <SelectContent>
                        {incomeAccounts.map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            {account.account_code} - {account.account_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFeeMapping(mapping.id)}
                      className="text-blue-500 hover:text-blue-600 p-1"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};