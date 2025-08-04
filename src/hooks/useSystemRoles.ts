import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useCustomRoles } from './useCustomRoles';

export interface SystemRole {
  value: string;
  label: string;
}

export interface CombinedRole {
  id: string;
  name: string;
  type: 'system' | 'custom';
  value: string;
  label: string;
}

// Get available system roles (excluding super_admin for tenant users)
export const useSystemRoles = () => {
  const { profile } = useAuth();
  
  return useQuery({
    queryKey: ['system-roles', profile?.role],
    queryFn: async () => {
      try {
        // Get all available roles from the user_role enum
        const { data, error } = await supabase.rpc('get_user_roles');
        
        if (error) {
          console.error('Error fetching roles:', error);
          throw error;
        }
        
        // Filter out super_admin unless current user is super_admin
        const filteredRoles = data.filter((role: string) => 
          role !== 'super_admin' || profile?.role === 'super_admin'
        );
        
        // Map to proper format
        return filteredRoles.map((role: string) => ({
          value: role,
          label: role.split('_').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
          ).join(' ')
        })) as SystemRole[];
      } catch (error) {
        console.error('Error fetching roles:', error);
        // Fallback to hardcoded values if RPC fails
        const fallbackRoles = [
          { value: 'tenant_admin', label: 'Tenant Admin' },
          { value: 'loan_officer', label: 'Loan Officer' },
          { value: 'client', label: 'Client' }
        ];
        
        // Only show super_admin to super_admin users
        if (profile?.role === 'super_admin') {
          fallbackRoles.unshift({ value: 'super_admin', label: 'Super Admin' });
        }
        
        return fallbackRoles as SystemRole[];
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!profile,
  });
};

// Get combined system and custom roles for a comprehensive list
export const useCombinedRoles = () => {
  const { data: systemRoles = [] } = useSystemRoles();
  const { data: customRoles = [] } = useCustomRoles();

  return useQuery({
    queryKey: ['combined-roles', systemRoles, customRoles],
    queryFn: () => {
      const combined: CombinedRole[] = [
        // System roles
        ...systemRoles.map(role => ({
          id: role.value,
          name: role.label,
          type: 'system' as const,
          value: role.value,
          label: role.label
        })),
        // Custom roles
        ...customRoles
          .filter(role => role.is_active)
          .map(role => ({
            id: role.id,
            name: role.name,
            type: 'custom' as const,
            value: role.id,
            label: `${role.name} (Custom)`
          }))
      ];

      return combined;
    },
    enabled: systemRoles.length > 0 || customRoles.length > 0,
  });
};