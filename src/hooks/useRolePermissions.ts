import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export interface Permission {
  id: string;
  name: string;
  description: string;
  module: string;
  action: string;
  resource?: string;
  created_at: string;
  updated_at: string;
}

export interface RolePermission {
  id: string;
  role: string;
  permission_id: string;
  tenant_id: string;
  created_at: string;
  permission?: Permission;
}

// Fetch all available permissions
export const usePermissions = () => {
  return useQuery({
    queryKey: ['permissions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('permissions')
        .select('*')
        .order('module', { ascending: true })
        .order('name', { ascending: true });
      
      if (error) throw error;
      return data as Permission[];
    },
  });
};

// Fetch role permissions for current tenant
export const useRolePermissions = () => {
  const { profile } = useAuth();
  
  return useQuery({
    queryKey: ['role-permissions', profile?.tenant_id],
    queryFn: async () => {
      if (!profile?.tenant_id) return [];
      
      const { data, error } = await supabase
        .from('role_permissions')
        .select(`
          *,
          permission:permissions(*)
        `)
        .eq('tenant_id', profile.tenant_id)
        .order('role', { ascending: true });
      
      if (error) throw error;
      return data as RolePermission[];
    },
    enabled: !!profile?.tenant_id,
  });
};

// Get permissions for a specific role
export const useRolePermissionsByRole = (role: string) => {
  const { profile } = useAuth();
  
  return useQuery({
    queryKey: ['role-permissions', profile?.tenant_id, role],
    queryFn: async () => {
      if (!profile?.tenant_id || !role) return [];
      
      const { data, error } = await supabase
        .from('role_permissions')
        .select(`
          *,
          permission:permissions(*)
        `)
        .eq('tenant_id', profile.tenant_id)
        .eq('role', role);
      
      if (error) throw error;
      return data as RolePermission[];
    },
    enabled: !!profile?.tenant_id && !!role,
  });
};

// Add permission to role
export const useAddRolePermission = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async ({ role, permissionId }: { role: string; permissionId: string }) => {
      if (!profile?.tenant_id) throw new Error('No tenant ID');
      
      const { data, error } = await supabase
        .from('role_permissions')
        .insert([{
          role,
          permission_id: permissionId,
          tenant_id: profile.tenant_id
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['role-permissions'] });
      queryClient.invalidateQueries({ queryKey: ['role-permissions', profile?.tenant_id, variables.role] });
      toast({
        title: "Success",
        description: "Permission added to role successfully",
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

// Remove permission from role
export const useRemoveRolePermission = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async ({ role, permissionId }: { role: string; permissionId: string }) => {
      if (!profile?.tenant_id) throw new Error('No tenant ID');
      
      const { error } = await supabase
        .from('role_permissions')
        .delete()
        .eq('role', role)
        .eq('permission_id', permissionId)
        .eq('tenant_id', profile.tenant_id);
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['role-permissions'] });
      queryClient.invalidateQueries({ queryKey: ['role-permissions', profile?.tenant_id, variables.role] });
      toast({
        title: "Success",
        description: "Permission removed from role successfully",
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

// Bulk update role permissions
export const useBulkUpdateRolePermissions = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async ({ role, permissionIds }: { role: string; permissionIds: string[] }) => {
      if (!profile?.tenant_id) throw new Error('No tenant ID');
      
      // First, remove all existing permissions for this role
      await supabase
        .from('role_permissions')
        .delete()
        .eq('role', role)
        .eq('tenant_id', profile.tenant_id);
      
      // Then, add the new permissions
      if (permissionIds.length > 0) {
        const { error } = await supabase
          .from('role_permissions')
          .insert(
            permissionIds.map(permissionId => ({
              role,
              permission_id: permissionId,
              tenant_id: profile.tenant_id
            }))
          );
        
        if (error) throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['role-permissions'] });
      queryClient.invalidateQueries({ queryKey: ['role-permissions', profile?.tenant_id, variables.role] });
      toast({
        title: "Success",
        description: "Role permissions updated successfully",
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