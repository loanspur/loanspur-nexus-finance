import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface FeeStructure {
  id: string;
  tenant_id: string;
  fee_name: string;
  fee_code: string;
  description?: string;
  fee_type: 'loan' | 'savings' | 'transaction' | 'account';
  product_id?: string;
  calculation_method: 'fixed' | 'percentage' | 'tiered';
  fixed_amount: number;
  percentage_rate: number;
  minimum_fee: number;
  maximum_fee?: number;
  frequency: 'one_time' | 'monthly' | 'quarterly' | 'annually';
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateFeeStructureData {
  fee_name: string;
  fee_code: string;
  description?: string;
  fee_type: 'loan' | 'savings' | 'transaction' | 'account';
  product_id?: string;
  calculation_method: 'fixed' | 'percentage' | 'tiered';
  fixed_amount?: number;
  percentage_rate?: number;
  minimum_fee?: number;
  maximum_fee?: number;
  frequency: 'one_time' | 'monthly' | 'quarterly' | 'annually';
  is_active: boolean;
}

export const useFeeStructures = () => {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['fee-structures', profile?.tenant_id],
    queryFn: async () => {
      if (!profile?.tenant_id) return [];
      
      const { data, error } = await supabase
        .from('fee_structures' as any)
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
        .from('fee_structures' as any)
        .insert({
          ...data,
          tenant_id: profile.tenant_id,
          created_by: profile.id,
          fixed_amount: data.fixed_amount || 0,
          percentage_rate: data.percentage_rate || 0,
          minimum_fee: data.minimum_fee || 0,
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
        .from('fee_structures' as any)
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
        .from('fee_structures' as any)
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