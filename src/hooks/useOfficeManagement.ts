import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";
import { useEffect } from "react";

export interface Office {
  id: string;
  tenant_id: string;
  office_name: string;
  office_code: string;
  office_type: string;
  address?: any;
  phone?: string;
  email?: string;
  branch_manager_id?: string;
  is_active: boolean;
  opening_date?: string;
  closing_date?: string;
  office_hours?: any;
  parent_office_id?: string;
  created_at: string;
  updated_at: string;
  branch_manager?: {
    first_name?: string;
    last_name?: string;
    email?: string;
  } | null;
  parent_office?: {
    office_name: string;
  } | null;
}

export interface OfficeStaff {
  id: string;
  office_id: string;
  staff_id: string;
  role_in_office: 'manager' | 'assistant_manager' | 'loan_officer' | 'cashier' | 'staff';
  assigned_date: string;
  end_date?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  staff: {
    first_name?: string;
    last_name?: string;
    email?: string;
  };
  office: {
    office_name: string;
  };
}

export const useOffices = () => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['offices', profile?.tenant_id],
    queryFn: async () => {
      console.log('useOffices queryFn - profile:', profile);
      if (!profile?.tenant_id) {
        console.log('useOffices - No tenant_id, returning empty array');
        return [];
      }

      console.log('useOffices - Making query for tenant_id:', profile.tenant_id);
      const { data, error } = await supabase
        .from('offices')
        .select(`
          *,
          branch_manager:profiles!offices_branch_manager_id_fkey(first_name, last_name, email)
        `)
        .eq('tenant_id', profile.tenant_id)
        .order('created_at', { ascending: false });

      console.log('useOffices - Query result:', { data, error });
      if (error) {
        console.error('useOffices - Query error:', error);
        throw error;
      }
      return data || [];
    },
    enabled: !!profile?.tenant_id,
  });

  // Set up real-time subscription for offices
  useEffect(() => {
    if (!profile?.tenant_id) return;

    const channel = supabase
      .channel('offices-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'offices',
          filter: `tenant_id=eq.${profile.tenant_id}`
        },
        () => {
          // Invalidate and refetch offices data when changes occur
          queryClient.invalidateQueries({ queryKey: ['offices', profile.tenant_id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.tenant_id, queryClient]);

  return query;
};

// Separate hook to get parent office information when needed
export const useParentOffice = (parentOfficeId?: string) => {
  return useQuery({
    queryKey: ['parent-office', parentOfficeId],
    queryFn: async () => {
      if (!parentOfficeId) return null;
      
      const { data, error } = await supabase
        .from('offices')
        .select('office_name')
        .eq('id', parentOfficeId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!parentOfficeId,
  });
};

export const useOfficeStaff = (officeId?: string) => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['office-staff', profile?.tenant_id, officeId],
    queryFn: async () => {
      if (!profile?.tenant_id) return [];

      let query = supabase
        .from('office_staff')
        .select(`
          *,
          staff:profiles!office_staff_staff_id_fkey(first_name, last_name, email),
          office:offices!office_staff_office_id_fkey(office_name)
        `);

      if (officeId) {
        query = query.eq('office_id', officeId);
      }

      const { data, error } = await query
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.tenant_id,
  });

  // Set up real-time subscription for office staff
  useEffect(() => {
    if (!profile?.tenant_id) return;

    const channel = supabase
      .channel('office-staff-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'office_staff'
        },
        () => {
          // Invalidate and refetch office staff data when changes occur
          queryClient.invalidateQueries({ queryKey: ['office-staff'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.tenant_id, queryClient]);

  return query;
};

export const useCreateOffice = () => {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (officeData: {
      office_name: string;
      office_code: string;
      office_type?: 'head_office' | 'branch' | 'sub_branch' | 'collection_center';
      address?: any;
      phone?: string;
      email?: string;
      branch_manager_id?: string;
      is_active?: boolean;
      opening_date?: string;
      closing_date?: string;
      office_hours?: any;
      parent_office_id?: string;
    }) => {
      if (!profile?.tenant_id) throw new Error('No tenant ID available');

      const { data, error } = await supabase
        .from('offices')
        .insert({
          ...officeData,
          tenant_id: profile.tenant_id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offices'] });
      toast({
        title: "Success",
        description: "Office created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create office",
        variant: "destructive",
      });
    },
  });
};

export const useUpdateOffice = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...officeData }: Partial<Office> & { id: string }) => {
      const { data, error } = await supabase
        .from('offices')
        .update(officeData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offices'] });
      toast({
        title: "Success",
        description: "Office updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update office",
        variant: "destructive",
      });
    },
  });
};

export const useDeleteOffice = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('offices')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offices'] });
      toast({
        title: "Success",
        description: "Office deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete office",
        variant: "destructive",
      });
    },
  });
};

export const useAssignStaffToOffice = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (staffData: {
      office_id: string;
      staff_id: string;
      role_in_office?: 'manager' | 'assistant_manager' | 'loan_officer' | 'cashier' | 'staff';
      assigned_date?: string;
      end_date?: string;
      is_active?: boolean;
    }) => {
      const { data, error } = await supabase
        .from('office_staff')
        .insert(staffData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['office-staff'] });
      toast({
        title: "Success",
        description: "Staff assigned to office successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to assign staff to office",
        variant: "destructive",
      });
    },
  });
};

export const useRemoveStaffFromOffice = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('office_staff')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['office-staff'] });
      toast({
        title: "Success",
        description: "Staff removed from office successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove staff from office",
        variant: "destructive",
      });
    },
  });
};