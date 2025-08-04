import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { 
  Shield, 
  Save, 
  RefreshCw, 
  AlertTriangle, 
  Settings,
  CheckCircle,
  Eye,
  Edit,
  Trash2,
  Plus
} from "lucide-react";
import { 
  usePermissions, 
  useRolePermissions, 
  useBulkUpdateRolePermissions,
  Permission 
} from "@/hooks/useRolePermissions";

const ROLES = [
  { 
    value: "admin", 
    label: "Admin", 
    color: "bg-red-500", 
    description: "Full access to all features and settings",
    icon: Shield
  },
  { 
    value: "manager", 
    label: "Manager", 
    color: "bg-blue-500", 
    description: "Full access except critical deletions",
    icon: Settings
  },
  { 
    value: "accountant", 
    label: "Accountant", 
    color: "bg-purple-500", 
    description: "Accounting, payments, and financial operations",
    icon: CheckCircle
  },
  { 
    value: "loan_officer", 
    label: "Loan Officer", 
    color: "bg-green-500", 
    description: "Client management and loan operations",
    icon: Edit
  },
  { 
    value: "read_only", 
    label: "Read Only", 
    color: "bg-gray-500", 
    description: "View-only access to all features",
    icon: Eye
  },
  { 
    value: "tenant_admin", 
    label: "Legacy Admin", 
    color: "bg-orange-500", 
    description: "Legacy role - migrate to Admin role",
    icon: AlertTriangle
  },
];

const ACTION_ICONS = {
  create: Plus,
  read: Eye,
  update: Edit,
  delete: Trash2,
  approve: CheckCircle,
  disburse: CheckCircle,
  post: CheckCircle,
  reverse: RefreshCw,
  activate: CheckCircle,
  resolve: CheckCircle,
};

const ACTION_COLORS = {
  create: "bg-green-100 text-green-800",
  read: "bg-blue-100 text-blue-800",
  update: "bg-yellow-100 text-yellow-800",
  delete: "bg-red-100 text-red-800",
  approve: "bg-purple-100 text-purple-800",
  disburse: "bg-indigo-100 text-indigo-800",
  post: "bg-orange-100 text-orange-800",
  reverse: "bg-red-100 text-red-800",
  activate: "bg-green-100 text-green-800",
  resolve: "bg-blue-100 text-blue-800",
};

interface SelectedPermission {
  permissionId: string;
  canMake: boolean;
  canCheck: boolean;
}

