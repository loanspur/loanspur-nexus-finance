import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "@/hooks/use-toast";

export interface FinancialReport {
  id: string;
  tenant_id: string;
  report_type: 'balance_sheet' | 'profit_loss' | 'cash_flow' | 'portfolio_analysis' | 'loan_aging' | 'regulatory_cbk' | 'custom';
  report_name: string;
  report_config: any;
  generated_by?: string;
  report_data?: any;
  report_period_start: string;
  report_period_end: string;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  file_url?: string;
  created_at: string;
  updated_at: string;
}

export interface ChartOfAccount {
  id: string;
  tenant_id: string;
  account_code: string;
  account_name: string;
  account_type: 'asset' | 'liability' | 'equity' | 'income' | 'expense';
  account_category: string;
  parent_account_id?: string;
  is_active: boolean;
  balance: number;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface JournalEntry {
  id: string;
  tenant_id: string;
  entry_number: string;
  transaction_date: string;
  description: string;
  reference_type?: 'loan_disbursement' | 'loan_payment' | 'savings_deposit' | 'savings_withdrawal' | 'fee_collection' | 'manual';
  reference_id?: string;
  total_amount: number;
  created_by?: string;
  approved_by?: string;
  approved_at?: string;
  status: 'draft' | 'posted' | 'reversed';
  created_at: string;
  updated_at: string;
  journal_entry_lines?: JournalEntryLine[];
}

export interface JournalEntryLine {
  id: string;
  journal_entry_id: string;
  account_id: string;
  debit_amount: number;
  credit_amount: number;
  description?: string;
  created_at: string;
  chart_of_accounts?: ChartOfAccount;
}

export interface PortfolioAnalysis {
  id: string;
  tenant_id: string;
  analysis_date: string;
  total_portfolio_value: number;
  active_loans: number;
  overdue_loans: number;
  par_30: number;
  par_90: number;
  write_off_ratio: number;
  average_loan_size: number;
  yield_on_portfolio: number;
  analysis_data?: any;
  created_at: string;
}

export interface CustomReportTemplate {
  id: string;
  tenant_id: string;
  template_name: string;
  description?: string;
  report_query: any;
  columns_config: any;
  filters_config?: any;
  chart_config?: any;
  is_public: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export const useFinancialReporting = () => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);

