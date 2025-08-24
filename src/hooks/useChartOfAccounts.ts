import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { useEffect } from 'react';

export interface ChartOfAccount {
  id: string;
  tenant_id: string;
  account_code: string;
  account_name: string;
  account_type: string;
  account_category: string;
  parent_account_id?: string;
  description?: string;
  balance: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useChartOfAccounts = () => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  // Real-time subscription for chart of accounts
  useEffect(() => {
    if (!profile?.tenant_id) return;

    const channel = supabase
      .channel('chart-of-accounts-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chart_of_accounts',
          filter: `tenant_id=eq.${profile.tenant_id}`
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['chart-of-accounts'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.tenant_id, queryClient]);

  return useQuery({
    queryKey: ['chart-of-accounts', profile?.tenant_id],
    queryFn: async () => {
      if (!profile?.tenant_id) return [];

      const { data, error } = await supabase
        .from('chart_of_accounts')
        .select('*')
        .eq('tenant_id', profile.tenant_id)
        .order('account_code', { ascending: true });

      if (error) throw error;
      return data as ChartOfAccount[];
    },
    enabled: !!profile?.tenant_id,
  });
};

export const useCreateAccount = () => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: {
      account_code: string;
      account_name: string;
      account_type: string;
      account_category: string;
      parent_account_id?: string;
      description?: string;
    }) => {
      if (!profile?.tenant_id) {
        throw new Error('No tenant context');
      }

      const { data: result, error } = await supabase
        .from('chart_of_accounts')
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
      queryClient.invalidateQueries({ queryKey: ['chart-of-accounts'] });
      toast({
        title: "Account Created",
        description: "Chart of account has been created successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create account.",
        variant: "destructive",
      });
    },
  });
};

export const useUpdateAccount = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<ChartOfAccount> & { id: string }) => {
      const { data: result, error } = await supabase
        .from('chart_of_accounts')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chart-of-accounts'] });
      toast({
        title: "Account Updated",
        description: "Chart of account has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update account.",
        variant: "destructive",
      });
    },
  });
};

export const useDeleteAccount = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('chart_of_accounts')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chart-of-accounts'] });
      toast({
        title: "Account Deleted",
        description: "Chart of account has been deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete account.",
        variant: "destructive",
      });
    },
  });
};