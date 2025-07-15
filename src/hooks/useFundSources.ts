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

      // Fetch M-Pesa credentials if available
      const { data: mpesaCredentials } = await supabase
        .from('mpesa_credentials')
        .select('*')
        .eq('tenant_id', profile.tenant_id)
        .eq('is_active', true);

      if (mpesaCredentials) {
        fundSources.push(...mpesaCredentials.map(cred => ({
          id: cred.id,
          name: `M-pesa ${cred.business_short_code ? `Paybill - ${cred.business_short_code}` : 'Till'}`,
          type: 'mpesa' as const,
          details: cred.till_number || cred.business_short_code || undefined
        })));
      }

      // Add some default bank account options (these would ideally come from a bank_accounts table)
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