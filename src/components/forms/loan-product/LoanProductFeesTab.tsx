import { FormField, FormItem, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { UseFormReturn } from "react-hook-form";
import { LoanProductFormData } from "./LoanProductSchema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useFeeStructures } from "@/hooks/useFeeManagement";
import { Trash2, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";

interface LoanProductFeesTabProps {
  form: UseFormReturn<LoanProductFormData>;
  tenantId: string;
}

export const LoanProductFeesTab = ({ form, tenantId }: LoanProductFeesTabProps) => {
  const { data: feeStructures = [] } = useFeeStructures();
  const activeFeeStructures = feeStructures.filter(fee => fee.is_active);
  // Filter for loan-related fees only
  const loanFeeStructures = activeFeeStructures.filter(fee => fee.fee_type === 'loan');
  const regularCharges = loanFeeStructures.filter(fee => !fee.is_overdue_charge);
  const overdueCharges = loanFeeStructures.filter(fee => fee.is_overdue_charge);

  const [selectedCharge, setSelectedCharge] = useState<string>('');
  const [selectedOverdueCharge, setSelectedOverdueCharge] = useState<string>('');

  // Watch linked fee IDs from the form
  const linkedFeeIds = form.watch('linked_fee_ids') || [];

  // Get fee details for display
  const getLinkedFees = () => {
    return linkedFeeIds.map(feeId => {
      const fee = loanFeeStructures.find(f => f.id === feeId);
      return fee;
    }).filter(Boolean);
  };

  const addCharge = () => {
    if (!selectedCharge) return;
    
    // Check if fee is already added
    if (linkedFeeIds.includes(selectedCharge)) {
      return;
    }

    const updatedFeeIds = [...linkedFeeIds, selectedCharge];
    form.setValue('linked_fee_ids', updatedFeeIds);
    setSelectedCharge('');
  };

  const removeCharge = (feeId: string) => {
    const updatedFeeIds = linkedFeeIds.filter(id => id !== feeId);
    form.setValue('linked_fee_ids', updatedFeeIds);
  };

  const addOverdueCharge = () => {
    if (!selectedOverdueCharge) return;
    
    // Check if fee is already added
    if (linkedFeeIds.includes(selectedOverdueCharge)) {
      return;
    }

    const updatedFeeIds = [...linkedFeeIds, selectedOverdueCharge];
    form.setValue('linked_fee_ids', updatedFeeIds);
    setSelectedOverdueCharge('');
  };

  const linkedFees = getLinkedFees();
  const linkedRegularFees = linkedFees.filter(fee => fee && !fee.is_overdue_charge);
  const linkedOverdueFees = linkedFees.filter(fee => fee && fee.is_overdue_charge);

  return (
    <div className="space-y-6">
      {/* Form field to connect with the schema */}
      <FormField
        control={form.control}
        name="linked_fee_ids"
        render={({ field }) => (
          <FormItem className="hidden">
            <FormControl>
              <Input {...field} value={field.value?.join(',') || ''} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Processing Fee and Late Payment Penalty */}

      {/* Linked Fee Structures - Regular Charges */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Charges</CardTitle>
          <CardDescription>
            Link existing fee structures to this loan product for additional charges
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Select value={selectedCharge} onValueChange={setSelectedCharge}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select charge" />
              </SelectTrigger>
              <SelectContent>
                {regularCharges
                  .filter(fee => !linkedFeeIds.includes(fee.id))
                  .map((fee) => (
                    <SelectItem key={fee.id} value={fee.id}>
                      {fee.name} - {fee.calculation_type === 'flat' ? 'USD' : '%'} {fee.amount}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <Button onClick={addCharge} disabled={!selectedCharge}>
              <Plus className="w-4 h-4 mr-2" />
              Add
            </Button>
          </div>

          {linkedRegularFees.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Linked Charges:</h4>
              <div className="space-y-2">
                {linkedRegularFees.map((fee) => (
                  <div key={fee.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">{fee.calculation_type}</Badge>
                      <div>
                        <div className="font-medium">{fee.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {fee.calculation_type === 'flat' ? 'USD' : '%'} {fee.amount}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCharge(fee.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {linkedRegularFees.length === 0 && (
            <div className="p-6 text-center text-muted-foreground border rounded-lg">
              No additional charges linked yet
            </div>
          )}
        </CardContent>
      </Card>

      {/* Linked Fee Structures - Overdue Charges */}
      <Card>
        <CardHeader>
          <CardTitle>Overdue Charges</CardTitle>
          <CardDescription>
            Link fee structures that apply when payments are overdue
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Select value={selectedOverdueCharge} onValueChange={setSelectedOverdueCharge}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select overdue charge" />
              </SelectTrigger>
              <SelectContent>
                {overdueCharges
                  .filter(fee => !linkedFeeIds.includes(fee.id))
                  .map((fee) => (
                    <SelectItem key={fee.id} value={fee.id}>
                      {fee.name} - {fee.calculation_type === 'flat' ? 'USD' : '%'} {fee.amount}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <Button onClick={addOverdueCharge} disabled={!selectedOverdueCharge}>
              <Plus className="w-4 h-4 mr-2" />
              Add
            </Button>
          </div>

          {linkedOverdueFees.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Linked Overdue Charges:</h4>
              <div className="space-y-2">
                {linkedOverdueFees.map((fee) => (
                  <div key={fee.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant="destructive">{fee.calculation_type}</Badge>
                      <div>
                        <div className="font-medium">{fee.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {fee.calculation_type === 'flat' ? 'USD' : '%'} {fee.amount}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCharge(fee.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {linkedOverdueFees.length === 0 && (
            <div className="p-6 text-center text-muted-foreground border rounded-lg">
              No overdue charges linked yet
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
