import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";

export interface ClientOfficeAssignment {
  id: string;
  client_id: string;
  office_id: string;
  assigned_date: string;
  assigned_by?: string;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
  office?: {
    office_name: string;
    office_code: string;
    office_type: string;
  };
  client?: {
    first_name: string;
    last_name: string;
    client_number: string;
  };
}

export const useClientOfficeAssignments = (clientId?: string) => {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['client-office-assignments', profile?.tenant_id, clientId],
    queryFn: async () => {
      if (!profile?.tenant_id) return [];

      let query = supabase
        .from('client_office_assignments')
        .select(`
          *,
          office:offices(office_name, office_code, office_type),
          client:clients(first_name, last_name, client_number)
        `);

      if (clientId) {
        query = query.eq('client_id', clientId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.tenant_id,
  });
};

export const useAssignClientToOffice = () => {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (assignmentData: {
      client_id: string;
      office_id: string;
      is_primary?: boolean;
      assigned_date?: string;
    }) => {
      if (!profile?.id) throw new Error('No user profile available');

      const { data, error } = await supabase
        .from('client_office_assignments')
        .insert({
          ...assignmentData,
          assigned_by: profile.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-office-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast({
        title: "Success",
        description: "Client assigned to office successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to assign client to office",
        variant: "destructive",
      });
    },
  });
};

export const useRemoveClientFromOffice = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (assignmentId: string) => {
      const { error } = await supabase
        .from('client_office_assignments')
        .delete()
        .eq('id', assignmentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-office-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast({
        title: "Success",
        description: "Client removed from office successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove client from office",
        variant: "destructive",
      });
    },
  });
};