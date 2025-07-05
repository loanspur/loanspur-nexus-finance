import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useCreateAccount, useUpdateAccount, type ChartOfAccount } from "@/hooks/useChartOfAccounts";

interface ChartOfAccountFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account?: ChartOfAccount;
  parentAccounts?: ChartOfAccount[];
}

const ACCOUNT_TYPES = [
  { value: "asset", label: "Asset" },
  { value: "liability", label: "Liability" },
  { value: "equity", label: "Equity" },
  { value: "revenue", label: "Revenue" },
  { value: "expense", label: "Expense" },
];

const ACCOUNT_CATEGORIES = [
  { value: "current_asset", label: "Current Asset" },
  { value: "fixed_asset", label: "Fixed Asset" },
  { value: "current_liability", label: "Current Liability" },
  { value: "long_term_liability", label: "Long Term Liability" },
  { value: "equity", label: "Equity" },
  { value: "operating_revenue", label: "Operating Revenue" },
  { value: "other_revenue", label: "Other Revenue" },
  { value: "operating_expense", label: "Operating Expense" },
  { value: "other_expense", label: "Other Expense" },
];

export const ChartOfAccountForm = ({ open, onOpenChange, account, parentAccounts = [] }: ChartOfAccountFormProps) => {
  const [formData, setFormData] = useState({
    account_code: account?.account_code || "",
    account_name: account?.account_name || "",
    account_type: account?.account_type || "",
    account_category: account?.account_category || "",
    parent_account_id: account?.parent_account_id || "",
    description: account?.description || "",
    is_active: account?.is_active ?? true,
  });

  const createAccount = useCreateAccount();
  const updateAccount = useUpdateAccount();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData = {
      ...formData,
      parent_account_id: formData.parent_account_id || undefined,
    };

    if (account) {
      await updateAccount.mutateAsync({ id: account.id, ...submitData });
    } else {
      await createAccount.mutateAsync(submitData);
    }

    onOpenChange(false);
    setFormData({
      account_code: "",
      account_name: "",
      account_type: "",
      account_category: "",
      parent_account_id: "",
      description: "",
      is_active: true,
    });
  };

  const isLoading = createAccount.isPending || updateAccount.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {account ? 'Edit Account' : 'Create New Account'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="account_code">Account Code *</Label>
              <Input
                id="account_code"
                value={formData.account_code}
                onChange={(e) => setFormData({ ...formData, account_code: e.target.value })}
                placeholder="e.g. 1000"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="account_name">Account Name *</Label>
              <Input
                id="account_name"
                value={formData.account_name}
                onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
                placeholder="e.g. Cash"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="account_type">Account Type *</Label>
              <Select value={formData.account_type} onValueChange={(value) => setFormData({ ...formData, account_type: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {ACCOUNT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="account_category">Account Category *</Label>
              <Select value={formData.account_category} onValueChange={(value) => setFormData({ ...formData, account_category: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {ACCOUNT_CATEGORIES.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {parentAccounts.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="parent_account_id">Parent Account</Label>
              <Select value={formData.parent_account_id} onValueChange={(value) => setFormData({ ...formData, parent_account_id: value === "none" ? "" : value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select parent account" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Parent</SelectItem>
                  {parentAccounts.map((parentAccount) => (
                    <SelectItem key={parentAccount.id} value={parentAccount.id}>
                      {parentAccount.account_code} - {parentAccount.account_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Optional description"
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
            <Label htmlFor="is_active">Account is active</Label>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : account ? 'Update Account' : 'Create Account'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};