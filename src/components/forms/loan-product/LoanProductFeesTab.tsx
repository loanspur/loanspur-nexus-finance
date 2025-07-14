import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { UseFormReturn } from "react-hook-form";
import { LoanProductFormData } from "./LoanProductSchema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useFeeStructures } from "@/hooks/useFeeManagement";
import { Trash2 } from "lucide-react";
import { useState } from "react";

interface LoanProductFeesTabProps {
  form: UseFormReturn<LoanProductFormData>;
  tenantId: string;
}

interface Charge {
  id: string;
  name: string;
  type: string;
  amount: number;
  collectedOn: string;
  date: string;
}

interface OverdueCharge {
  id: string;
  name: string;
  type: string;
  amount: number;
  collectedOn: string;
  date: string;
}

export const LoanProductFeesTab = ({ form, tenantId }: LoanProductFeesTabProps) => {
  const { data: feeStructures = [] } = useFeeStructures();
  const activeFeeStructures = feeStructures.filter(fee => fee.is_active);
  const regularCharges = activeFeeStructures.filter(fee => !fee.is_overdue_charge);
  const overdueCharges = activeFeeStructures.filter(fee => fee.is_overdue_charge);

  const [charges, setCharges] = useState<Charge[]>([]);
  const [overdueChargesState, setOverdueChargesState] = useState<OverdueCharge[]>([]);
  const [selectedCharge, setSelectedCharge] = useState<string>('');
  const [selectedOverdueCharge, setSelectedOverdueCharge] = useState<string>('');

  const addCharge = () => {
    if (!selectedCharge) return;
    
    const feeStructure = regularCharges.find(f => f.id === selectedCharge);
    if (!feeStructure) return;

    const newCharge: Charge = {
      id: Math.random().toString(),
      name: feeStructure.name,
      type: feeStructure.calculation_type,
      amount: feeStructure.amount,
      collectedOn: 'One time',
      date: new Date().toLocaleDateString()
    };

    setCharges([...charges, newCharge]);
    setSelectedCharge('');
  };

  const removeCharge = (id: string) => {
    setCharges(charges.filter(charge => charge.id !== id));
  };

  const addOverdueCharge = () => {
    if (!selectedOverdueCharge) return;
    
    const feeStructure = overdueCharges.find(f => f.id === selectedOverdueCharge);
    if (!feeStructure) return;

    const newCharge: OverdueCharge = {
      id: Math.random().toString(),
      name: feeStructure.name,
      type: feeStructure.calculation_type,
      amount: feeStructure.amount,
      collectedOn: 'One time',
      date: new Date().toLocaleDateString()
    };

    setOverdueChargesState([...overdueChargesState, newCharge]);
    setSelectedOverdueCharge('');
  };

  const removeOverdueCharge = (id: string) => {
    setOverdueChargesState(overdueChargesState.filter(charge => charge.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Charges Section */}
      <div>
        <h3 className="text-lg font-medium text-muted-foreground mb-4">Charges</h3>
        
        <div className="flex gap-2 mb-4">
          <Select value={selectedCharge} onValueChange={setSelectedCharge}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select charge" />
            </SelectTrigger>
            <SelectContent>
              {regularCharges.map((fee) => (
                <SelectItem key={fee.id} value={fee.id}>
                  {fee.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={addCharge} disabled={!selectedCharge}>
            Add
          </Button>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <div className="grid grid-cols-6 gap-4 p-3 bg-muted text-sm font-medium text-muted-foreground">
            <div>Name</div>
            <div>Type</div>
            <div>Amount</div>
            <div>Collected On</div>
            <div>Date</div>
            <div>Actions</div>
          </div>
          {charges.map((charge) => (
            <div key={charge.id} className="grid grid-cols-6 gap-4 p-3 border-t">
              <div className="text-sm">{charge.name}</div>
              <div className="text-sm">{charge.type}</div>
              <div className="text-sm">{charge.amount}</div>
              <div className="text-sm">{charge.collectedOn}</div>
              <div className="text-sm">{charge.date}</div>
              <div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeCharge(charge.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
          {charges.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              No charges added yet
            </div>
          )}
        </div>
      </div>

      {/* Overdue Charges Section */}
      <div>
        <h3 className="text-lg font-medium text-muted-foreground mb-4">Overdue Charges</h3>
        
        <div className="flex gap-2 mb-4">
          <Select value={selectedOverdueCharge} onValueChange={setSelectedOverdueCharge}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select Overdue Charge" />
            </SelectTrigger>
            <SelectContent>
              {overdueCharges.map((fee) => (
                <SelectItem key={fee.id} value={fee.id}>
                  {fee.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={addOverdueCharge} disabled={!selectedOverdueCharge}>
            Add
          </Button>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <div className="grid grid-cols-6 gap-4 p-3 bg-muted text-sm font-medium text-muted-foreground">
            <div>Name</div>
            <div>Type</div>
            <div>Amount</div>
            <div>Collected On</div>
            <div>Date</div>
            <div>Actions</div>
          </div>
          {overdueChargesState.map((charge) => (
            <div key={charge.id} className="grid grid-cols-6 gap-4 p-3 border-t">
              <div className="text-sm">{charge.name}</div>
              <div className="text-sm">{charge.type}</div>
              <div className="text-sm">{charge.amount}</div>
              <div className="text-sm">{charge.collectedOn}</div>
              <div className="text-sm">{charge.date}</div>
              <div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeOverdueCharge(charge.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
          {overdueChargesState.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              No overdue charges added yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
