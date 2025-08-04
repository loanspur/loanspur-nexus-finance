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
  return useQuery({
    queryKey: ['system-roles'],
    queryFn: async () => {
      // Use hardcoded values for now since we don't have the RPC function
      return [
        { value: 'tenant_admin', label: 'Tenant Admin' },
        { value: 'loan_officer', label: 'Loan Officer' },
        { value: 'client', label: 'Client' }
      ] as SystemRole[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
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