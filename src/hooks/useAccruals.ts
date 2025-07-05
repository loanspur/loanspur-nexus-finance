import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface Accrual {
  id: string;
  tenant_id: string;
  accrual_name: string;
  description?: string;
  accrual_type: string;
  amount: number;
  accrual_date: string;
  reversal_date?: string;
  account_id: string;
  contra_account_id: string;
  journal_entry_id?: string;
  reversal_entry_id?: string;
  status: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  account: {
    account_code: string;
    account_name: string;
  };
  contra_account: {
    account_code: string;
    account_name: string;
  };
}

export const useAccruals = () => {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['accruals', profile?.tenant_id],
    queryFn: async () => {
      if (!profile?.tenant_id) return [];

      const { data: accrualsData, error: accrualsError } = await supabase
        .from('accruals')
        .select('*')
        .eq('tenant_id', profile.tenant_id)
        .order('accrual_date', { ascending: false });

      if (accrualsError) throw accrualsError;

      if (!accrualsData || accrualsData.length === 0) return [];

      // Get account information for all accounts used in accruals
      const accountIds = [
        ...new Set([
          ...accrualsData.map(a => a.account_id),
          ...accrualsData.map(a => a.contra_account_id)
        ])
      ];

      const { data: accountsData, error: accountsError } = await supabase
        .from('chart_of_accounts')
        .select('id, account_code, account_name')
        .in('id', accountIds);

      if (accountsError) throw accountsError;

      // Create a map for quick account lookup
      const accountsMap = (accountsData || []).reduce((acc, account) => {
        acc[account.id] = account;
        return acc;
      }, {} as Record<string, { id: string; account_code: string; account_name: string }>);

      // Combine the data
      const enrichedAccruals = accrualsData.map(accrual => ({
        ...accrual,
        account: accountsMap[accrual.account_id] || { account_code: '', account_name: 'Unknown Account' },
        contra_account: accountsMap[accrual.contra_account_id] || { account_code: '', account_name: 'Unknown Account' }
      }));

      return enrichedAccruals as Accrual[];
    },
    enabled: !!profile?.tenant_id,
  });
};

export const useCreateAccrual = () => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: {
      accrual_name: string;
      description?: string;
      accrual_type: string;
      amount: number;
      accrual_date: string;
      reversal_date?: string;
      account_id: string;
      contra_account_id: string;
    }) => {
      if (!profile?.tenant_id) {
        throw new Error('No tenant context');
      }

      const { data: result, error } = await supabase
        .from('accruals')
        .insert({
          ...data,
          tenant_id: profile.tenant_id,
          created_by: profile.id,
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accruals'] });
      toast({
        title: "Accrual Created",
        description: "Accrual has been created successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create accrual.",
        variant: "destructive",
      });
    },
  });
};

export const useUpdateAccrual = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Accrual> & { id: string }) => {
      const { data: result, error } = await supabase
        .from('accruals')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accruals'] });
      toast({
        title: "Accrual Updated",
        description: "Accrual has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update accrual.",
        variant: "destructive",
      });
    },
  });
};

export const useDeleteAccrual = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('accruals')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accruals'] });
      toast({
        title: "Accrual Deleted",
        description: "Accrual has been deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete accrual.",
        variant: "destructive",
      });
    },
  });
};

export const usePostAccrual = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data: result, error } = await supabase
        .from('accruals')
        .update({ status: 'posted' })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accruals'] });
      toast({
        title: "Accrual Posted",
        description: "Accrual has been posted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to post accrual.",
        variant: "destructive",
      });
    },
  });
};

export const useReverseAccrual = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data: result, error } = await supabase
        .from('accruals')
        .update({ 
          status: 'reversed',
          reversal_date: new Date().toISOString().split('T')[0]
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accruals'] });
      toast({
        title: "Accrual Reversed",
        description: "Accrual has been reversed successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reverse accrual.",
        variant: "destructive",
      });
    },
  });
};