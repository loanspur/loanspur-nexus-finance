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
  requires_maker_checker?: boolean;
  maker_checker_enabled?: boolean;
  permission_bundle?: string;
  permission_group?: string;
  display_order?: number;
  is_core_permission?: boolean;
  created_at: string;
  updated_at: string;
}

export interface RolePermission {
  id: string;
  role?: string;
  custom_role_id?: string;
  permission_id: string;
  tenant_id: string;
  can_make?: boolean;
  can_check?: boolean;
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

// Bulk update role permissions with maker-checker support
export const useBulkUpdateRolePermissions = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async (params: { 
      role?: string;
      customRoleId?: string; 
      permissions: Array<{
        permissionId: string;
        canMake: boolean;
        canCheck: boolean;
      }>;
    }) => {
      if (!profile?.tenant_id) throw new Error('No tenant ID');
      
      const { role, customRoleId, permissions } = params;
      
      // First, remove all existing permissions for this role
      if (role) {
        const { error: deleteError } = await supabase
          .from('role_permissions')
          .delete()
          .match({ tenant_id: profile.tenant_id, role: role });
        if (deleteError) throw deleteError;
      } else if (customRoleId) {
        const { error: deleteError } = await supabase
          .from('role_permissions')
          .delete()
          .match({ tenant_id: profile.tenant_id, custom_role_id: customRoleId });
        if (deleteError) throw deleteError;
      } else {
        throw new Error('Either role or customRoleId must be provided');
      }
      
      // Then, add the new permissions with maker-checker settings
      if (permissions.length > 0) {
        const insertData = permissions.map(({ permissionId, canMake, canCheck }) => ({
          role: role || null,
          custom_role_id: customRoleId || null,
          permission_id: permissionId,
          tenant_id: profile.tenant_id,
          can_make: canMake,
          can_check: canCheck
        }));

        const { error } = await supabase
          .from('role_permissions')
          .insert(insertData);
        
        if (error) throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['role-permissions'] });
      if (variables.role) {
        queryClient.invalidateQueries({ queryKey: ['role-permissions', profile?.tenant_id, variables.role] });
      }
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