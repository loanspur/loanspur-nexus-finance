import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { useCreateAccrual, useUpdateAccrual, type Accrual } from "@/hooks/useAccruals";
import { useChartOfAccounts } from "@/hooks/useChartOfAccounts";

interface AccrualFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accrual?: Accrual;
}

const ACCRUAL_TYPES = [
  { value: "expense", label: "Expense Accrual" },
  { value: "income", label: "Income Accrual" },
  { value: "liability", label: "Liability Accrual" },
  { value: "asset", label: "Asset Accrual" },
];

export const AccrualForm = ({ open, onOpenChange, accrual }: AccrualFormProps) => {
  const [formData, setFormData] = useState({
    accrual_name: accrual?.accrual_name || "",
    description: accrual?.description || "",
    accrual_type: accrual?.accrual_type || "",
    amount: accrual?.amount || 0,
    accrual_date: accrual?.accrual_date || "",
    reversal_date: accrual?.reversal_date || "",
    account_id: accrual?.account_id || "",
    contra_account_id: accrual?.contra_account_id || "",
  });

  const [accrualDate, setAccrualDate] = useState<Date | undefined>(
    accrual?.accrual_date ? new Date(accrual.accrual_date) : undefined
  );
  const [reversalDate, setReversalDate] = useState<Date | undefined>(
    accrual?.reversal_date ? new Date(accrual.reversal_date) : undefined
  );

  const { data: accounts } = useChartOfAccounts();
  const createAccrual = useCreateAccrual();
  const updateAccrual = useUpdateAccrual();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData = {
      ...formData,
      amount: Number(formData.amount),
      accrual_date: accrualDate ? format(accrualDate, 'yyyy-MM-dd') : formData.accrual_date,
      reversal_date: reversalDate ? format(reversalDate, 'yyyy-MM-dd') : undefined,
    };

    if (accrual) {
      await updateAccrual.mutateAsync({ id: accrual.id, ...submitData });
    } else {
      await createAccrual.mutateAsync(submitData);
    }

    onOpenChange(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      accrual_name: "",
      description: "",
      accrual_type: "",
      amount: 0,
      accrual_date: "",
      reversal_date: "",
      account_id: "",
      contra_account_id: "",
    });
    setAccrualDate(undefined);
    setReversalDate(undefined);
  };

  const isLoading = createAccrual.isPending || updateAccrual.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {accrual ? 'Edit Accrual' : 'Create New Accrual'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="accrual_name">Accrual Name *</Label>
              <Input
                id="accrual_name"
                value={formData.accrual_name}
                onChange={(e) => setFormData({ ...formData, accrual_name: e.target.value })}
                placeholder="e.g. Salary Accrual"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="accrual_type">Accrual Type *</Label>
              <Select value={formData.accrual_type} onValueChange={(value) => setFormData({ ...formData, accrual_type: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {ACCRUAL_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Accrual description"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
              placeholder="0.00"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Accrual Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {accrualDate ? format(accrualDate, "PP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={accrualDate}
                    onSelect={setAccrualDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Reversal Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {reversalDate ? format(reversalDate, "PP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={reversalDate}
                    onSelect={setReversalDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="account_id">Account *</Label>
              <Select value={formData.account_id} onValueChange={(value) => setFormData({ ...formData, account_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts?.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.account_code} - {account.account_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contra_account_id">Contra Account *</Label>
              <Select value={formData.contra_account_id} onValueChange={(value) => setFormData({ ...formData, contra_account_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select contra account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts?.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.account_code} - {account.account_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : accrual ? 'Update Accrual' : 'Create Accrual'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};