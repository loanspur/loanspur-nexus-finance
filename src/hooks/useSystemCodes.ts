import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export const useSystemCodeCategories = () => {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['system-code-categories', profile?.tenant_id],
    queryFn: async () => {
      if (!profile?.tenant_id) return [];
      
      const { data, error } = await supabase
        .from('system_code_categories')
        .select('*')
        .eq('tenant_id', profile.tenant_id)
        .order('name');
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.tenant_id,
  });
};

export const useSystemCodeValues = (categoryId?: string) => {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['system-code-values', profile?.tenant_id, categoryId],
    queryFn: async () => {
      if (!profile?.tenant_id || !categoryId) return [];
      
      const { data, error } = await supabase
        .from('system_code_values')
        .select('*')
        .eq('tenant_id', profile.tenant_id)
        .eq('category_id', categoryId)
        .order('position', { ascending: true })
        .order('name');
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.tenant_id && !!categoryId,
  });
};

export const useCreateSystemCodeCategory = () => {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      description?: string;
      code_name: string;
    }) => {
      if (!profile?.tenant_id) throw new Error('No tenant ID');

      const { data: result, error } = await supabase
        .from('system_code_categories')
        .insert([{
          ...data,
          tenant_id: profile.tenant_id,
        }])
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-code-categories'] });
      toast({
        title: "Success",
        description: "System code category created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create system code category",
        variant: "destructive",
      });
      console.error('Error creating system code category:', error);
    },
  });
};

export const useUpdateSystemCodeCategory = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: {
      id: string;
      name: string;
      description?: string;
      is_active: boolean;
    }) => {
      const { data: result, error } = await supabase
        .from('system_code_categories')
        .update({
          name: data.name,
          description: data.description,
          is_active: data.is_active,
        })
        .eq('id', data.id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-code-categories'] });
      toast({
        title: "Success",
        description: "System code category updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update system code category",
        variant: "destructive",
      });
      console.error('Error updating system code category:', error);
    },
  });
};

export const useCreateSystemCodeValue = () => {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: {
      category_id: string;
      name: string;
      description?: string;
      code_value: string;
      position?: number;
      is_active?: boolean;
    }) => {
      if (!profile?.tenant_id) throw new Error('No tenant ID');

      const { data: result, error } = await supabase
        .from('system_code_values')
        .insert([{
          ...data,
          tenant_id: profile.tenant_id,
          is_active: true, // Default to active for new values
        }])
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-code-values'] });
      toast({
        title: "Success",
        description: "System code value created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create system code value",
        variant: "destructive",
      });
      console.error('Error creating system code value:', error);
    },
  });
};

export const useUpdateSystemCodeValue = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: {
      id: string;
      name: string;
      description?: string;
      code_value: string;
      position?: number;
      is_active: boolean;
    }) => {
      const { data: result, error } = await supabase
        .from('system_code_values')
        .update({
          name: data.name,
          description: data.description,
          code_value: data.code_value,
          position: data.position,
          is_active: data.is_active,
        })
        .eq('id', data.id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-code-values'] });
      toast({
        title: "Success",
        description: "System code value updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update system code value",
        variant: "destructive",
      });
      console.error('Error updating system code value:', error);
    },
  });
};

export const useDeleteSystemCodeValue = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('system_code_values')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-code-values'] });
      toast({
        title: "Success",
        description: "System code value deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete system code value",
        variant: "destructive",
      });
      console.error('Error deleting system code value:', error);
    },
  });
};