  // Financial Reports Management
  const generateFinancialReport = async (
    reportType: FinancialReport['report_type'],
    reportName: string,
    periodStart: string,
    periodEnd: string,
    config: any = {}
  ): Promise<FinancialReport | null> => {
    if (!profile?.tenant_id || !profile?.id) return null;
    
    setLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('financial_reports')
        .insert({
          tenant_id: profile.tenant_id,
          report_type: reportType,
          report_name: reportName,
          report_config: config,
          generated_by: profile.id,
          report_period_start: periodStart,
          report_period_end: periodEnd,
          status: 'generating'
        })
        .select()
        .single();

      if (error) throw error;

      // Start background generation
      await generateReportData(data.id, reportType, periodStart, periodEnd);

      toast({
        title: "Success",
        description: "Financial report generation started",
      });

      return data as FinancialReport;
    } catch (error) {
      console.error('Error generating financial report:', error);
      toast({
        title: "Error",
        description: "Failed to generate financial report",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const fetchFinancialReports = async (): Promise<FinancialReport[]> => {
    if (!profile?.tenant_id) return [];
    
    const { data, error } = await supabase
      .from('financial_reports')
      .select('*')
      .eq('tenant_id', profile.tenant_id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching financial reports:', error);
      return [];
    }

    return (data || []) as FinancialReport[];
  };

  // Chart of Accounts Management
  const fetchChartOfAccounts = async (): Promise<ChartOfAccount[]> => {
    if (!profile?.tenant_id) return [];
    
    const { data, error } = await supabase
      .from('chart_of_accounts')
      .select('*')
      .eq('tenant_id', profile.tenant_id)
      .eq('is_active', true)
      .order('account_code');

    if (error) {
      console.error('Error fetching chart of accounts:', error);
      return [];
    }

    return (data || []) as ChartOfAccount[];
  };

  const createAccount = async (
    accountCode: string,
    accountName: string,
    accountType: ChartOfAccount['account_type'],
    accountCategory: string,
    description?: string,
    parentAccountId?: string
  ): Promise<ChartOfAccount | null> => {
    if (!profile?.tenant_id) return null;
    
    setLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('chart_of_accounts')
        .insert({
          tenant_id: profile.tenant_id,
          account_code: accountCode,
          account_name: accountName,
          account_type: accountType,
          account_category: accountCategory,
          parent_account_id: parentAccountId,
          description
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Account created successfully",
      });

      return data as ChartOfAccount;
    } catch (error) {
      console.error('Error creating account:', error);
      toast({
        title: "Error",
        description: "Failed to create account",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Journal Entries Management
  const fetchJournalEntries = async (): Promise<JournalEntry[]> => {
    if (!profile?.tenant_id) return [];
    
    const { data, error } = await supabase
      .from('journal_entries')
      .select(`
        *,
        journal_entry_lines (
          *,
          chart_of_accounts (*)
        )
      `)
      .eq('tenant_id', profile.tenant_id)
      .order('transaction_date', { ascending: false });

    if (error) {
      console.error('Error fetching journal entries:', error);
      return [];
    }

    return (data || []) as JournalEntry[];
  };

  const createJournalEntry = async (
    entryNumber: string,
    transactionDate: string,
    description: string,
    lines: Omit<JournalEntryLine, 'id' | 'journal_entry_id' | 'created_at' | 'chart_of_accounts'>[],
    referenceType?: JournalEntry['reference_type'],
    referenceId?: string
  ): Promise<JournalEntry | null> => {
    if (!profile?.tenant_id || !profile?.id) return null;
    
    setLoading(true);
    
    try {
      // Calculate total amount
      const totalAmount = lines.reduce((sum, line) => sum + Math.max(line.debit_amount, line.credit_amount), 0);

      // Validate debits equal credits
      const totalDebits = lines.reduce((sum, line) => sum + line.debit_amount, 0);
      const totalCredits = lines.reduce((sum, line) => sum + line.credit_amount, 0);
      
      if (Math.abs(totalDebits - totalCredits) > 0.01) {
        throw new Error('Journal entry must balance: debits must equal credits');
      }

      const { data: journalEntry, error: entryError } = await supabase
        .from('journal_entries')
        .insert({
          tenant_id: profile.tenant_id,
          entry_number: entryNumber,
          transaction_date: transactionDate,
          description,
          reference_type: referenceType,
          reference_id: referenceId,
          total_amount: totalAmount,
          created_by: profile.id,
          status: 'posted'
        })
        .select()
        .single();

      if (entryError) throw entryError;

      // Insert journal entry lines
      const { error: linesError } = await supabase
        .from('journal_entry_lines')
        .insert(
          lines.map(line => ({
            journal_entry_id: journalEntry.id,
            ...line
          }))
        );

      if (linesError) throw linesError;

      toast({
        title: "Success",
        description: "Journal entry created successfully",
      });

      return journalEntry as JournalEntry;
    } catch (error) {
      console.error('Error creating journal entry:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create journal entry",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Portfolio Analysis
  const generatePortfolioAnalysis = async (analysisDate: string): Promise<PortfolioAnalysis | null> => {
    if (!profile?.tenant_id) return null;
    
    setLoading(true);
    
    try {
      // Calculate portfolio metrics
      const { data: loans, error: loansError } = await supabase
        .from('loans')
        .select('*')
        .eq('tenant_id', profile.tenant_id);

      if (loansError) throw loansError;

      const activeLoans = loans?.filter(loan => loan.status === 'active') || [];
      const totalPortfolioValue = activeLoans.reduce((sum, loan) => sum + (loan.outstanding_balance || 0), 0);
      const overdueLoans = activeLoans.filter(loan => (loan.total_overdue_amount || 0) > 0);
      
      // Calculate PAR (Portfolio at Risk)
      const par30Loans = activeLoans.filter(loan => {
        // This would need more sophisticated logic to calculate days overdue
        return (loan.total_overdue_amount || 0) > 0;
      });
      
      const par30 = par30Loans.reduce((sum, loan) => sum + (loan.outstanding_balance || 0), 0);
      const par90 = par30; // Simplified - would need proper calculation
      
      const averageLoanSize = activeLoans.length > 0 ? totalPortfolioValue / activeLoans.length : 0;
      
      const analysisData = {
        loan_distribution: activeLoans.map(loan => ({
          id: loan.id,
          outstanding_balance: loan.outstanding_balance,
          overdue_amount: loan.total_overdue_amount,
          status: loan.status
        })),
        risk_analysis: {
          par_30_percentage: totalPortfolioValue > 0 ? (par30 / totalPortfolioValue) * 100 : 0,
          par_90_percentage: totalPortfolioValue > 0 ? (par90 / totalPortfolioValue) * 100 : 0
        }
      };

      const { data, error } = await supabase
        .from('portfolio_analysis')
        .upsert({
          tenant_id: profile.tenant_id,
          analysis_date: analysisDate,
          total_portfolio_value: totalPortfolioValue,
          active_loans: activeLoans.length,
          overdue_loans: overdueLoans.length,
          par_30: par30,
          par_90: par90,
          write_off_ratio: 0, // Would need historical data
          average_loan_size: averageLoanSize,
          yield_on_portfolio: 0, // Would need interest calculations
          analysis_data: analysisData
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Portfolio analysis generated successfully",
      });

      return data as PortfolioAnalysis;
    } catch (error) {
      console.error('Error generating portfolio analysis:', error);
      toast({
        title: "Error",
        description: "Failed to generate portfolio analysis",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const fetchPortfolioAnalysis = async (): Promise<PortfolioAnalysis[]> => {
    if (!profile?.tenant_id) return [];
    
    const { data, error } = await supabase
      .from('portfolio_analysis')
      .select('*')
      .eq('tenant_id', profile.tenant_id)
      .order('analysis_date', { ascending: false });

    if (error) {
      console.error('Error fetching portfolio analysis:', error);
      return [];
    }

    return (data || []) as PortfolioAnalysis[];
  };

  // Custom Report Templates
  const fetchCustomReportTemplates = async (): Promise<CustomReportTemplate[]> => {
    if (!profile?.tenant_id) return [];
    
    const { data, error } = await supabase
      .from('custom_report_templates')
      .select('*')
      .eq('tenant_id', profile.tenant_id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching custom report templates:', error);
      return [];
    }

    return (data || []) as CustomReportTemplate[];
  };

  const createCustomReportTemplate = async (
    templateName: string,
    description: string,
    reportQuery: any,
    columnsConfig: any,
    filtersConfig?: any,
    chartConfig?: any
  ): Promise<CustomReportTemplate | null> => {
    if (!profile?.tenant_id || !profile?.id) return null;
    
    setLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('custom_report_templates')
        .insert({
          tenant_id: profile.tenant_id,
          template_name: templateName,
          description,
          report_query: reportQuery,
          columns_config: columnsConfig,
          filters_config: filtersConfig,
          chart_config: chartConfig,
          created_by: profile.id
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Custom report template created successfully",
      });

      return data as CustomReportTemplate;
    } catch (error) {
      console.error('Error creating custom report template:', error);
      toast({
        title: "Error",
        description: "Failed to create custom report template",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Helper function to generate report data
  const generateReportData = async (reportId: string, reportType: string, periodStart: string, periodEnd: string) => {
    try {
      let reportData: any = {};

      switch (reportType) {
        case 'balance_sheet':
          reportData = await generateBalanceSheet(periodEnd);
          break;
        case 'profit_loss':
          reportData = await generateProfitLoss(periodStart, periodEnd);
          break;
        case 'cash_flow':
          reportData = await generateCashFlow(periodStart, periodEnd);
          break;
        case 'loan_aging':
          reportData = await generateLoanAging(periodEnd);
          break;
        default:
          reportData = { message: 'Report type not implemented yet' };
      }

      await supabase
        .from('financial_reports')
        .update({
          status: 'completed',
          report_data: reportData
        })
        .eq('id', reportId);

    } catch (error) {
      console.error('Error generating report data:', error);
      await supabase
        .from('financial_reports')
        .update({ status: 'failed' })
        .eq('id', reportId);
    }
  };

  const generateBalanceSheet = async (asOfDate: string) => {
    if (!profile?.tenant_id) return {};

    const { data: accounts } = await supabase
      .from('chart_of_accounts')
      .select('*')
      .eq('tenant_id', profile.tenant_id)
      .eq('is_active', true);

    const assets = accounts?.filter(acc => acc.account_type === 'asset') || [];
    const liabilities = accounts?.filter(acc => acc.account_type === 'liability') || [];
    const equity = accounts?.filter(acc => acc.account_type === 'equity') || [];

    return {
      as_of_date: asOfDate,
      assets: {
        current_assets: assets.filter(acc => acc.account_category === 'current_assets'),
        non_current_assets: assets.filter(acc => acc.account_category === 'non_current_assets'),
        total_assets: assets.reduce((sum, acc) => sum + acc.balance, 0)
      },
      liabilities: {
        current_liabilities: liabilities.filter(acc => acc.account_category === 'current_liabilities'),
        non_current_liabilities: liabilities.filter(acc => acc.account_category === 'non_current_liabilities'),
        total_liabilities: liabilities.reduce((sum, acc) => sum + acc.balance, 0)
      },
      equity: {
        equity_accounts: equity,
        total_equity: equity.reduce((sum, acc) => sum + acc.balance, 0)
      }
    };
  };

  const generateProfitLoss = async (periodStart: string, periodEnd: string) => {
    if (!profile?.tenant_id) return {};

    const { data: accounts } = await supabase
      .from('chart_of_accounts')
      .select('*')
      .eq('tenant_id', profile.tenant_id)
      .eq('is_active', true);

    const income = accounts?.filter(acc => acc.account_type === 'income') || [];
    const expenses = accounts?.filter(acc => acc.account_type === 'expense') || [];

    const totalIncome = income.reduce((sum, acc) => sum + acc.balance, 0);
    const totalExpenses = expenses.reduce((sum, acc) => sum + acc.balance, 0);

    return {
      period_start: periodStart,
      period_end: periodEnd,
      income: {
        operating_income: income.filter(acc => acc.account_category === 'operating_income'),
        other_income: income.filter(acc => acc.account_category === 'other_income'),
        total_income: totalIncome
      },
      expenses: {
        operating_expenses: expenses.filter(acc => acc.account_category === 'operating_expenses'),
        other_expenses: expenses.filter(acc => acc.account_category === 'other_expenses'),
        total_expenses: totalExpenses
      },
      net_income: totalIncome - totalExpenses
    };
  };

  const generateCashFlow = async (periodStart: string, periodEnd: string) => {
    // Simplified cash flow statement
    return {
      period_start: periodStart,
      period_end: periodEnd,
      operating_activities: {
        net_income: 0,
        adjustments: [],
        total_operating: 0
      },
      investing_activities: {
        loan_disbursements: 0,
        loan_repayments: 0,
        total_investing: 0
      },
      financing_activities: {
        deposits_received: 0,
        withdrawals_paid: 0,
        total_financing: 0
      },
      net_cash_flow: 0
    };
  };

  const generateLoanAging = async (asOfDate: string) => {
    if (!profile?.tenant_id) return {};

    const { data: loans } = await supabase
      .from('loans')
      .select('*')
      .eq('tenant_id', profile.tenant_id)
      .eq('status', 'active');

    const agingBuckets = {
      current: { count: 0, amount: 0 },
      days_1_30: { count: 0, amount: 0 },
      days_31_60: { count: 0, amount: 0 },
      days_61_90: { count: 0, amount: 0 },
      days_over_90: { count: 0, amount: 0 }
    };

    loans?.forEach(loan => {
      const overdueAmount = loan.total_overdue_amount || 0;
      const outstandingBalance = loan.outstanding_balance || 0;

      if (overdueAmount === 0) {
        agingBuckets.current.count++;
        agingBuckets.current.amount += outstandingBalance;
      } else {
        // Simplified aging - would need proper calculation based on payment schedules
        agingBuckets.days_1_30.count++;
        agingBuckets.days_1_30.amount += outstandingBalance;
      }
    });

    return {
      as_of_date: asOfDate,
      aging_buckets: agingBuckets,
      summary: {
        total_loans: loans?.length || 0,
        total_portfolio: loans?.reduce((sum, loan) => sum + (loan.outstanding_balance || 0), 0) || 0,
        total_overdue: loans?.reduce((sum, loan) => sum + (loan.total_overdue_amount || 0), 0) || 0
      }
    };
  };

  return {
    loading,
    generateFinancialReport,
    fetchFinancialReports,
    fetchChartOfAccounts,
    createAccount,
    fetchJournalEntries,
    createJournalEntry,
    generatePortfolioAnalysis,
    fetchPortfolioAnalysis,
    fetchCustomReportTemplates,
    createCustomReportTemplate
  };
};