import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

// Types
export interface JournalEntry {
  id: string;
  tenant_id: string;
  entry_number: string;
  entry_date: string;
  reference_number?: string;
  description: string;
  entry_type: 'manual' | 'automatic' | 'adjusting' | 'closing' | 'accrual' | 'provision';
  total_debit: number;
  total_credit: number;
  status: 'draft' | 'posted' | 'reversed';
  created_by?: string;
  approved_by?: string;
  posted_at?: string;
  reversed_at?: string;
  reversal_reason?: string;
  created_at: string;
  updated_at: string;
  journal_entry_lines?: JournalEntryLine[];
}

export interface JournalEntryLine {
  id: string;
  journal_entry_id: string;
  account_id: string;
  description?: string;
  debit_amount: number;
  credit_amount: number;
  line_order: number;
  created_at: string;
  account?: {
    account_name: string;
    account_code: string;
  };
}

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
  account?: {
    account_name: string;
    account_code: string;
  };
}

export interface Accrual {
  id: string;
  tenant_id: string;
  accrual_name: string;
  description?: string;
  accrual_type: 'expense' | 'revenue' | 'liability' | 'asset';
  amount: number;
  accrual_date: string;
  reversal_date?: string;
  account_id: string;
  contra_account_id: string;
  journal_entry_id?: string;
  reversal_entry_id?: string;
  status: 'pending' | 'posted' | 'reversed';
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface Provision {
  id: string;
  tenant_id: string;
  provision_name: string;
  description?: string;
  provision_type: 'bad_debt' | 'loan_loss' | 'depreciation' | 'tax' | 'other';
  calculation_method: 'percentage' | 'fixed' | 'formula';
  calculation_rate?: number;
  base_amount?: number;
  provision_amount: number;
  provision_date: string;
  account_id: string;
  expense_account_id: string;
  journal_entry_id?: string;
  status: 'pending' | 'posted' | 'adjusted';
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface ClosingEntry {
  id: string;
  tenant_id: string;
  closing_period: string;
  closing_date: string;
  description?: string;
  status: 'draft' | 'posted' | 'finalized';
  total_revenue: number;
  total_expenses: number;
  net_income: number;
  retained_earnings_account_id?: string;
  income_summary_account_id?: string;
  journal_entry_id?: string;
  created_by?: string;
  posted_by?: string;
  posted_at?: string;
  created_at: string;
  updated_at: string;
}

// Journal Entries Hooks
export const useJournalEntries = (filters?: {
  dateFrom?: string;
  dateTo?: string;
  status?: string;
  entryType?: string;
  searchTerm?: string;
}) => {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['journal-entries', profile?.tenant_id, filters],
    queryFn: async () => {
      if (!profile?.tenant_id) return [];

      let query = supabase
        .from('journal_entries')
        .select(`
          *,
          journal_entry_lines (
            *,
            account:chart_of_accounts (
              account_name,
              account_code
            )
          )
        `)
        .eq('tenant_id', profile.tenant_id)
        .order('entry_date', { ascending: false });

      if (filters?.dateFrom) {
        query = query.gte('entry_date', filters.dateFrom);
      }
      if (filters?.dateTo) {
        query = query.lte('entry_date', filters.dateTo);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.entryType) {
        query = query.eq('entry_type', filters.entryType);
      }
      if (filters?.searchTerm) {
        query = query.or(`description.ilike.%${filters.searchTerm}%,entry_number.ilike.%${filters.searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as JournalEntry[];
    },
    enabled: !!profile?.tenant_id,
  });
};

export const useCreateJournalEntry = () => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: {
      entry_date: string;
      description: string;
      entry_type?: string;
      reference_number?: string;
      lines: Array<{
        account_id: string;
        description?: string;
        debit_amount: number;
        credit_amount: number;
      }>;
    }) => {
      if (!profile?.tenant_id || !profile?.id) {
        throw new Error('No tenant or user context');
      }

      // Calculate totals
      const totalDebit = data.lines.reduce((sum, line) => sum + line.debit_amount, 0);
      const totalCredit = data.lines.reduce((sum, line) => sum + line.credit_amount, 0);

      if (Math.abs(totalDebit - totalCredit) > 0.01) {
        throw new Error('Debits and credits must be equal');
      }

      // Generate entry number
      const entryNumber = `JE-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;

      // Create journal entry
      const { data: journalEntry, error: entryError } = await supabase
        .from('journal_entries')
        .insert({
          tenant_id: profile.tenant_id,
          entry_number: entryNumber,
          entry_date: data.entry_date,
          description: data.description,
          entry_type: data.entry_type || 'manual',
          reference_number: data.reference_number,
          total_debit: totalDebit,
          total_credit: totalCredit,
          created_by: profile.id,
        })
        .select()
        .single();

      if (entryError) throw entryError;

      // Create journal entry lines
      const lines = data.lines.map((line, index) => ({
        journal_entry_id: journalEntry.id,
        account_id: line.account_id,
        description: line.description,
        debit_amount: line.debit_amount,
        credit_amount: line.credit_amount,
        line_order: index + 1,
      }));

      const { error: linesError } = await supabase
        .from('journal_entry_lines')
        .insert(lines);

      if (linesError) throw linesError;

      return journalEntry;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
      toast({
        title: "Journal Entry Created",
        description: "Journal entry has been created successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create journal entry.",
        variant: "destructive",
      });
    },
  });
};

// Account Balances Hook
export const useAccountBalances = (accountId?: string, dateFrom?: string, dateTo?: string) => {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['account-balances', profile?.tenant_id, accountId, dateFrom, dateTo],
    queryFn: async () => {
      if (!profile?.tenant_id) return [];

      let query = supabase
        .from('account_balances')
        .select(`
          *,
          account:chart_of_accounts (
            account_name,
            account_code,
            account_type
          )
        `)
        .eq('tenant_id', profile.tenant_id)
        .order('balance_date', { ascending: false });

      if (accountId) {
        query = query.eq('account_id', accountId);
      }
      if (dateFrom) {
        query = query.gte('balance_date', dateFrom);
      }
      if (dateTo) {
        query = query.lte('balance_date', dateTo);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as AccountBalance[];
    },
    enabled: !!profile?.tenant_id,
  });
};

// Accruals Hooks
export const useAccruals = () => {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['accruals', profile?.tenant_id],
    queryFn: async () => {
      if (!profile?.tenant_id) return [];

      const { data, error } = await supabase
        .from('accruals')
        .select('*')
        .eq('tenant_id', profile.tenant_id)
        .order('accrual_date', { ascending: false });

      if (error) throw error;
      return data as Accrual[];
    },
    enabled: !!profile?.tenant_id,
  });
};

