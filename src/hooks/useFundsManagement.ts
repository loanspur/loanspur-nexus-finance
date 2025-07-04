import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";

export interface Fund {
  id: string;
  tenant_id: string;
  fund_name: string;
  fund_code: string;
  description?: string;
  fund_type: 'general' | 'loan' | 'savings' | 'operational' | 'reserve';
  currency_id?: string;
  initial_balance: number;
  current_balance: number;
  minimum_balance?: number;
  maximum_balance?: number;
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
  currency?: {
    code: string;
    name: string;
    symbol: string;
  };
}

export interface FundTransaction {
  id: string;
  fund_id: string;
  tenant_id: string;
  transaction_type: 'credit' | 'debit' | 'transfer_in' | 'transfer_out' | 'adjustment';
  amount: number;
  reference_number?: string;
  description: string;
  transaction_date: string;
  processed_by?: string;
  approved_by?: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  related_fund_id?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
  fund?: Fund;
  related_fund?: Fund;
}

export interface FundAllocation {
  id: string;
  fund_id: string;
  tenant_id: string;
  allocation_name: string;
  allocated_amount: number;
  used_amount: number;
  allocation_period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
  fund?: Fund;
}

export const useFunds = () => {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['funds', profile?.tenant_id],
    queryFn: async () => {
      if (!profile?.tenant_id) return [];

      const { data, error } = await supabase
        .from('funds')
        .select(`
          *,
          currency:currencies(code, name, symbol)
        `)
        .eq('tenant_id', profile.tenant_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Fund[];
    },
    enabled: !!profile?.tenant_id,
  });
};

export const useCreateFund = () => {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (fund: Omit<Fund, 'id' | 'tenant_id' | 'created_at' | 'updated_at' | 'created_by'>) => {
      if (!profile?.tenant_id) throw new Error('No tenant ID available');

      const { data, error } = await supabase
        .from('funds')
        .insert({
          ...fund,
          tenant_id: profile.tenant_id,
          created_by: profile.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funds'] });
      toast({
        title: "Success",
        description: "Fund created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create fund",
        variant: "destructive",
      });
    },
  });
};

export const useUpdateFund = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Fund> & { id: string }) => {
      const { data, error } = await supabase
        .from('funds')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funds'] });
      toast({
        title: "Success",
        description: "Fund updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update fund",
        variant: "destructive",
      });
    },
  });
};

export const useFundTransactions = (fundId?: string) => {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['fund-transactions', profile?.tenant_id, fundId],
    queryFn: async () => {
      if (!profile?.tenant_id) return [];

      let query = supabase
        .from('fund_transactions')
        .select(`
          *,
          fund:funds!fund_transactions_fund_id_fkey(fund_name, fund_code),
          related_fund:funds!fund_transactions_related_fund_id_fkey(fund_name, fund_code)
        `)
        .eq('tenant_id', profile.tenant_id)
        .order('created_at', { ascending: false });

      if (fundId) {
        query = query.eq('fund_id', fundId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.tenant_id,
  });
};

export const useCreateFundTransaction = () => {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (transaction: Omit<FundTransaction, 'id' | 'tenant_id' | 'created_at' | 'updated_at' | 'processed_by'>) => {
      if (!profile?.tenant_id) throw new Error('No tenant ID available');

      const { data, error } = await supabase
        .from('fund_transactions')
        .insert({
          ...transaction,
          tenant_id: profile.tenant_id,
          processed_by: profile.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fund-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['funds'] });
      toast({
        title: "Success",
        description: "Transaction created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create transaction",
        variant: "destructive",
      });
    },
  });
};

export const useFundAllocations = (fundId?: string) => {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['fund-allocations', profile?.tenant_id, fundId],
    queryFn: async () => {
      if (!profile?.tenant_id) return [];

      let query = supabase
        .from('fund_allocations')
        .select(`
          *,
          fund:funds(fund_name, fund_code)
        `)
        .eq('tenant_id', profile.tenant_id)
        .order('created_at', { ascending: false });

      if (fundId) {
        query = query.eq('fund_id', fundId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.tenant_id,
  });
};

export const useCreateFundAllocation = () => {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (allocation: Omit<FundAllocation, 'id' | 'tenant_id' | 'created_at' | 'updated_at' | 'created_by'>) => {
      if (!profile?.tenant_id) throw new Error('No tenant ID available');

      const { data, error } = await supabase
        .from('fund_allocations')
        .insert({
          ...allocation,
          tenant_id: profile.tenant_id,
          created_by: profile.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fund-allocations'] });
      toast({
        title: "Success",
        description: "Fund allocation created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create fund allocation",
        variant: "destructive",
      });
    },
  });
};