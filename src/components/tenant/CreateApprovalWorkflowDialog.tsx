import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus } from "lucide-react";
import { useCreateApprovalWorkflow, useApprovalWorkflowTypes } from "@/hooks/useApprovalWorkflows";
import { useCustomRoles } from "@/hooks/useCustomRoles";

interface CreateApprovalWorkflowDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const CreateApprovalWorkflowDialog = ({ open, onOpenChange, onSuccess }: CreateApprovalWorkflowDialogProps) => {
  const [formData, setFormData] = useState({
    workflow_type_id: "",
    action_type: "",
    table_name: "",
    minimum_approvers: 1,
    maximum_approvers: undefined as number | undefined,
    approval_order: "any" as "sequential" | "any" | "all",
    auto_approve_threshold: undefined as number | undefined,
  });
  
  const [workflowRoles, setWorkflowRoles] = useState<Array<{
    role: string;
    custom_role_id?: string;
    approval_level: number;
    can_approve: boolean;
    can_reject: boolean;
  }>>([]);
  
  const createWorkflowMutation = useCreateApprovalWorkflow();
  const { data: workflowTypes = [] } = useApprovalWorkflowTypes();
  const { data: customRoles = [] } = useCustomRoles();

  const SYSTEM_ROLES = [
    { value: 'tenant_admin', label: 'Tenant Admin' },
    { value: 'loan_officer', label: 'Loan Officer' },
    { value: 'client', label: 'Client' },
  ];

  const ACTION_TYPES = [
    { value: 'loan_approval', label: 'Loan Approval' },
    { value: 'client_approval', label: 'Client Approval' },
    { value: 'user_creation', label: 'User Creation' },
    { value: 'payment_approval', label: 'Payment Approval' },
    { value: 'transaction_approval', label: 'Transaction Approval' },
  ];

  const TABLE_NAMES = [
    { value: 'loans', label: 'Loans' },
    { value: 'clients', label: 'Clients' },
    { value: 'profiles', label: 'Users' },
    { value: 'transactions', label: 'Transactions' },
    { value: 'payments', label: 'Payments' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.workflow_type_id || !formData.action_type || !formData.table_name) {
      return;
    }

    await createWorkflowMutation.mutateAsync({
      ...formData,
      roles: workflowRoles,
    });

    // Reset form
    setFormData({
      workflow_type_id: "",
      action_type: "",
      table_name: "",
      minimum_approvers: 1,
      maximum_approvers: undefined,
      approval_order: "any",
      auto_approve_threshold: undefined,
    });
    setWorkflowRoles([]);
    onSuccess();
  };

  const addRole = () => {
    setWorkflowRoles([...workflowRoles, {
      role: "",
      approval_level: workflowRoles.length + 1,
      can_approve: true,
      can_reject: true,
    }]);
  };

  const removeRole = (index: number) => {
    setWorkflowRoles(workflowRoles.filter((_, i) => i !== index));
  };

  const updateRole = (index: number, updates: Partial<typeof workflowRoles[0]>) => {
    setWorkflowRoles(workflowRoles.map((role, i) => 
      i === index ? { ...role, ...updates } : role
    ));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Approval Workflow</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="workflow_type_id">Workflow Type *</Label>
              <Select 
                value={formData.workflow_type_id} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, workflow_type_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select workflow type" />
                </SelectTrigger>
                <SelectContent>
                  {workflowTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="action_type">Action Type *</Label>
              <Select 
                value={formData.action_type} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, action_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select action type" />
                </SelectTrigger>
                <SelectContent>
                  {ACTION_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="table_name">Table Name *</Label>
              <Select 
                value={formData.table_name} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, table_name: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select table" />
                </SelectTrigger>
                <SelectContent>
                  {TABLE_NAMES.map((table) => (
                    <SelectItem key={table.value} value={table.value}>
                      {table.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="approval_order">Approval Order</Label>
              <Select 
                value={formData.approval_order} 
                onValueChange={(value: "sequential" | "any" | "all") => 
                  setFormData(prev => ({ ...prev, approval_order: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any Order</SelectItem>
                  <SelectItem value="sequential">Sequential</SelectItem>
                  <SelectItem value="all">All Required</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="minimum_approvers">Minimum Approvers</Label>
              <Input
                type="number"
                min="1"
                value={formData.minimum_approvers}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  minimum_approvers: parseInt(e.target.value) || 1 
                }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maximum_approvers">Maximum Approvers (Optional)</Label>
              <Input
                type="number"
                min="1"
                value={formData.maximum_approvers || ""}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  maximum_approvers: e.target.value ? parseInt(e.target.value) : undefined 
                }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="auto_approve_threshold">Auto-Approve Threshold (Optional)</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.auto_approve_threshold || ""}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                auto_approve_threshold: e.target.value ? parseFloat(e.target.value) : undefined 
              }))}
              placeholder="Amount below which auto-approval is allowed"
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Approval Roles</Label>
              <Button type="button" onClick={addRole} variant="outline" size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Add Role
              </Button>
            </div>

            {workflowRoles.map((role, index) => (
              <Card key={index}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">Role {index + 1}</CardTitle>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeRole(index)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>System Role</Label>
                      <Select 
                        value={role.role} 
                        onValueChange={(value) => updateRole(index, { role: value, custom_role_id: undefined })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          {SYSTEM_ROLES.map((sysRole) => (
                            <SelectItem key={sysRole.value} value={sysRole.value}>
                              {sysRole.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Custom Role (Optional)</Label>
                      <Select 
                        value={role.custom_role_id || ""} 
                        onValueChange={(value) => updateRole(index, { custom_role_id: value || undefined })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select custom role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">No custom role</SelectItem>
                          {customRoles
                            .filter(customRole => customRole.is_active)
                            .map((customRole) => (
                              <SelectItem key={customRole.id} value={customRole.id}>
                                {customRole.name}
                              </SelectItem>
                            ))
                          }
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Approval Level</Label>
                      <Input
                        type="number"
                        min="1"
                        value={role.approval_level}
                        onChange={(e) => updateRole(index, { 
                          approval_level: parseInt(e.target.value) || 1 
                        })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Permissions</Label>
                      <div className="flex gap-2">
                        <Badge 
                          variant={role.can_approve ? "default" : "secondary"}
                          className="cursor-pointer"
                          onClick={() => updateRole(index, { can_approve: !role.can_approve })}
                        >
                          Can Approve
                        </Badge>
                        <Badge 
                          variant={role.can_reject ? "destructive" : "secondary"}
                          className="cursor-pointer"
                          onClick={() => updateRole(index, { can_reject: !role.can_reject })}
                        >
                          Can Reject
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createWorkflowMutation.isPending || !formData.workflow_type_id || !formData.action_type || !formData.table_name}
            >
              {createWorkflowMutation.isPending ? "Creating..." : "Create Workflow"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};