export const useCreateAccrual = () => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: Omit<Accrual, 'id' | 'tenant_id' | 'created_by' | 'created_at' | 'updated_at'>) => {
      if (!profile?.tenant_id || !profile?.id) {
        throw new Error('No tenant or user context');
      }

      const { data: result, error } = await supabase
        .from('accruals')
        .insert({
          ...data,
          tenant_id: profile.tenant_id,
          created_by: profile.id,
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accruals'] });
      toast({
        title: "Accrual Created",
        description: "Accrual entry has been created successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to create accrual entry.",
        variant: "destructive",
      });
    },
  });
};

// Provisions Hooks
export const useProvisions = () => {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['provisions', profile?.tenant_id],
    queryFn: async () => {
      if (!profile?.tenant_id) return [];

      const { data, error } = await supabase
        .from('provisions')
        .select('*')
        .eq('tenant_id', profile.tenant_id)
        .order('provision_date', { ascending: false });

      if (error) throw error;
      return data as Provision[];
    },
    enabled: !!profile?.tenant_id,
  });
};

export const useCreateProvision = () => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: Omit<Provision, 'id' | 'tenant_id' | 'created_by' | 'created_at' | 'updated_at'>) => {
      if (!profile?.tenant_id || !profile?.id) {
        throw new Error('No tenant or user context');
      }

      const { data: result, error } = await supabase
        .from('provisions')
        .insert({
          ...data,
          tenant_id: profile.tenant_id,
          created_by: profile.id,
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['provisions'] });
      toast({
        title: "Provision Created",
        description: "Provision entry has been created successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to create provision entry.",
        variant: "destructive",
      });
    },
  });
};

// Closing Entries Hooks
export const useClosingEntries = () => {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['closing-entries', profile?.tenant_id],
    queryFn: async () => {
      if (!profile?.tenant_id) return [];

      const { data, error } = await supabase
        .from('closing_entries')
        .select('*')
        .eq('tenant_id', profile.tenant_id)
        .order('closing_date', { ascending: false });

      if (error) throw error;
      return data as ClosingEntry[];
    },
    enabled: !!profile?.tenant_id,
  });
};

export const useCreateClosingEntry = () => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: Omit<ClosingEntry, 'id' | 'tenant_id' | 'created_by' | 'created_at' | 'updated_at'>) => {
      if (!profile?.tenant_id || !profile?.id) {
        throw new Error('No tenant or user context');
      }

      const { data: result, error } = await supabase
        .from('closing_entries')
        .insert({
          ...data,
          tenant_id: profile.tenant_id,
          created_by: profile.id,
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['closing-entries'] });
      toast({
        title: "Closing Entry Created",
        description: "Closing entry has been created successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to create closing entry.",
        variant: "destructive",
      });
    },
  });
};