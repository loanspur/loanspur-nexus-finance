import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { UseFormReturn } from "react-hook-form";
import { LoanProductFormData } from "./LoanProductSchema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useFeeStructures } from "@/hooks/useFeeManagement";
import { useChartOfAccounts } from "@/hooks/useChartOfAccounts";
import { X, Plus } from "lucide-react";
import { useState } from "react";

interface LoanProductFeesTabProps {
  form: UseFormReturn<LoanProductFormData>;
  tenantId: string;
}

interface FeeMapping {
  id: string;
  feeId: string;
  incomeAccountId: string;
  amount: string;
  percentage: string;
}

interface PaymentChannelMapping {
  id: string;
  paymentType: string;
  fundSourceAccountId: string;
}

interface PenaltyMapping {
  id: string;
  penaltyType: string;
  incomeAccountId: string;
}

export const LoanProductFeesTab = ({ form, tenantId }: LoanProductFeesTabProps) => {
  const { data: feeStructures = [] } = useFeeStructures();
  const { data: chartOfAccounts = [] } = useChartOfAccounts();
  const activeFeeStructures = feeStructures.filter(fee => fee.is_active);
  const incomeAccounts = chartOfAccounts.filter(account => account.account_type === 'income');
  const assetAccounts = chartOfAccounts.filter(account => account.account_type === 'asset');

  const [feeMappings, setFeeMappings] = useState<FeeMapping[]>([]);
  const [paymentChannels, setPaymentChannels] = useState<PaymentChannelMapping[]>([]);
  const [penaltyMappings, setPenaltyMappings] = useState<PenaltyMapping[]>([]);

  const addFeeMapping = () => {
    setFeeMappings([...feeMappings, {
      id: Math.random().toString(),
      feeId: '',
      incomeAccountId: '',
      amount: '0',
      percentage: '0'
    }]);
  };

  const removeFeeMapping = (id: string) => {
    setFeeMappings(feeMappings.filter(mapping => mapping.id !== id));
  };

  const addPaymentChannel = () => {
    setPaymentChannels([...paymentChannels, {
      id: Math.random().toString(),
      paymentType: '',
      fundSourceAccountId: ''
    }]);
  };

  const removePaymentChannel = (id: string) => {
    setPaymentChannels(paymentChannels.filter(mapping => mapping.id !== id));
  };

  const addPenaltyMapping = () => {
    setPenaltyMappings([...penaltyMappings, {
      id: Math.random().toString(),
      penaltyType: '',
      incomeAccountId: ''
    }]);
  };

  const removePenaltyMapping = (id: string) => {
    setPenaltyMappings(penaltyMappings.filter(mapping => mapping.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Configure Fund Sources for Payment Channels */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Configure Fund Sources for Payment Channels</CardTitle>
            <CardDescription>
              Map payment types to their corresponding fund source accounts
            </CardDescription>
          </div>
          <Button onClick={addPaymentChannel} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-12 gap-4 text-sm font-medium text-muted-foreground">
              <div className="col-span-5">Payment Type</div>
              <div className="col-span-6">Fund Source</div>
              <div className="col-span-1">Actions</div>
            </div>
            {paymentChannels.map((channel) => (
              <div key={channel.id} className="grid grid-cols-12 gap-4">
                <div className="col-span-5">
                  <Select 
                    value={channel.paymentType} 
                    onValueChange={(value) => {
                      setPaymentChannels(prev => prev.map(c => 
                        c.id === channel.id ? { ...c, paymentType: value } : c
                      ));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mpesa">M-PESA</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="check">Check</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-6">
                  <Select 
                    value={channel.fundSourceAccountId} 
                    onValueChange={(value) => {
                      setPaymentChannels(prev => prev.map(c => 
                        c.id === channel.id ? { ...c, fundSourceAccountId: value } : c
                      ));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select fund source account" />
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
                <div className="col-span-1">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => removePaymentChannel(channel.id)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Map Fees to Income Accounts */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Map Fees to Income Accounts</CardTitle>
            <CardDescription>
              Configure fee structures with customizable amounts and income account mappings
            </CardDescription>
          </div>
          <Button onClick={addFeeMapping} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-12 gap-4 text-sm font-medium text-muted-foreground">
              <div className="col-span-3">Fee Type</div>
              <div className="col-span-2">Amount</div>
              <div className="col-span-2">Percentage</div>
              <div className="col-span-4">Income Account</div>
              <div className="col-span-1">Actions</div>
            </div>
            {feeMappings.map((mapping) => (
              <div key={mapping.id} className="grid grid-cols-12 gap-4">
                <div className="col-span-3">
                  <Select 
                    value={mapping.feeId} 
                    onValueChange={(value) => {
                      const selectedFee = activeFeeStructures.find(f => f.id === value);
                      setFeeMappings(prev => prev.map(m => 
                        m.id === mapping.id ? { 
                          ...m, 
                          feeId: value,
                          amount: selectedFee?.amount.toString() || '0',
                          percentage: selectedFee?.percentage_rate?.toString() || '0'
                        } : m
                      ));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select fee" />
                    </SelectTrigger>
                    <SelectContent>
                      {activeFeeStructures.map((fee) => (
                        <SelectItem key={fee.id} value={fee.id}>
                          {fee.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Input 
                    type="number" 
                    step="0.01" 
                    value={mapping.amount}
                    onChange={(e) => {
                      setFeeMappings(prev => prev.map(m => 
                        m.id === mapping.id ? { ...m, amount: e.target.value } : m
                      ));
                    }}
                  />
                </div>
                <div className="col-span-2">
                  <Input 
                    type="number" 
                    step="0.01" 
                    value={mapping.percentage}
                    onChange={(e) => {
                      setFeeMappings(prev => prev.map(m => 
                        m.id === mapping.id ? { ...m, percentage: e.target.value } : m
                      ));
                    }}
                  />
                </div>
                <div className="col-span-4">
                  <Select 
                    value={mapping.incomeAccountId} 
                    onValueChange={(value) => {
                      setFeeMappings(prev => prev.map(m => 
                        m.id === mapping.id ? { ...m, incomeAccountId: value } : m
                      ));
                    }}
                  >
                    <SelectTrigger>
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
                <div className="col-span-1">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => removeFeeMapping(mapping.id)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Map Penalties to Specific Income Accounts */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Map Penalties to Specific Income Accounts</CardTitle>
            <CardDescription>
              Configure penalty types and their corresponding income accounts
            </CardDescription>
          </div>
          <Button onClick={addPenaltyMapping} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-12 gap-4 text-sm font-medium text-muted-foreground">
              <div className="col-span-5">Penalty Type</div>
              <div className="col-span-6">Income Account</div>
              <div className="col-span-1">Actions</div>
            </div>
            {penaltyMappings.map((penalty) => (
              <div key={penalty.id} className="grid grid-cols-12 gap-4">
                <div className="col-span-5">
                  <Select 
                    value={penalty.penaltyType} 
                    onValueChange={(value) => {
                      setPenaltyMappings(prev => prev.map(p => 
                        p.id === penalty.id ? { ...p, penaltyType: value } : p
                      ));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select penalty type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="late_payment">Late Payment Penalty</SelectItem>
                      <SelectItem value="early_repayment">Early Repayment Penalty</SelectItem>
                      <SelectItem value="default_charges">Default Charges</SelectItem>
                      <SelectItem value="overdue_interest">Overdue Interest</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-6">
                  <Select 
                    value={penalty.incomeAccountId} 
                    onValueChange={(value) => {
                      setPenaltyMappings(prev => prev.map(p => 
                        p.id === penalty.id ? { ...p, incomeAccountId: value } : p
                      ));
                    }}
                  >
                    <SelectTrigger>
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
                <div className="col-span-1">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => removePenaltyMapping(penalty.id)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
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