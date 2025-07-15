import { useState } from "react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { UseFormReturn } from "react-hook-form";
import { LoanProductFormData } from "./LoanProductSchema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useChartOfAccounts } from "@/hooks/useChartOfAccounts";
import { useFeeStructures } from "@/hooks/useFeeManagement";
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

  const [paymentChannelMappings, setPaymentChannelMappings] = useState<PaymentChannelMapping[]>([
    { id: "1", paymentType: "M-PESA PAYBILL - 4048161", fundSource: "M-pesa Paybill - 4048161" },
    { id: "2", paymentType: "EQUITY BANK ACCOUNT", fundSource: "Equity Bank Account" },
    { id: "3", paymentType: "PROPERTY M-PESA - 4083601", fundSource: "PROPERTY M-PESA - 4083..." },
    { id: "4", paymentType: "NCBA BANK - BGM", fundSource: "NCBA Bank Account" },
  ]);

  const [feeMappings, setFeeMappings] = useState<FeeMapping[]>([
    { id: "1", feeType: "Application Fee", incomeAccount: "Application Fee Income" },
    { id: "2", feeType: "Appraisal Fees", incomeAccount: "Appraisal Fee Income" },
    { id: "3", feeType: "CRB CHARGES", incomeAccount: "CRB CHARGE INCOME" },
    { id: "4", feeType: "Credit Life Insurance", incomeAccount: "Credit Life Insurance Income" },
    { id: "5", feeType: "Disbursement Charges", incomeAccount: "Disbursement Income" },
  ]);

  const assetAccounts = chartOfAccounts.filter(account => account.account_type === 'asset');
  const incomeAccounts = chartOfAccounts.filter(account => account.account_type === 'income');

  const paymentTypes = [
    "M-PESA PAYBILL - 4048161",
    "EQUITY BANK ACCOUNT", 
    "PROPERTY M-PESA - 4083601",
    "NCBA BANK - BGM",
    "KCB BANK ACCOUNT",
    "ABSA BANK ACCOUNT"
  ];

  const fundSources = [
    "M-pesa Paybill - 4048161",
    "Equity Bank Account",
    "PROPERTY M-PESA - 4083...",
    "NCBA Bank Account",
    "KCB Bank Account",
    "ABSA Bank Account"
  ];

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
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select payment type" />
                      </SelectTrigger>
                      <SelectContent>
                        {paymentTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-5">
                    <Select
                      value={mapping.fundSource}
                      onValueChange={(value) => updatePaymentChannelMapping(mapping.id, 'fundSource', value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select fund source" />
                      </SelectTrigger>
                      <SelectContent>
                        {fundSources.map((source) => (
                          <SelectItem key={source} value={source}>
                            {source}
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
                        <SelectItem value="Application Fee">Application Fee</SelectItem>
                        <SelectItem value="Appraisal Fees">Appraisal Fees</SelectItem>
                        <SelectItem value="CRB CHARGES">CRB CHARGES</SelectItem>
                        <SelectItem value="Credit Life Insurance">Credit Life Insurance</SelectItem>
                        <SelectItem value="Disbursement Charges">Disbursement Charges</SelectItem>
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
                        <SelectItem value="Application Fee Income">Application Fee Income</SelectItem>
                        <SelectItem value="Appraisal Fee Income">Appraisal Fee Income</SelectItem>
                        <SelectItem value="CRB CHARGE INCOME">CRB CHARGE INCOME</SelectItem>
                        <SelectItem value="Credit Life Insurance Income">Credit Life Insurance Income</SelectItem>
                        <SelectItem value="Disbursement Income">Disbursement Income</SelectItem>
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