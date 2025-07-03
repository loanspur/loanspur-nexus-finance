import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface DashboardStats {
  totalClients: number;
  activeLoans: number;
  totalPortfolio: number;
  savingsAccounts: number;
  monthlyDisbursements: number;
  collectionsThisMonth: number;
  arrearsRate: number;
  portfolioAtRisk: number;
}

interface ChartData {
  month: string;
  outstanding: number;
  disbursed: number;
  target?: number;
  actual?: number;
  arrears?: number;
  writeoffs?: number;
}

interface PortfolioDistribution {
  name: string;
  value: number;
}

// Generate mock data for charts (in real app, this would come from database)
const generateMockChartData = (): {
  loanTrends: ChartData[];
  portfolioDistribution: PortfolioDistribution[];
  monthlyPerformance: ChartData[];
  riskAnalysis: ChartData[];
} => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  
  const loanTrends = months.map((month, index) => ({
    month,
    outstanding: 150000 + (index * 25000) + Math.random() * 10000,
    disbursed: 45000 + (index * 8000) + Math.random() * 5000,
  }));

  const portfolioDistribution = [
    { name: 'Individual Loans', value: 450000 },
    { name: 'Group Loans', value: 280000 },
    { name: 'SME Loans', value: 180000 },
    { name: 'Emergency Loans', value: 90000 },
  ];

  const monthlyPerformance = months.map((month, index) => ({
    month,
    target: 35000 + (index * 3000),
    actual: 32000 + (index * 3500) + Math.random() * 5000,
    outstanding: 0,
    disbursed: 0,
  }));

  const riskAnalysis = months.map((month, index) => ({
    month,
    arrears: 2.5 + Math.random() * 1.5,
    writeoffs: 0.5 + Math.random() * 0.8,
    outstanding: 0,
    disbursed: 0,
  }));

  return { loanTrends, portfolioDistribution, monthlyPerformance, riskAnalysis };
};

export const useDashboardData = () => {
  const { profile } = useAuth();

  // Get dashboard statistics
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats', profile?.tenant_id],
    queryFn: async (): Promise<DashboardStats> => {
      if (!profile?.tenant_id && profile?.role !== 'super_admin') {
        throw new Error('No tenant access');
      }

      // For super admin, get system-wide stats
      if (profile?.role === 'super_admin') {
        const [clientsResult, loansResult, savingsResult] = await Promise.all([
          supabase.from('clients').select('id', { count: 'exact' }),
          supabase.from('loans').select('id, principal_amount, outstanding_balance'),
          supabase.from('savings_accounts').select('id', { count: 'exact' }),
        ]);

        const totalPortfolio = loansResult.data?.reduce((sum, loan) => 
          sum + (loan.outstanding_balance || 0), 0) || 0;

        return {
          totalClients: clientsResult.count || 0,
          activeLoans: loansResult.data?.length || 0,
          totalPortfolio,
          savingsAccounts: savingsResult.count || 0,
          monthlyDisbursements: 0,
          collectionsThisMonth: 0,
          arrearsRate: 0,
          portfolioAtRisk: 0,
        };
      }

      // For tenant users, get tenant-specific stats
      const [clientsResult, loansResult, savingsResult] = await Promise.all([
        supabase
          .from('clients')
          .select('id', { count: 'exact' })
          .eq('tenant_id', profile.tenant_id),
        supabase
          .from('loans')
          .select('id, principal_amount, outstanding_balance')
          .eq('tenant_id', profile.tenant_id),
        supabase
          .from('savings_accounts')
          .select('id', { count: 'exact' })
          .eq('tenant_id', profile.tenant_id),
      ]);

      const totalPortfolio = loansResult.data?.reduce((sum, loan) => 
        sum + (loan.outstanding_balance || 0), 0) || 0;

      return {
        totalClients: clientsResult.count || 0,
        activeLoans: loansResult.data?.length || 0,
        totalPortfolio,
        savingsAccounts: savingsResult.count || 0,
        monthlyDisbursements: 0,
        collectionsThisMonth: 0,
        arrearsRate: 0,
        portfolioAtRisk: 0,
      };
    },
    enabled: !!profile,
  });

  // Get recent activities
  const { data: recentActivities, isLoading: activitiesLoading } = useQuery({
    queryKey: ['recent-activities', profile?.tenant_id],
    queryFn: async () => {
      if (!profile?.tenant_id && profile?.role !== 'super_admin') {
        return [];
      }

      const query = supabase
        .from('transactions')
        .select(`
          id,
          transaction_type,
          amount,
          created_at,
          clients(first_name, last_name)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      if (profile?.role !== 'super_admin') {
        query.eq('tenant_id', profile.tenant_id);
      }

      const { data } = await query;
      return data || [];
    },
    enabled: !!profile,
  });

  // Get chart data (mock for now)
  const chartData = generateMockChartData();

  return {
    stats,
    recentActivities,
    chartData,
    isLoading: statsLoading || activitiesLoading,
  };
};

export const useClientDashboardData = () => {
  const { profile, user } = useAuth();

  return useQuery({
    queryKey: ['client-dashboard', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('No user ID');

      // Get client data
      const { data: client } = await supabase
        .from('clients')
        .select('*')
        .eq('email', user.email)
        .single();

      if (!client) throw new Error('Client not found');

      // Get client loans
      const { data: loans } = await supabase
        .from('loans')
        .select('*')
        .eq('client_id', client.id);

      // Get client savings accounts
      const { data: savingsAccounts } = await supabase
        .from('savings_accounts')
        .select('*')
        .eq('client_id', client.id);

      // Get recent transactions
      const { data: transactions } = await supabase
        .from('transactions')
        .select('*')
        .eq('client_id', client.id)
        .order('created_at', { ascending: false })
        .limit(10);

      const totalLoanBalance = loans?.reduce((sum, loan) => 
        sum + (loan.outstanding_balance || 0), 0) || 0;

      const totalSavingsBalance = savingsAccounts?.reduce((sum, account) => 
        sum + (account.account_balance || 0), 0) || 0;

      const nextPayment = loans?.find(loan => loan.next_repayment_amount)?.next_repayment_amount || 0;
      const nextPaymentDate = loans?.find(loan => loan.next_repayment_date)?.next_repayment_date;

      return {
        client,
        loans: loans || [],
        savingsAccounts: savingsAccounts || [],
        transactions: transactions || [],
        summary: {
          totalLoanBalance,
          totalSavingsBalance,
          nextPayment,
          nextPaymentDate,
          repaymentRate: client.timely_repayment_rate || 0,
        },
      };
    },
    enabled: !!user?.id && profile?.role === 'client',
  });
};