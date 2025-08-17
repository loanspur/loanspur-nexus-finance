import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

// Interface for comprehensive transaction view
export interface ComprehensiveTransaction {
  id: string;
  transaction_date: string;
  transaction_type: string;
  amount: number;
  description: string;
  reference_number?: string;
  status: string;
  client_name?: string;
  account_info?: string;
  payment_type?: string;
  reference_id?: string;
  source_table: 'loan_payments' | 'savings_transactions' | 'transactions' | 'journal_entries';
  created_at: string;
}

// Hook to fetch all transactions across different tables with real-time updates and pagination
export const useComprehensiveTransactions = (filters?: {
  dateFrom?: string;
  dateTo?: string;
  transactionType?: string;
  searchTerm?: string;
  page?: number;
  pageSize?: number;
}) => {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  // Real-time subscription for all transaction tables
  useEffect(() => {
    if (!profile?.tenant_id) return;

    const channel = supabase
      .channel('comprehensive-transactions-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'loan_payments',
          filter: `tenant_id=eq.${profile.tenant_id}`
        },
        (payload) => {
          console.log('Loan payment updated:', payload);
          queryClient.invalidateQueries({ queryKey: ['comprehensive-transactions'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'savings_transactions',
          filter: `tenant_id=eq.${profile.tenant_id}`
        },
        (payload) => {
          console.log('Savings transaction updated:', payload);
          queryClient.invalidateQueries({ queryKey: ['comprehensive-transactions'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
          filter: `tenant_id=eq.${profile.tenant_id}`
        },
        (payload) => {
          console.log('General transaction updated:', payload);
          queryClient.invalidateQueries({ queryKey: ['comprehensive-transactions'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'journal_entries',
          filter: `tenant_id=eq.${profile.tenant_id}`
        },
        (payload) => {
          console.log('Journal entry updated:', payload);
          queryClient.invalidateQueries({ queryKey: ['comprehensive-transactions'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.tenant_id, queryClient]);

  return useQuery({
    queryKey: ['comprehensive-transactions', profile?.tenant_id, filters?.dateFrom, filters?.dateTo, filters?.transactionType],
    queryFn: async () => {
      if (!profile?.tenant_id) return { data: [], count: 0 };

      const transactions: ComprehensiveTransaction[] = [];

      // 1. Fetch loan payments
      let loanPaymentsQuery = supabase
        .from('loan_payments')
        .select(`
          id,
          payment_date,
          payment_amount,
          payment_method,
          reference_number,
          created_at,
          loans!inner(
            loan_number,
            clients!inner(first_name, last_name)
          )
        `)
        .eq('tenant_id', profile.tenant_id);

      if (filters?.dateFrom) {
        loanPaymentsQuery = loanPaymentsQuery.gte('payment_date', filters.dateFrom);
      }
      if (filters?.dateTo) {
        loanPaymentsQuery = loanPaymentsQuery.lte('payment_date', filters.dateTo);
      }

      const { data: loanPayments } = await loanPaymentsQuery;

      if (loanPayments) {
        transactions.push(...loanPayments.map((payment: any) => ({
          id: payment.id,
          transaction_date: payment.payment_date,
          transaction_type: 'Loan Payment',
          amount: payment.payment_amount,
          description: `Loan payment - ${payment.loans?.loan_number}`,
          reference_number: payment.reference_number,
          status: payment.payment_method?.includes('_REVERSED') ? 'reversed' : 'completed',
          client_name: `${payment.loans?.clients?.first_name} ${payment.loans?.clients?.last_name}`,
          account_info: payment.loans?.loan_number,
          source_table: 'loan_payments' as const,
          created_at: payment.created_at
        })));
      }

      // 2. Fetch savings transactions
      let savingsTransactionsQuery = supabase
        .from('savings_transactions')
        .select(`
          id,
          transaction_date,
          transaction_type,
          amount,
          description,
          reference_number,
          method,
          created_at,
          savings_accounts!inner(
            account_number,
            clients!inner(first_name, last_name)
          )
        `)
        .eq('tenant_id', profile.tenant_id);

      if (filters?.dateFrom) {
        savingsTransactionsQuery = savingsTransactionsQuery.gte('transaction_date', filters.dateFrom);
      }
      if (filters?.dateTo) {
        savingsTransactionsQuery = savingsTransactionsQuery.lte('transaction_date', filters.dateTo);
      }

      const { data: savingsTransactions } = await savingsTransactionsQuery;

      if (savingsTransactions) {
        transactions.push(...savingsTransactions.map((transaction: any) => ({
          id: transaction.id,
          transaction_date: transaction.transaction_date,
          transaction_type: `Savings ${transaction.transaction_type}`,
          amount: transaction.amount,
          description: transaction.description || `Savings ${transaction.transaction_type}`,
          reference_number: transaction.reference_number,
          status: transaction.method?.includes('_REVERSED') ? 'reversed' : 'completed',
          client_name: `${transaction.savings_accounts?.clients?.first_name} ${transaction.savings_accounts?.clients?.last_name}`,
          account_info: transaction.savings_accounts?.account_number,
          source_table: 'savings_transactions' as const,
          created_at: transaction.created_at
        })));
      }

      // 3. Fetch general transactions (transfers, fees, etc.)
      let generalTransactionsQuery = supabase
        .from('transactions')
        .select(`
          id,
          transaction_date,
          transaction_type,
          amount,
          description,
          external_transaction_id,
          payment_status,
          created_at,
          clients(first_name, last_name)
        `)
        .eq('tenant_id', profile.tenant_id);

      if (filters?.dateFrom) {
        generalTransactionsQuery = generalTransactionsQuery.gte('transaction_date', filters.dateFrom);
      }
      if (filters?.dateTo) {
        generalTransactionsQuery = generalTransactionsQuery.lte('transaction_date', filters.dateTo);
      }

      const { data: generalTransactions } = await generalTransactionsQuery;

      if (generalTransactions) {
        transactions.push(...generalTransactions.map((transaction: any) => ({
          id: transaction.id,
          transaction_date: transaction.transaction_date,
          transaction_type: transaction.transaction_type.replace('_', ' ').toUpperCase(),
          amount: transaction.amount,
          description: transaction.description || 'General transaction',
          reference_number: transaction.external_transaction_id,
          status: transaction.payment_status || 'completed',
          client_name: transaction.clients ? `${transaction.clients.first_name} ${transaction.clients.last_name}` : '',
          account_info: '',
          source_table: 'transactions' as const,
          created_at: transaction.created_at
        })));
      }

      // 4. Fetch journal entries
      let journalEntriesQuery = supabase
        .from('journal_entries')
        .select(`
          id,
          transaction_date,
          description,
          entry_number,
          total_amount,
          status,
          reference_type,
          created_at
        `)
        .eq('tenant_id', profile.tenant_id);

      if (filters?.dateFrom) {
        journalEntriesQuery = journalEntriesQuery.gte('transaction_date', filters.dateFrom);
      }
      if (filters?.dateTo) {
        journalEntriesQuery = journalEntriesQuery.lte('transaction_date', filters.dateTo);
      }

      const { data: journalEntries } = await journalEntriesQuery;

      if (journalEntries) {
        transactions.push(...journalEntries.map((entry: any) => ({
          id: entry.id,
          transaction_date: entry.transaction_date,
          transaction_type: `Journal Entry${entry.reference_type ? ` (${entry.reference_type})` : ''}`,
          amount: entry.total_amount,
          description: entry.description,
          reference_number: entry.entry_number,
          status: entry.status,
          client_name: '',
          account_info: '',
          source_table: 'journal_entries' as const,
          created_at: entry.created_at
        })));
      }

      // Apply filters
      let filteredTransactions = transactions;

      if (filters?.transactionType && filters.transactionType !== 'all') {
        filteredTransactions = filteredTransactions.filter(t => 
          t.transaction_type.toLowerCase().includes(filters.transactionType!.toLowerCase())
        );
      }

      if (filters?.searchTerm) {
        const term = filters.searchTerm.toLowerCase();
        filteredTransactions = filteredTransactions.filter(t =>
          t.description.toLowerCase().includes(term) ||
          t.client_name?.toLowerCase().includes(term) ||
          t.reference_number?.toLowerCase().includes(term)
        );
      }

      // Sort by date descending
      const sortedTransactions = filteredTransactions.sort((a, b) => 
        new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime()
      );

      // Apply pagination
      const page = filters?.page || 1;
      const pageSize = filters?.pageSize || 10;
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedData = sortedTransactions.slice(startIndex, endIndex);

      return { data: paginatedData, count: sortedTransactions.length };
    },
    enabled: !!profile?.tenant_id,
    refetchInterval: 30000, // Refetch every 30 seconds as backup to real-time
  });
};