import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export interface CustomRole {
  id: string;
  name: string;
  description?: string;
  tenant_id: string;
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface CustomRolePermission {
  id: string;
  custom_role_id: string;
  permission_id: string;
  tenant_id: string;
  can_make?: boolean;
  can_check?: boolean;
  created_at: string;
  permission?: {
    id: string;
    name: string;
    description: string;
    module: string;
    action: string;
    requires_maker_checker?: boolean;
    maker_checker_enabled?: boolean;
  };
}

// Fetch custom roles for current tenant
export const useCustomRoles = () => {
  const { profile } = useAuth();
  
  return useQuery({
    queryKey: ['custom-roles', profile?.tenant_id],
    queryFn: async () => {
      if (!profile?.tenant_id) return [];
      
      const { data, error } = await supabase
        .from('custom_roles')
        .select('*')
        .eq('tenant_id', profile.tenant_id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as CustomRole[];
    },
    enabled: !!profile?.tenant_id,
  });
};

// Fetch custom role permissions
export const useCustomRolePermissions = (customRoleId?: string) => {
  const { profile } = useAuth();
  
  return useQuery({
    queryKey: ['custom-role-permissions', profile?.tenant_id, customRoleId],
    queryFn: async () => {
      if (!profile?.tenant_id || !customRoleId) return [];
      
      const { data, error } = await supabase
        .from('custom_role_permissions')
        .select(`
          *,
          permission:permissions(*)
        `)
        .eq('tenant_id', profile.tenant_id)
        .eq('custom_role_id', customRoleId);
      
      if (error) throw error;
      return data as CustomRolePermission[];
    },
    enabled: !!profile?.tenant_id && !!customRoleId,
  });
};

// Create custom role
export const useCreateCustomRole = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async (roleData: {
      name: string;
      description?: string;
      permissionIds?: string[];
    }) => {
      if (!profile?.tenant_id) throw new Error('No tenant ID');
      
      // Create the role
      const { data: role, error: roleError } = await supabase
        .from('custom_roles')
        .insert([{
          name: roleData.name,
          description: roleData.description,
          tenant_id: profile.tenant_id,
          created_by: profile.id
        }])
        .select()
        .single();
      
      if (roleError) throw roleError;
      
      // Add permissions if provided
      if (roleData.permissionIds && roleData.permissionIds.length > 0) {
        const { error: permError } = await supabase
          .from('custom_role_permissions')
          .insert(
            roleData.permissionIds.map(permissionId => ({
              custom_role_id: role.id,
              permission_id: permissionId,
              tenant_id: profile.tenant_id,
              can_make: true,
              can_check: false
            }))
          );
        
        if (permError) throw permError;
      }
      
      return role;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-roles'] });
      toast({
        title: "Success",
        description: "Custom role created successfully",
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

// Update custom role
export const useUpdateCustomRole = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async ({
      roleId,
      updates
    }: {
      roleId: string;
      updates: {
        name?: string;
        description?: string;
        is_active?: boolean;
        permissionIds?: string[];
      };
    }) => {
      if (!profile?.tenant_id) throw new Error('No tenant ID');
      
      // Update role basic info
      const { data: role, error: roleError } = await supabase
        .from('custom_roles')
        .update({
          name: updates.name,
          description: updates.description,
          is_active: updates.is_active
        })
        .eq('id', roleId)
        .eq('tenant_id', profile.tenant_id)
        .select()
        .single();
      
      if (roleError) throw roleError;
      
      // Update permissions if provided
      if (updates.permissionIds !== undefined) {
        // Remove existing permissions
        await supabase
          .from('custom_role_permissions')
          .delete()
          .eq('custom_role_id', roleId)
          .eq('tenant_id', profile.tenant_id);
        
        // Add new permissions
        if (updates.permissionIds.length > 0) {
          const { error: permError } = await supabase
            .from('custom_role_permissions')
            .insert(
              updates.permissionIds.map(permissionId => ({
                custom_role_id: roleId,
                permission_id: permissionId,
                tenant_id: profile.tenant_id,
                can_make: true,
                can_check: false
              }))
            );
          
          if (permError) throw permError;
        }
      }
      
      return role;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-roles'] });
      queryClient.invalidateQueries({ queryKey: ['custom-role-permissions'] });
      toast({
        title: "Success",
        description: "Custom role updated successfully",
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

// Delete custom role
export const useDeleteCustomRole = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async (roleId: string) => {
      if (!profile?.tenant_id) throw new Error('No tenant ID');
      
      // Check if role is in use
      const { data: usersWithRole, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('custom_role_id', roleId)
        .eq('tenant_id', profile.tenant_id);
      
      if (checkError) throw checkError;
      
      if (usersWithRole && usersWithRole.length > 0) {
        throw new Error('Cannot delete role that is assigned to users. Please reassign users first.');
      }
      
      const { error } = await supabase
        .from('custom_roles')
        .delete()
        .eq('id', roleId)
        .eq('tenant_id', profile.tenant_id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-roles'] });
      toast({
        title: "Success",
        description: "Custom role deleted successfully",
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