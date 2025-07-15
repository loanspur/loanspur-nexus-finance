import { useState } from "react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { UseFormReturn } from "react-hook-form";
import { LoanProductFormData } from "./LoanProductSchema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useChartOfAccounts } from "@/hooks/useChartOfAccounts";
import { useFeeStructures } from "@/hooks/useFeeManagement";
import { useFunds } from "@/hooks/useFundsManagement";
import { useMPesaCredentials } from "@/hooks/useIntegrations";
import { usePaymentTypes } from "@/hooks/usePaymentTypes";
import { useFundSources } from "@/hooks/useFundSources";
import { X } from "lucide-react";

interface LoanProductAdvancedTabProps {
  form: UseFormReturn<LoanProductFormData>;
  tenantId: string;
}

interface PaymentChannelMapping {
  id: string;
  paymentType: string;
  fundSource: string;
}

interface FeeMapping {
  id: string;
  feeType: string;
  incomeAccount: string;
}

export const LoanProductAdvancedTab = ({ form, tenantId }: LoanProductAdvancedTabProps) => {
  const { data: chartOfAccounts = [] } = useChartOfAccounts();
  const { data: feeStructures = [] } = useFeeStructures();
  const { data: paymentTypes = [], isLoading: paymentTypesLoading } = usePaymentTypes();
  const { data: fundSources = [], isLoading: fundSourcesLoading } = useFundSources();

  const [paymentChannelMappings, setPaymentChannelMappings] = useState<PaymentChannelMapping[]>([]);
  const [feeMappings, setFeeMappings] = useState<FeeMapping[]>([]);

  const assetAccounts = chartOfAccounts.filter(account => account.account_type === 'asset');
  const incomeAccounts = chartOfAccounts.filter(account => account.account_type === 'income');

  const addPaymentChannelMapping = () => {
    const newMapping: PaymentChannelMapping = {
      id: Date.now().toString(),
      paymentType: "",
      fundSource: ""
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
      {/* Advanced Accounting Rule Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Advanced Accounting Rule <span className="text-blue-600 text-sm cursor-pointer">[hide]</span></CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          
          {/* Configure Fund Sources for Payment Channels */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-medium text-muted-foreground">Configure Fund Sources for Payment Channels</h3>
              <Button onClick={addPaymentChannelMapping} size="sm" className="bg-blue-500 hover:bg-blue-600">
                Add
              </Button>
            </div>
            
            <div className="space-y-3">
              {/* Header Row */}
              <div className="grid grid-cols-12 gap-4 text-sm font-medium text-muted-foreground pb-2 border-b">
                <div className="col-span-5">Payment Type</div>
                <div className="col-span-5">Fund Source</div>
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
                      value={mapping.fundSource}
                      onValueChange={(value) => updatePaymentChannelMapping(mapping.id, 'fundSource', value)}
                      disabled={fundSourcesLoading}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={fundSourcesLoading ? "Loading..." : "Select fund source"} />
                      </SelectTrigger>
                      <SelectContent>
                        {fundSources.map((source) => (
                          <SelectItem key={source.id} value={source.id}>
                            {source.name}
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
                          <SelectItem key={fee.id} value={fee.name}>
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
                          <SelectItem key={account.id} value={account.account_name}>
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