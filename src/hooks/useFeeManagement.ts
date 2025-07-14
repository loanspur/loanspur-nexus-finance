import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface FeeStructure {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;
  fee_type: string;
  calculation_type: string;
  amount: number;
  percentage_rate?: number;
  min_amount?: number;
  max_amount?: number;
  charge_time_type: string;
  charge_payment_by: string;
  is_active: boolean;
  is_overdue_charge: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateFeeStructureData {
  name: string;
  description?: string;
  fee_type: string;
  calculation_type: string;
  amount: number;
  percentage_rate?: number;
  min_amount?: number;
  max_amount?: number;
  charge_time_type: string;
  charge_payment_by: string;
  is_active: boolean;
  is_overdue_charge: boolean;
}

export const useFeeStructures = () => {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['fee-structures', profile?.tenant_id],
    queryFn: async () => {
      if (!profile?.tenant_id) return [];
      
      const { data, error } = await supabase
        .from('fee_structures')
        .select('*')
        .eq('tenant_id', profile.tenant_id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return (data as unknown) as FeeStructure[];
    },
    enabled: !!profile?.tenant_id,
  });
};

export const useCreateFeeStructure = () => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreateFeeStructureData) => {
      if (!profile?.tenant_id || !profile?.id) {
        throw new Error('No tenant or user context');
      }

      const { data: result, error } = await supabase
        .from('fee_structures')
        .insert({
          ...data,
          tenant_id: profile.tenant_id,
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fee-structures'] });
      toast({
        title: "Fee Created",
        description: "Fee structure has been created successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create fee structure. Please try again.",
        variant: "destructive",
      });
      console.error('Error creating fee structure:', error);
    },
  });
};

export const useUpdateFeeStructure = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CreateFeeStructureData> }) => {
      const { data: result, error } = await supabase
        .from('fee_structures')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fee-structures'] });
      toast({
        title: "Fee Updated",
        description: "Fee structure has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update fee structure. Please try again.",
        variant: "destructive",
      });
      console.error('Error updating fee structure:', error);
    },
  });
};

export const useDeleteFeeStructure = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('fee_structures')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fee-structures'] });
      toast({
        title: "Fee Deleted",
        description: "Fee structure has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete fee structure. Please try again.",
        variant: "destructive",
      });
      console.error('Error deleting fee structure:', error);
    },
  });
};