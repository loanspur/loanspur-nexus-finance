import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { format } from 'date-fns';

export interface AccountingMetrics {
  journalEntriesThisMonth: number;
  activeAccounts: number;
  activityMappings: number;
}

export const useAccountingMetrics = () => {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['accounting-metrics', profile?.tenant_id],
    queryFn: async (): Promise<AccountingMetrics> => {
      if (!profile?.tenant_id) return { journalEntriesThisMonth: 0, activeAccounts: 0, activityMappings: 0 };

      // Date range for current month
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const from = format(startOfMonth, 'yyyy-MM-dd');
      const to = format(now, 'yyyy-MM-dd');

      // Journal entries this month
      const journalRes = await supabase
        .from('journal_entries')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', profile.tenant_id)
        .gte('transaction_date', from)
        .lte('transaction_date', to);
      const journalEntriesThisMonth = journalRes.count || 0;

      // Active chart of accounts
      const coaRes = await supabase
        .from('chart_of_accounts')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', profile.tenant_id)
        .eq('is_active', true);
      const activeAccounts = coaRes.count || 0;

      // Financial activity mappings (best-effort)
      let activityMappings = 0;
      try {
        const famRes = await (supabase as any)
          .from('financial_activity_mappings')
          .select('id', { count: 'exact', head: true })
          .eq('tenant_id', profile.tenant_id);
        activityMappings = famRes?.count || 0;
      } catch {
        activityMappings = 0;
      }

      return { journalEntriesThisMonth, activeAccounts, activityMappings };
    },
    enabled: !!profile?.tenant_id,
    staleTime: 30_000,
  });
};
