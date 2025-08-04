import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export interface PermissionBundle {
  bundle: string;
  label: string;
  description: string;
  groups: PermissionGroup[];
}

export interface PermissionGroup {
  group: string;
  label: string;
  permissions: Permission[];
}

export interface Permission {
  id: string;
  name: string;
  description: string;
  module: string;
  action: string;
  permission_bundle?: string;
  permission_group?: string;
  display_order?: number;
  requires_maker_checker?: boolean;
  maker_checker_enabled?: boolean;
  is_core_permission?: boolean;
  created_at: string;
  updated_at: string;
}

export interface TenantMakerCheckerSettings {
  global_enabled: boolean;
  minimum_approval_amount: number;
  auto_approve_threshold: number;
  require_different_approver: boolean;
}

// Get tenant maker-checker configuration
export const useTenantMakerCheckerSettings = () => {
  const { profile } = useAuth();
  
  return useQuery({
    queryKey: ['tenant-maker-checker-settings', profile?.tenant_id],
    queryFn: async () => {
      if (!profile?.tenant_id) return null;
      
      const { data, error } = await supabase
        .from('tenants')
        .select('maker_checker_enabled, maker_checker_settings')
        .eq('id', profile.tenant_id)
        .single();
      
      if (error) throw error;
      return {
        enabled: data.maker_checker_enabled,
        settings: data.maker_checker_settings as unknown as TenantMakerCheckerSettings
      };
    },
    enabled: !!profile?.tenant_id,
  });
};

// Update tenant maker-checker configuration
export const useUpdateTenantMakerCheckerSettings = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      enabled, 
      settings 
    }: { 
      enabled: boolean; 
      settings: TenantMakerCheckerSettings; 
    }) => {
      if (!profile?.tenant_id) throw new Error('No tenant ID');
      
      const { error } = await supabase
        .from('tenants')
        .update({
          maker_checker_enabled: enabled,
          maker_checker_settings: settings as any
        })
        .eq('id', profile.tenant_id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-maker-checker-settings'] });
      toast({
        title: "Success",
        description: "Maker-checker settings updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

// Get permission bundles with grouped permissions
export const usePermissionBundles = () => {
  const { data: permissions = [] } = useQuery({
    queryKey: ['permissions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('permissions')
        .select('*')
        .order('permission_bundle', { ascending: true })
        .order('permission_group', { ascending: true })
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      return data as Permission[];
    },
  });

  // Group permissions into bundles
  const bundles = permissions.reduce((acc, permission) => {
    const bundleName = permission.permission_bundle || permission.module;
    const groupName = permission.permission_group || permission.module;
    
    if (!acc[bundleName]) {
      acc[bundleName] = {
        bundle: bundleName,
        label: bundleName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        description: `Permissions for ${bundleName.replace(/_/g, ' ')} operations`,
        groups: {}
      };
    }
    
    if (!acc[bundleName].groups[groupName]) {
      acc[bundleName].groups[groupName] = {
        group: groupName,
        label: groupName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        permissions: []
      };
    }
    
    acc[bundleName].groups[groupName].permissions.push(permission);
    
    return acc;
  }, {} as Record<string, { bundle: string; label: string; description: string; groups: Record<string, PermissionGroup> }>);

  // Convert to array format
  const bundleArray: PermissionBundle[] = Object.values(bundles).map(bundle => ({
    ...bundle,
    groups: Object.values(bundle.groups)
  }));

  return {
    data: bundleArray,
    isLoading: false
  };
};

// Bulk operations for permissions
export const useBulkPermissionOperations = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const assignBundleToRole = useMutation({
    mutationFn: async ({ 
      role, 
      bundle, 
      tenantId,
      makerCheckerDefaults = { canMake: true, canCheck: false }
    }: { 
      role: string; 
      bundle: string; 
      tenantId: string;
      makerCheckerDefaults?: { canMake: boolean; canCheck: boolean };
    }) => {
      // Get all permissions in the bundle
      const { data: permissions, error: permError } = await supabase
        .from('permissions')
        .select('id, requires_maker_checker')
        .eq('permission_bundle', bundle);
      
      if (permError) throw permError;
      
      // Insert role permissions
      const rolePermissions = permissions.map(p => ({
        role,
        permission_id: p.id,
        tenant_id: tenantId,
        can_make: makerCheckerDefaults.canMake,
        can_check: p.requires_maker_checker ? makerCheckerDefaults.canCheck : false
      }));
      
      const { error } = await supabase
        .from('role_permissions')
        .upsert(rolePermissions, { 
          onConflict: 'role,permission_id,tenant_id',
          ignoreDuplicates: false 
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['role-permissions'] });
      toast({
        title: "Success",
        description: "Permission bundle assigned successfully",
      });
    }
  });

  const removeBundleFromRole = useMutation({
    mutationFn: async ({ 
      role, 
      bundle, 
      tenantId 
    }: { 
      role: string; 
      bundle: string; 
      tenantId: string; 
    }) => {
      // Get all permissions in the bundle
      const { data: permissions, error: permError } = await supabase
        .from('permissions')
        .select('id')
        .eq('permission_bundle', bundle);
      
      if (permError) throw permError;
      
      const permissionIds = permissions.map(p => p.id);
      
      // Remove role permissions
      const { error } = await supabase
        .from('role_permissions')
        .delete()
        .eq('role', role)
        .eq('tenant_id', tenantId)
        .in('permission_id', permissionIds);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['role-permissions'] });
      toast({
        title: "Success",
        description: "Permission bundle removed successfully",
      });
    }
  });

  return {
    assignBundleToRole,
    removeBundleFromRole
  };
};

// Check if user has specific permission
export const useHasPermission = (permissionName: string) => {
  const { profile } = useAuth();
  
  return useQuery({
    queryKey: ['user-permission', profile?.id, permissionName],
    queryFn: async () => {
      if (!profile?.id || !profile?.tenant_id) return false;
      
      // Check if user has the permission through their role
      const { data, error } = await supabase
        .from('role_permissions')
        .select(`
          can_make,
          can_check,
          permission:permissions!inner(name)
        `)
        .eq('role', profile.role)
        .eq('tenant_id', profile.tenant_id)
        .eq('permissions.name', permissionName)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      
      return data ? { canMake: data.can_make, canCheck: data.can_check } : null;
    },
    enabled: !!profile?.id && !!profile?.tenant_id && !!permissionName,
  });
};

// Get all permissions for current user
export const useUserPermissions = () => {
  const { profile } = useAuth();
  
  return useQuery({
    queryKey: ['user-permissions', profile?.id],
    queryFn: async () => {
      if (!profile?.id || !profile?.tenant_id) return [];
      
      const { data, error } = await supabase
        .from('role_permissions')
        .select(`
          can_make,
          can_check,
          permission:permissions(*)
        `)
        .eq('role', profile.role)
        .eq('tenant_id', profile.tenant_id);
      
      if (error) throw error;
      
      return data.map(rp => ({
        ...rp.permission,
        can_make: rp.can_make,
        can_check: rp.can_check
      }));
    },
    enabled: !!profile?.id && !!profile?.tenant_id,
  });
};