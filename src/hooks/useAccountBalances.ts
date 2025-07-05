import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface AccountBalance {
  id: string;
  tenant_id: string;
  account_id: string;
  balance_date: string;
  opening_balance: number;
  period_debits: number;
  period_credits: number;
  closing_balance: number;
  created_at: string;
  updated_at: string;
  chart_of_accounts: {
    account_code: string;
    account_name: string;
    account_type: string;
    account_category: string;
  };
}

export const useAccountBalances = (balanceDate?: string) => {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['account-balances', profile?.tenant_id, balanceDate],
    queryFn: async () => {
      if (!profile?.tenant_id) return [];

      let query = supabase
        .from('account_balances')
        .select(`
          *,
          chart_of_accounts (
            account_code,
            account_name,
            account_type,
            account_category
          )
        `)
        .eq('tenant_id', profile.tenant_id)
        .order('balance_date', { ascending: false });

      if (balanceDate) {
        query = query.eq('balance_date', balanceDate);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as AccountBalance[];
    },
    enabled: !!profile?.tenant_id,
  });
};

export const useCurrentAccountBalances = () => {
  const { profile } = useAuth();
  
  return useQuery({
    queryKey: ['current-account-balances', profile?.tenant_id],
    queryFn: async () => {
      if (!profile?.tenant_id) return [];

      const { data, error } = await supabase
        .from('chart_of_accounts')
        .select('*')
        .eq('tenant_id', profile.tenant_id)
        .eq('is_active', true)
        .order('account_code');

      if (error) throw error;
      return data;
    },
    enabled: !!profile?.tenant_id,
  });
};