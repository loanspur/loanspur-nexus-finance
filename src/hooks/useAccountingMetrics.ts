import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { format } from 'date-fns';

export interface AccountingMetrics {
  journalEntriesThisMonth: number;
  postedEntriesThisMonth: number;
  draftEntriesThisMonth: number;
  netIncomeYTD: number;
  activeAccounts: number;
  activityMappings: number;
}

export const useAccountingMetrics = () => {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['accounting-metrics', profile?.tenant_id],
    queryFn: async (): Promise<AccountingMetrics> => {
      if (!profile?.tenant_id) return { journalEntriesThisMonth: 0, postedEntriesThisMonth: 0, draftEntriesThisMonth: 0, netIncomeYTD: 0, activeAccounts: 0, activityMappings: 0 };

      // Date ranges
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const from = format(startOfMonth, 'yyyy-MM-dd');
      const to = format(now, 'yyyy-MM-dd');
      const startOfYear = format(new Date(now.getFullYear(), 0, 1), 'yyyy-MM-dd');
      const prevYearEnd = format(new Date(now.getFullYear() - 1, 11, 31), 'yyyy-MM-dd');

      // Journal entries this month (all)
      const journalRes = await supabase
        .from('journal_entries')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', profile.tenant_id)
        .gte('transaction_date', from)
        .lte('transaction_date', to);
      const journalEntriesThisMonth = journalRes.count || 0;

      // Posted vs Draft this month
      const postedRes = await supabase
        .from('journal_entries')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', profile.tenant_id)
        .eq('status', 'posted')
        .gte('transaction_date', from)
        .lte('transaction_date', to);
      const postedEntriesThisMonth = postedRes.count || 0;

      let draftEntriesThisMonth = 0;
      try {
        const draftRes = await supabase
          .from('journal_entries')
          .select('id', { count: 'exact', head: true })
          .eq('tenant_id', profile.tenant_id)
          .eq('status', 'draft')
          .gte('transaction_date', from)
          .lte('transaction_date', to);
        draftEntriesThisMonth = draftRes.count || 0;
      } catch {
        draftEntriesThisMonth = 0;
      }

      // Active chart of accounts
      const coaRes = await supabase
        .from('chart_of_accounts')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', profile.tenant_id)
        .eq('is_active', true);
      const activeAccounts = coaRes.count || 0;

      // Net Income YTD
      let netIncomeYTD = 0;
      try {
        const { data: ieAccounts } = await supabase
          .from('chart_of_accounts')
          .select('id, account_type')
          .eq('tenant_id', profile.tenant_id)
          .eq('is_active', true)
          .in('account_type', ['income', 'expense']);

        if (ieAccounts && ieAccounts.length > 0) {
          const deltas = await Promise.all(
            ieAccounts.map(async (acc: any) => {
              const { data: balToday } = await supabase.rpc('calculate_account_balance', { p_account_id: acc.id, p_date: to });
              const { data: balPrev } = await supabase.rpc('calculate_account_balance', { p_account_id: acc.id, p_date: prevYearEnd });
              const todayVal = Number(balToday) || 0;
              const prevVal = Number(balPrev) || 0;
              const delta = todayVal - prevVal;
              return { type: acc.account_type as string, delta };
            })
          );

          const incomeSum = deltas.filter(d => d.type === 'income').reduce((sum, d) => sum + d.delta, 0);
          const expenseSum = deltas.filter(d => d.type === 'expense').reduce((sum, d) => sum + d.delta, 0);
          netIncomeYTD = incomeSum - expenseSum;
        }
      } catch {
        netIncomeYTD = 0;
      }

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

      return { journalEntriesThisMonth, postedEntriesThisMonth, draftEntriesThisMonth, netIncomeYTD, activeAccounts, activityMappings };
    },
    enabled: !!profile?.tenant_id,
    staleTime: 30_000,
  });
};
