import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useSavingsAccount = (accountId?: string) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!accountId) return;

    const channel = supabase
      .channel(`savings-account-${accountId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'savings_accounts', filter: `id=eq.${accountId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ['savings-account', accountId] });
          queryClient.invalidateQueries({ queryKey: ['savings-accounts'] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'savings_transactions', filter: `savings_account_id=eq.${accountId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ['savings-account', accountId] });
          queryClient.invalidateQueries({ queryKey: ['savings-accounts'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [accountId, queryClient]);

  return useQuery({
    queryKey: ['savings-account', accountId],
    queryFn: async () => {
      if (!accountId) return null;
      const { data, error } = await supabase
        .from('savings_accounts')
        .select(`
          *,
          savings_products ( name, currency_code )
        `)
        .eq('id', accountId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!accountId,
    staleTime: 0,
  });
};
