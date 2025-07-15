import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface PaymentType {
  id: string;
  tenant_id: string;
  name: string;
  code: string;
  description?: string;
  is_cash_payment: boolean;
  is_active: boolean;
  position: number;
  created_at: string;
  updated_at: string;
}

export const usePaymentTypes = () => {
  return useQuery({
    queryKey: ['payment-types'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payment_types')
        .select('*')
        .order('position', { ascending: true });
      
      if (error) throw error;
      return data as PaymentType[];
    },
  });
};

export const useCreatePaymentType = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (paymentType: {
      name: string;
      description?: string;
      is_cash_payment: boolean;
      is_active: boolean;
      position: number;
    }) => {
      // Get tenant_id from the current user
      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .single();
      
      if (!profile?.tenant_id) throw new Error('No tenant found');
      
      // Auto-generate code from name
      const code = paymentType.name.toUpperCase().replace(/\s+/g, '_').replace(/[^A-Z_]/g, '');
      
      const { data, error } = await supabase
        .from('payment_types')
        .insert({ ...paymentType, code, tenant_id: profile.tenant_id })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-types'] });
      toast({
        title: "Success",
        description: "Payment type created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create payment type",
        variant: "destructive",
      });
    },
  });
};

export const useUpdatePaymentType = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PaymentType> & { id: string }) => {
      const { data, error } = await supabase
        .from('payment_types')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-types'] });
      toast({
        title: "Success",
        description: "Payment type updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update payment type",
        variant: "destructive",
      });
    },
  });
};

export const useDeletePaymentType = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('payment_types')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-types'] });
      toast({
        title: "Success",
        description: "Payment type deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete payment type",
        variant: "destructive",
      });
    },
  });
};