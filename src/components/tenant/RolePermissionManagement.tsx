import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Save, RefreshCw, AlertTriangle } from "lucide-react";
import { 
  usePermissions, 
  useRolePermissions, 
  useBulkUpdateRolePermissions,
  Permission 
} from "@/hooks/useRolePermissions";

const ROLES = [
  { value: 'tenant_admin', label: 'Tenant Admin', color: 'bg-red-100 text-red-800' },
  { value: 'loan_officer', label: 'Loan Officer', color: 'bg-blue-100 text-blue-800' },
  { value: 'client', label: 'Client', color: 'bg-green-100 text-green-800' },
];

export const RolePermissionManagement = () => {
  const [selectedRole, setSelectedRole] = useState('tenant_admin');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  const { data: permissions = [], isLoading: permissionsLoading } = usePermissions();
  const { data: rolePermissions = [], isLoading: rolePermissionsLoading, refetch } = useRolePermissions();
  const bulkUpdateMutation = useBulkUpdateRolePermissions();

  // Debug logging
  console.log('RolePermissionManagement Debug:', {
    permissions,
    permissionsCount: permissions.length,
    rolePermissions,
    rolePermissionsCount: rolePermissions.length,
    permissionsLoading,
    rolePermissionsLoading,
    selectedRole
  });

  // Group permissions by module
  const groupedPermissions = permissions.reduce((acc, permission) => {
    if (!acc[permission.module]) {
      acc[permission.module] = [];
    }
    acc[permission.module].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

  // Get current role permissions
  const currentRolePermissions = rolePermissions
    .filter(rp => rp.role === selectedRole)
    .map(rp => rp.permission_id);

  // Update selected permissions when role changes
  const handleRoleChange = (role: string) => {
    setSelectedRole(role);
    const rolePerms = rolePermissions
      .filter(rp => rp.role === role)
      .map(rp => rp.permission_id);
    setSelectedPermissions(rolePerms);
    setHasChanges(false);
  };

  // Handle permission toggle
  const handlePermissionToggle = (permissionId: string, checked: boolean) => {
    let newSelectedPermissions;
    if (checked) {
      newSelectedPermissions = [...selectedPermissions, permissionId];
    } else {
      newSelectedPermissions = selectedPermissions.filter(id => id !== permissionId);
    }
    setSelectedPermissions(newSelectedPermissions);
    
    // Check if changes were made
    const currentPerms = new Set(currentRolePermissions);
    const newPerms = new Set(newSelectedPermissions);
    const hasChanged = currentPerms.size !== newPerms.size || 
                      [...currentPerms].some(p => !newPerms.has(p));
    setHasChanges(hasChanged);
  };

  // Handle save changes
  const handleSave = async () => {
    // Convert selectedPermissions to the new format with maker-checker settings
    const permissionsWithMakerChecker = selectedPermissions.map(permissionId => {
      const permission = permissions.find(p => p.id === permissionId);
      return {
        permissionId,
        canMake: true, // Default to maker capability
        canCheck: permission?.requires_maker_checker ? false : true // Only allow check if maker-checker is required
      };
    });

    await bulkUpdateMutation.mutateAsync({
      role: selectedRole,
      permissions: permissionsWithMakerChecker
    });
    setHasChanges(false);
    refetch();
  };

  // Handle reset changes
  const handleReset = () => {
    setSelectedPermissions(currentRolePermissions);
    setHasChanges(false);
  };

  if (permissionsLoading || rolePermissionsLoading) {
    console.log('Loading state:', { permissionsLoading, rolePermissionsLoading });
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading permissions...</span>
      </div>
    );
  }

  console.log('About to render. Permissions length:', permissions.length, 'RolePermissions length:', rolePermissions.length);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Role & Permission Management
          </h2>
          <p className="text-muted-foreground">Configure permissions for each role</p>
        </div>
        
        {hasChanges && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleReset}>
              Reset
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={bulkUpdateMutation.isPending}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              {bulkUpdateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        )}
      </div>

      {/* Role Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Role</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedRole} onValueChange={handleRoleChange}>
            <TabsList className="grid w-full grid-cols-3">
              {ROLES.map((role) => (
                <TabsTrigger key={role.value} value={role.value}>
                  <Badge variant="secondary" className={role.color}>
                    {role.label}
                  </Badge>
                </TabsTrigger>
              ))}
            </TabsList>

            {ROLES.map((role) => (
              <TabsContent key={role.value} value={role.value} className="mt-6">
                <div className="space-y-6">
                  {/* Permission Groups */}
                  {Object.entries(groupedPermissions).map(([module, modulePermissions]) => (
                    <Card key={module}>
                      <CardHeader>
                        <CardTitle className="text-base capitalize">
                          {module} Management
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           {modulePermissions.map((permission) => (
                            <div key={permission.id} className="flex items-start space-x-3">
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
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
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
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Permission Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {ROLES.map((role) => {
              const rolePerms = rolePermissions.filter(rp => rp.role === role.value);
              return (
                <div key={role.value} className="text-center">
                  <Badge variant="secondary" className={role.color}>
                    {role.label}
                  </Badge>
                  <p className="text-2xl font-bold mt-2">{rolePerms.length}</p>
                  <p className="text-sm text-muted-foreground">Permissions</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};