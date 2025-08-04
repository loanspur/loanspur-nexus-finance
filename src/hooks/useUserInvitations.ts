import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface UserInvitation {
  id: string;
  tenant_id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'tenant_admin' | 'loan_officer' | 'client';
  invitation_token: string;
  expires_at: string;
  invited_by?: string;
  used: boolean;
  accepted_at?: string;
  created_at: string;
  updated_at: string;
}

export const useUserInvitations = () => {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['user-invitations', profile?.tenant_id],
    queryFn: async () => {
      if (!profile?.tenant_id) return [];

      const { data, error } = await supabase
        .from('user_invitations')
        .select('*')
        .eq('tenant_id', profile.tenant_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.tenant_id,
  });
};

export const useAssignUserToOffice = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      userId,
      officeId,
      role = 'loan_officer'
    }: {
      userId: string;
      officeId: string;
      role?: 'manager' | 'assistant_manager' | 'loan_officer' | 'cashier' | 'staff';
    }) => {
      const { data, error } = await supabase
        .from('office_staff')
        .insert({
          office_id: officeId,
          staff_id: userId,
          role_in_office: role,
          assigned_date: new Date().toISOString().split('T')[0],
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['office-staff'] });
      toast({
        title: "Success",
        description: "User assigned to office successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to assign user to office",
        variant: "destructive",
      });
    },
  });
};