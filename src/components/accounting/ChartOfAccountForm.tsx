import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useCreateAccount, useUpdateAccount, useChartOfAccounts, type ChartOfAccount } from "@/hooks/useChartOfAccounts";

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
  { value: "income", label: "Income" },
  { value: "expense", label: "Expense" },
];

const ACCOUNT_USAGE = [
  { value: "general_ledger", label: "General Ledger" },
  { value: "loan_principal", label: "Loan Principal" },
  { value: "loan_interest", label: "Loan Interest" },
  { value: "loan_fees", label: "Loan Fees" },
  { value: "loan_penalties", label: "Loan Penalties" },
  { value: "savings_deposits", label: "Savings Deposits" },
  { value: "savings_interest", label: "Savings Interest" },
  { value: "client_receivables", label: "Client Receivables" },
  { value: "suspense_account", label: "Suspense Account" },
  { value: "fund_source", label: "Fund Source" },
];

export const ChartOfAccountForm = ({ open, onOpenChange, account, parentAccounts = [] }: ChartOfAccountFormProps) => {
  const { data: chartOfAccounts = [] } = useChartOfAccounts();
  const [formData, setFormData] = useState({
    account_code: account?.account_code || "",
    account_name: account?.account_name || "",
    account_type: account?.account_type || "",
    account_usage: account?.account_category || "general_ledger", // Map category to usage
    parent_account_id: account?.parent_account_id || "",
    description: account?.description || "",
    is_active: account?.is_active ?? true,
  });

  const createAccount = useCreateAccount();
  const updateAccount = useUpdateAccount();

  // Auto-generate account code based on account type
  const generateAccountCode = (accountType: string) => {
    const typePrefix = {
      asset: "1",
      liability: "2", 
      equity: "3",
      income: "4",
      expense: "5"
    }[accountType] || "1";

    // Find highest existing code for this type
    const existingCodes = chartOfAccounts
      .filter(acc => acc.account_code.startsWith(typePrefix))
      .map(acc => parseInt(acc.account_code))
      .filter(code => !isNaN(code))
      .sort((a, b) => b - a);

    const nextCode = existingCodes.length > 0 ? existingCodes[0] + 1 : parseInt(typePrefix + "000");
    return nextCode.toString();
  };

  // Auto-generate code when account type changes (for new accounts only)
  useEffect(() => {
    if (!account && formData.account_type && !formData.account_code) {
      const newCode = generateAccountCode(formData.account_type);
      setFormData(prev => ({ ...prev, account_code: newCode }));
    }
  }, [formData.account_type, account, chartOfAccounts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData = {
      ...formData,
      account_category: formData.account_usage, // Map usage back to category for DB
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
      account_usage: "general_ledger",
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
                placeholder="Auto-generated"
                required
                readOnly={!account} // Make read-only for new accounts (auto-generated)
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
              <Label htmlFor="account_usage">Account Usage *</Label>
              <Select value={formData.account_usage} onValueChange={(value) => setFormData({ ...formData, account_usage: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select usage" />
                </SelectTrigger>
                <SelectContent>
                  {ACCOUNT_USAGE.map((usage) => (
                    <SelectItem key={usage.value} value={usage.value}>
                      {usage.label}
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