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

      // Fetch funds
      const { data: funds } = await supabase
        .from('funds')
        .select('*')
        .eq('tenant_id', profile.tenant_id)
        .eq('is_active', true);

      if (funds) {
        fundSources.push(...funds.map(fund => ({
          id: fund.id,
          name: `${fund.fund_name} (${fund.fund_code})`,
          type: 'fund' as const,
          details: fund.description || undefined
        })));
      }

      // Fetch M-Pesa configurations if available (use correct table name)
      const { data: mpesaConfigs } = await supabase
        .from('tenant_mpesa_config')
        .select('*')
        .eq('tenant_id', profile.tenant_id)
        .eq('is_active', true);

      if (mpesaConfigs) {
        fundSources.push(...mpesaConfigs.map(config => ({
          id: config.id,
          name: `M-Pesa ${config.business_short_code ? `Paybill - ${config.business_short_code}` : 'Configuration'}`,
          type: 'mpesa' as const,
          details: config.business_short_code || undefined
        })));
      }

      // Add default bank account options
      const defaultBankAccounts = [
        "Equity Bank Account",
        "KCB Bank Account", 
        "NCBA Bank Account",
        "ABSA Bank Account",
        "Cooperative Bank Account",
        "Family Bank Account"
      ];

      fundSources.push(...defaultBankAccounts.map(bank => ({
        id: `bank_${bank.toLowerCase().replace(/\s+/g, '_')}`,
        name: bank,
        type: 'bank_account' as const
      })));

      return fundSources;
    },
  });
};