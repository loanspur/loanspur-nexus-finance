import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface GlobalIntegration {
  id: string;
  integration_type: 'sms' | 'whatsapp';
  provider_name: string;
  display_name: string;
  configuration: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface TenantIntegrationPreference {
  id: string;
  tenant_id: string;
  integration_id: string;
  integration_type: 'sms' | 'whatsapp';
  is_primary: boolean;
  tenant_specific_config: Record<string, any>;
  created_at: string;
  updated_at: string;
  global_integrations?: GlobalIntegration;
}

// Global Integrations hooks
export const useGlobalIntegrations = () => {
  return useQuery({
    queryKey: ['global-integrations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('global_integrations')
        .select('*')
        .order('integration_type', { ascending: true })
        .order('display_name', { ascending: true });
      
      if (error) throw error;
      return data as GlobalIntegration[];
    },
  });
};

export const useCreateGlobalIntegration = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (integration: Omit<GlobalIntegration, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('global_integrations')
        .insert([integration])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['global-integrations'] });
      toast({
        title: "Success",
        description: "Integration created successfully",
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

export const useUpdateGlobalIntegration = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<GlobalIntegration> & { id: string }) => {
      const { data, error } = await supabase
        .from('global_integrations')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['global-integrations'] });
      toast({
        title: "Success",
        description: "Integration updated successfully",
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

export const useDeleteGlobalIntegration = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('global_integrations')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['global-integrations'] });
      toast({
        title: "Success",
        description: "Integration deleted successfully",
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

// Tenant Integration Preferences hooks
export const useTenantIntegrationPreferences = (tenantId?: string) => {
  return useQuery({
    queryKey: ['tenant-integration-preferences', tenantId],
    queryFn: async () => {
      const query = supabase
        .from('tenant_integration_preferences')
        .select(`
          *,
          global_integrations (*)
        `)
        .order('integration_type', { ascending: true });

      if (tenantId) {
        query.eq('tenant_id', tenantId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as TenantIntegrationPreference[];
    },
    enabled: !!tenantId,
  });
};

export const useCreateTenantIntegrationPreference = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (preference: Omit<TenantIntegrationPreference, 'id' | 'created_at' | 'updated_at' | 'global_integrations'>) => {
      const { data, error } = await supabase
        .from('tenant_integration_preferences')
        .insert([preference])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-integration-preferences'] });
      toast({
        title: "Success",
        description: "Integration preference saved successfully",
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

export const useUpdateTenantIntegrationPreference = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<TenantIntegrationPreference> & { id: string }) => {
      const { data, error } = await supabase
        .from('tenant_integration_preferences')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-integration-preferences'] });
      toast({
        title: "Success",
        description: "Integration preference updated successfully",
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