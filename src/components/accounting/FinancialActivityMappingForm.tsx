import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCreateFinancialActivityMapping, useUpdateFinancialActivityMapping, type FinancialActivityMapping } from "@/hooks/useFinancialActivityMappings";
import { useChartOfAccounts } from "@/hooks/useChartOfAccounts";

interface FinancialActivityMappingFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mapping?: FinancialActivityMapping;
}

const MAPPING_TYPES = [
  { value: "income", label: "Income Activity" },
  { value: "expense", label: "Expense Activity" },
  { value: "asset", label: "Asset Activity" },
  { value: "liability", label: "Liability Activity" },
  { value: "equity", label: "Equity Activity" },
];

export const FinancialActivityMappingForm = ({ open, onOpenChange, mapping }: FinancialActivityMappingFormProps) => {
  const [formData, setFormData] = useState({
    activity_name: mapping?.activity_name || "",
    activity_code: mapping?.activity_code || "",
    description: mapping?.description || "",
    account_id: mapping?.account_id || "",
    mapping_type: mapping?.mapping_type || "",
  });

  const { data: accounts } = useChartOfAccounts();
  const createMapping = useCreateFinancialActivityMapping();
  const updateMapping = useUpdateFinancialActivityMapping();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (mapping) {
      await updateMapping.mutateAsync({ id: mapping.id, ...formData });
    } else {
      await createMapping.mutateAsync(formData);
    }

    onOpenChange(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      activity_name: "",
      activity_code: "",
      description: "",
      account_id: "",
      mapping_type: "",
    });
  };

  const isLoading = createMapping.isPending || updateMapping.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {mapping ? 'Edit Financial Activity Mapping' : 'Define New Financial Activity Mapping'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Description of the financial activity"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="mapping_type">Mapping Type *</Label>
            <Select value={formData.mapping_type} onValueChange={(value) => setFormData({ ...formData, mapping_type: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select mapping type" />
              </SelectTrigger>
              <SelectContent>
                {MAPPING_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : mapping ? 'Update Mapping' : 'Create Mapping'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};