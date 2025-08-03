import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";
import { useUpdateCustomRole, CustomRole } from "@/hooks/useCustomRoles";
import { usePermissions, Permission } from "@/hooks/useRolePermissions";
import { useCustomRolePermissions } from "@/hooks/useCustomRoles";
import { ScrollArea } from "@/components/ui/scroll-area";

interface EditCustomRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: CustomRole | null;
  onSuccess: () => void;
}

export const EditCustomRoleDialog = ({ open, onOpenChange, role, onSuccess }: EditCustomRoleDialogProps) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    is_active: true,
  });
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  
  const updateRoleMutation = useUpdateCustomRole();
  const { data: permissions = [] } = usePermissions();
  const { data: rolePermissions = [] } = useCustomRolePermissions(role?.id);

  // Initialize form data when role changes
  useEffect(() => {
    if (role) {
      setFormData({
        name: role.name,
        description: role.description || "",
        is_active: role.is_active,
      });
      const permissionIds = rolePermissions.map(rp => rp.permission_id);
      setSelectedPermissions(permissionIds);
    }
  }, [role, rolePermissions]);

  // Group permissions by module
  const groupedPermissions = permissions.reduce((acc, permission) => {
    if (!acc[permission.module]) {
      acc[permission.module] = [];
    }
    acc[permission.module].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!role || !formData.name.trim()) {
      return;
    }

    await updateRoleMutation.mutateAsync({
      roleId: role.id,
      updates: {
        name: formData.name,
        description: formData.description || undefined,
        is_active: formData.is_active,
        permissionIds: selectedPermissions,
      },
    });

    onSuccess();
  };

  const handlePermissionToggle = (permissionId: string, checked: boolean) => {
    if (checked) {
      setSelectedPermissions(prev => [...prev, permissionId]);
    } else {
      setSelectedPermissions(prev => prev.filter(id => id !== permissionId));
    }
  };

  const handleSelectAllModule = (modulePermissions: Permission[], checked: boolean) => {
    if (checked) {
      const modulePermissionIds = modulePermissions.map(p => p.id);
      setSelectedPermissions(prev => [...new Set([...prev, ...modulePermissionIds])]);
    } else {
      const modulePermissionIds = new Set(modulePermissions.map(p => p.id));
      setSelectedPermissions(prev => prev.filter(id => !modulePermissionIds.has(id)));
    }
  };

  if (!role) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Edit Custom Role</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Role Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Branch Manager"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of the role"
                rows={3}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="isActive"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
            />
            <Label htmlFor="isActive">Active Role</Label>
          </div>

          <div className="space-y-4">
            <Label className="text-base font-semibold">Permissions</Label>
            <ScrollArea className="h-96 border rounded-lg p-4">
              <div className="space-y-4">
                {Object.entries(groupedPermissions).map(([module, modulePermissions]) => {
                  const allSelected = modulePermissions.every(p => selectedPermissions.includes(p.id));
                  const someSelected = modulePermissions.some(p => selectedPermissions.includes(p.id));
                  
                  return (
                    <Card key={module}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`module-${module}`}
                            checked={allSelected}
                            onCheckedChange={(checked) => 
                              handleSelectAllModule(modulePermissions, checked as boolean)
                            }
                          />
                          <CardTitle className="text-base capitalize">
                            {module} Management
                          </CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {modulePermissions.map((permission) => (
                            <div key={permission.id} className="flex items-start space-x-2">
                              <Checkbox
                                id={permission.id}
                                checked={selectedPermissions.includes(permission.id)}
                                onCheckedChange={(checked) => 
                                  handlePermissionToggle(permission.id, checked as boolean)
                                }
                              />
                              <div className="grid gap-1.5 leading-none flex-1">
                                <div className="flex items-center gap-2">
                                  <label
                                    htmlFor={permission.id}
                                    className="text-sm font-medium leading-none cursor-pointer"
                                  >
                                    {permission.name}
                                  </label>
                                  {permission.requires_maker_checker && (
                                    <Badge variant="outline" className="text-xs">
                                      <AlertTriangle className="h-3 w-3 mr-1" />
                                      Maker-Checker
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {permission.description}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {selectedPermissions.length} permission(s) selected
            </p>
            <div className="flex gap-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={updateRoleMutation.isPending || !formData.name.trim()}
              >
                {updateRoleMutation.isPending ? "Updating..." : "Update Role"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};