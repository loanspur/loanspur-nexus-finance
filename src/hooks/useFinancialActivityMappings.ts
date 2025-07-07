import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface FinancialActivityMapping {
  id: string;
  tenant_id: string;
  activity_name: string;
  activity_code: string;
  description?: string;
  account_id: string;
  mapping_type: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  account: {
    account_code: string;
    account_name: string;
    account_type: string;
  };
}

export const useFinancialActivityMappings = () => {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['financial-activity-mappings', profile?.tenant_id],
    queryFn: async () => {
      if (!profile?.tenant_id) return [];

      // Since we don't have a financial_activity_mappings table yet,
      // we'll create a mock structure that can be easily replaced
      // when the actual table is created
      return [] as FinancialActivityMapping[];
    },
    enabled: !!profile?.tenant_id,
  });
};

export const useCreateFinancialActivityMapping = () => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: {
      activity_name: string;
      activity_code: string;
      description?: string;
      account_id: string;
      mapping_type: string;
    }) => {
      if (!profile?.tenant_id) {
        throw new Error('No tenant context');
      }

      // Mock implementation - replace with actual supabase call when table exists
      const mockMapping: FinancialActivityMapping = {
        id: crypto.randomUUID(),
        tenant_id: profile.tenant_id,
        ...data,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        account: {
          account_code: '',
          account_name: 'Unknown Account',
          account_type: ''
        }
      };

      return mockMapping;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-activity-mappings'] });
      toast({
        title: "Mapping Created",
        description: "Financial activity mapping has been created successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create mapping.",
        variant: "destructive",
      });
    },
  });
};

export const useUpdateFinancialActivityMapping = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<FinancialActivityMapping> & { id: string }) => {
      // Mock implementation - replace with actual supabase call when table exists
      return { id, ...data };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-activity-mappings'] });
      toast({
        title: "Mapping Updated",
        description: "Financial activity mapping has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update mapping.",
        variant: "destructive",
      });
    },
  });
};

export const useDeleteFinancialActivityMapping = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      // Mock implementation - replace with actual supabase call when table exists
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financial-activity-mappings'] });
      toast({
        title: "Mapping Deleted",
        description: "Financial activity mapping has been deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete mapping.",
        variant: "destructive",
      });
    },
  });
};