export const EnhancedRolePermissionManagement = () => {
  const [selectedRole, setSelectedRole] = useState("admin");
  const [selectedPermissions, setSelectedPermissions] = useState<SelectedPermission[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  const { data: permissions = [], isLoading: permissionsLoading } = usePermissions();
  const { data: rolePermissions = [], isLoading: rolePermissionsLoading, refetch } = useRolePermissions();
  const bulkUpdateMutation = useBulkUpdateRolePermissions();

  // Group permissions by bundle and module
  const groupedPermissions = permissions.reduce((acc, permission) => {
    const bundle = permission.permission_bundle || permission.module;
    if (!acc[bundle]) {
      acc[bundle] = {};
    }
    const group = permission.permission_group || permission.module;
    if (!acc[bundle][group]) {
      acc[bundle][group] = [];
    }
    acc[bundle][group].push(permission);
    return acc;
  }, {} as Record<string, Record<string, Permission[]>>);

  // Sort permissions within each group by display_order
  Object.keys(groupedPermissions).forEach(bundle => {
    Object.keys(groupedPermissions[bundle]).forEach(group => {
      groupedPermissions[bundle][group].sort((a, b) => 
        (a.display_order || 0) - (b.display_order || 0)
      );
    });
  });

  // Get current role permissions
  const currentRolePermissions = rolePermissions.filter(rp => rp.role === selectedRole);

  // Update selected permissions when role changes
  useEffect(() => {
    const rolePerms = currentRolePermissions.map(rp => ({
      permissionId: rp.permission_id,
      canMake: rp.can_make || true,
      canCheck: rp.can_check || false
    }));
    setSelectedPermissions(rolePerms);
    setHasChanges(false);
  }, [selectedRole, rolePermissions]);

  const handleRoleChange = (role: string) => {
    setSelectedRole(role);
  };

  const handlePermissionToggle = (permissionId: string) => {
    setSelectedPermissions(prev => {
      const existing = prev.find(p => p.permissionId === permissionId);
      if (existing) {
        return prev.filter(p => p.permissionId !== permissionId);
      } else {
        const permission = permissions.find(p => p.id === permissionId);
        return [...prev, { 
          permissionId, 
          canMake: true, 
          canCheck: permission?.requires_maker_checker || false 
        }];
      }
    });
    setHasChanges(true);
  };

  const handleMakerCheckerToggle = (permissionId: string, field: 'canMake' | 'canCheck') => {
    setSelectedPermissions(prev => 
      prev.map(p => 
        p.permissionId === permissionId 
          ? { ...p, [field]: !p[field] }
          : p
      )
    );
    setHasChanges(true);
  };

  const handleBundleToggle = (bundle: string) => {
    const bundlePermissions = Object.values(groupedPermissions[bundle] || {}).flat();
    const allSelected = bundlePermissions.every(p => 
      selectedPermissions.some(sp => sp.permissionId === p.id)
    );
    
    setSelectedPermissions(prev => {
      if (allSelected) {
        // Remove all permissions from this bundle
        const bundleIds = bundlePermissions.map(p => p.id);
        return prev.filter(p => !bundleIds.includes(p.permissionId));
      } else {
        // Add all permissions from this bundle
        const newPermissions = bundlePermissions
          .filter(p => !prev.some(sp => sp.permissionId === p.id))
          .map(p => ({
            permissionId: p.id,
            canMake: true,
            canCheck: p.requires_maker_checker || false
          }));
        return [...prev, ...newPermissions];
      }
    });
    setHasChanges(true);
  };

  const handleGroupToggle = (bundle: string, group: string) => {
    const groupPermissions = groupedPermissions[bundle]?.[group] || [];
    const allSelected = groupPermissions.every(p => 
      selectedPermissions.some(sp => sp.permissionId === p.id)
    );
    
    setSelectedPermissions(prev => {
      if (allSelected) {
        // Remove all permissions from this group
        const groupIds = groupPermissions.map(p => p.id);
        return prev.filter(p => !groupIds.includes(p.permissionId));
      } else {
        // Add all permissions from this group
        const newPermissions = groupPermissions
          .filter(p => !prev.some(sp => sp.permissionId === p.id))
          .map(p => ({
            permissionId: p.id,
            canMake: true,
            canCheck: p.requires_maker_checker || false
          }));
        return [...prev, ...newPermissions];
      }
    });
    setHasChanges(true);
  };

  const handleSave = async () => {
    await bulkUpdateMutation.mutateAsync({
      role: selectedRole,
      permissions: selectedPermissions
    });
    setHasChanges(false);
    refetch();
  };

  const handleReset = () => {
    const rolePerms = currentRolePermissions.map(rp => ({
      permissionId: rp.permission_id,
      canMake: rp.can_make || true,
      canCheck: rp.can_check || false
    }));
    setSelectedPermissions(rolePerms);
    setHasChanges(false);
  };

  if (permissionsLoading || rolePermissionsLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading permissions...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Enhanced Role & Permission Management
          </h2>
          <p className="text-muted-foreground">Configure comprehensive permissions with maker-checker controls</p>
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

      {/* Role Selection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {ROLES.map((role) => {
          const rolePerms = rolePermissions.filter(rp => rp.role === role.value);
          const IconComponent = role.icon;
          
          return (
            <Card 
              key={role.value}
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedRole === role.value ? 'ring-2 ring-primary shadow-lg' : ''
              }`}
              onClick={() => handleRoleChange(role.value)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-lg ${role.color} flex items-center justify-center text-white`}>
                    <IconComponent className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{role.label}</h3>
                    <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                      {role.description}
                    </p>
                    <Badge variant="secondary" className="text-xs">
                      {rolePerms.length} permissions
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Permission Configuration */}
      {selectedRole && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configure {ROLES.find(r => r.value === selectedRole)?.label} Permissions
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Select permissions and configure maker-checker controls for sensitive operations
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {Object.entries(groupedPermissions).map(([bundle, bundleGroups]) => {
              const bundlePermissions = Object.values(bundleGroups).flat();
              const bundleSelected = bundlePermissions.filter(p => 
                selectedPermissions.some(sp => sp.permissionId === p.id)
              ).length;
              const bundleTotal = bundlePermissions.length;
              
              return (
                <div key={bundle} className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-lg capitalize">
                        {bundle.replace(/_/g, ' ')}
                      </h3>
                      <Badge variant="outline" className="text-sm">
                        {bundleSelected}/{bundleTotal} selected
                      </Badge>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBundleToggle(bundle)}
                    >
                      {bundleSelected === bundleTotal ? 'Deselect All' : 'Select All'}
                    </Button>
                  </div>
                  
                  {Object.entries(bundleGroups).map(([group, groupPermissions]) => {
                    const groupSelected = groupPermissions.filter(p => 
                      selectedPermissions.some(sp => sp.permissionId === p.id)
                    ).length;
                    
                    return (
                      <div key={group} className="ml-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium capitalize text-foreground">
                              {group.replace(/_/g, ' ')}
                            </h4>
                            <Badge variant="secondary" className="text-xs">
                              {groupSelected}/{groupPermissions.length}
                            </Badge>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleGroupToggle(bundle, group)}
                            className="text-xs h-8"
                          >
                            {groupSelected === groupPermissions.length ? 'Clear' : 'All'}
                          </Button>
                        </div>
                        
                        <div className="grid gap-3">
                          {groupPermissions.map((permission) => {
                            const isSelected = selectedPermissions.some(p => p.permissionId === permission.id);
                            const selectedPerm = selectedPermissions.find(p => p.permissionId === permission.id);
                            const ActionIcon = ACTION_ICONS[permission.action as keyof typeof ACTION_ICONS] || Settings;
                            
                            return (
                              <div key={permission.id} className="border rounded-lg p-4 bg-card">
                                <div className="flex items-start justify-between">
                                  <div className="flex items-start space-x-3 flex-1">
                                    <Checkbox
                                      checked={isSelected}
                                      onCheckedChange={() => handlePermissionToggle(permission.id)}
                                    />
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-1">
                                        <ActionIcon className="h-4 w-4 text-muted-foreground" />
                                        <label className="text-sm font-medium capitalize cursor-pointer">
                                          {permission.name.split('.').pop()?.replace(/_/g, ' ')}
                                        </label>
                                      </div>
                                      <p className="text-xs text-muted-foreground">
                                        {permission.description}
                                      </p>
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center gap-2 ml-3">
                                    <Badge 
                                      variant="outline"
                                      className={`text-xs ${ACTION_COLORS[permission.action as keyof typeof ACTION_COLORS] || 'bg-gray-100 text-gray-800'}`}
                                    >
                                      {permission.action}
                                    </Badge>
                                    
                                    {permission.requires_maker_checker && (
                                      <Badge variant="secondary" className="text-xs">
                                        <AlertTriangle className="h-3 w-3 mr-1" />
                                        Maker-Checker
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                
                                {/* Maker-Checker Controls */}
                                {isSelected && permission.requires_maker_checker && (
                                  <div className="mt-3 pt-3 border-t">
                                    <div className="flex items-center justify-between text-sm">
                                      <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-2">
                                        <Switch
                                            checked={selectedPerm?.canMake || false}
                                            onCheckedChange={() => handleMakerCheckerToggle(permission.id, 'canMake')}
                                          />
                                          <span className="text-xs text-muted-foreground">Can Make</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <Switch
                                            checked={selectedPerm?.canCheck || false}
                                            onCheckedChange={() => handleMakerCheckerToggle(permission.id, 'canCheck')}
                                          />
                                          <span className="text-xs text-muted-foreground">Can Check</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                        
                        {groupPermissions.length > 0 && (
                          <Separator className="my-4" />
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Summary Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Permission Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {ROLES.map((role) => {
              const rolePerms = rolePermissions.filter(rp => rp.role === role.value);
              const makerCheckerPerms = rolePerms.filter(rp => {
                const permission = permissions.find(p => p.id === rp.permission_id);
                return permission?.requires_maker_checker;
              });
              
              return (
                <div key={role.value} className="text-center p-4 border rounded-lg">
                  <div className={`w-8 h-8 rounded-full ${role.color} mx-auto mb-2 flex items-center justify-center text-white`}>
                    <role.icon className="h-4 w-4" />
                  </div>
                  <h4 className="font-medium text-sm mb-1">{role.label}</h4>
                  <p className="text-xl font-bold">{rolePerms.length}</p>
                  <p className="text-xs text-muted-foreground">
                    {makerCheckerPerms.length} with M-C
                  </p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};