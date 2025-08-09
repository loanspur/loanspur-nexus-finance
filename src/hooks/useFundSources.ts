import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface FundSource {
  id: string;
  name: string;
  type: 'fund' | 'bank_account' | 'mpesa';
  details?: string;
}

export const useFundSources = () => {
  return useQuery({
    queryKey: ['fund-sources'],
    queryFn: async () => {
      const fundSources: FundSource[] = [];

      // Get current user's tenant
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return fundSources;

      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('user_id', user.id)
        .single();

      if (!profile?.tenant_id) return fundSources;

      // Fetch all active asset accounts for this tenant (full list for fund source mapping)
      const { data: assetAccounts } = await supabase
        .from('chart_of_accounts')
        .select('*')
        .eq('tenant_id', profile.tenant_id)
        .eq('account_type', 'asset')
        .eq('is_active', true);

      if (assetAccounts) {
        fundSources.push(...assetAccounts.map(account => ({
          id: account.id,
          name: `${account.account_code} - ${account.account_name}`,
          type: 'bank_account' as const,
          details: account.description || undefined
        })));
      }

      return fundSources;
    },
  });
};