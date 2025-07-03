import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "@/hooks/use-toast";

export interface BankStatement {
  id: string;
  tenant_id: string;
  bank_account_name: string;
  bank_account_number: string;
  statement_period_start: string;
  statement_period_end: string;
  opening_balance: number;
  closing_balance: number;
  statement_file_url?: string;
  statement_type: 'csv' | 'excel' | 'pdf' | 'mt940';
  upload_date: string;
  uploaded_by?: string;
  is_processed: boolean;
  created_at: string;
  updated_at: string;
}

export interface BankStatementTransaction {
  id: string;
  bank_statement_id: string;
  transaction_date: string;
  description: string;
  reference_number?: string;
  debit_amount: number;
  credit_amount: number;
  balance?: number;
  transaction_code?: string;
  raw_data?: any;
  created_at: string;
}

export interface ReconciliationMatch {
  id: string;
  tenant_id: string;
  bank_transaction_id: string;
  system_transaction_id?: string;
  match_type: 'automatic' | 'manual' | 'suggested';
  match_confidence: number;
  amount_difference: number;
  matched_by?: string;
  matched_at: string;
  notes?: string;
  created_at: string;
}

export interface SuspenseAccount {
  id: string;
  tenant_id: string;
  account_name: string;
  account_type: 'bank_suspense' | 'mpesa_suspense' | 'cash_suspense' | 'unidentified_deposits';
  current_balance: number;
  description?: string;
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface SuspenseEntry {
  id: string;
  suspense_account_id: string;
  reference_transaction_id?: string;
  reference_type: 'bank_transaction' | 'system_transaction' | 'mpesa_transaction';
  amount: number;
  transaction_type: 'debit' | 'credit';
  description: string;
  entry_date: string;
  resolution_status: 'pending' | 'resolved' | 'written_off';
  resolved_by?: string;
  resolved_at?: string;
  resolution_notes?: string;
  created_at: string;
}

export interface MPESATransaction {
  id: string;
  tenant_id: string;
  mpesa_receipt_number: string;
  transaction_type: 'c2b' | 'b2c' | 'paybill' | 'till';
  amount: number;
  phone_number: string;
  first_name?: string;
  last_name?: string;
  middle_name?: string;
  transaction_date: string;
  account_reference?: string;
  bill_ref_number?: string;
  org_account_balance?: number;
  third_party_trans_id?: string;
  msisdn?: string;
  raw_callback_data?: any;
  reconciliation_status: 'matched' | 'unmatched' | 'suspended';
  matched_transaction_id?: string;
  created_at: string;
  updated_at: string;
}

export interface ReconciliationSummaryReport {
  id: string;
  tenant_id: string;
  report_period_start: string;
  report_period_end: string;
  total_bank_transactions: number;
  total_system_transactions: number;
  matched_transactions: number;
  unmatched_bank_transactions: number;
  unmatched_system_transactions: number;
  total_bank_amount: number;
  total_system_amount: number;
  variance_amount: number;
  mpesa_transactions: number;
  mpesa_matched: number;
  mpesa_unmatched: number;
  suspense_entries: number;
  suspense_balance: number;
  generated_by?: string;
  generated_at: string;
  report_data?: any;
  created_at: string;
}

export const useReconciliation = () => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);

  // Bank Statement Management
  const uploadBankStatement = async (
    file: File,
    bankAccountName: string,
    bankAccountNumber: string,
    periodStart: string,
    periodEnd: string,
    openingBalance: number,
    closingBalance: number
  ): Promise<BankStatement | null> => {
    if (!profile?.tenant_id || !profile?.id) return null;
    
    setLoading(true);
    
    try {
      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${profile.tenant_id}/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('reconciliation-statements')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('reconciliation-statements')
        .getPublicUrl(uploadData.path);

      // Create bank statement record
      const { data, error } = await supabase
        .from('bank_statements')
        .insert({
          tenant_id: profile.tenant_id,
          bank_account_name: bankAccountName,
          bank_account_number: bankAccountNumber,
          statement_period_start: periodStart,
          statement_period_end: periodEnd,
          opening_balance: openingBalance,
          closing_balance: closingBalance,
          statement_file_url: urlData.publicUrl,
          statement_type: fileExt?.toLowerCase() === 'csv' ? 'csv' : 'excel',
          uploaded_by: profile.id
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Bank statement uploaded successfully",
      });

      return data as BankStatement;
    } catch (error) {
      console.error('Error uploading bank statement:', error);
      toast({
        title: "Error",
        description: "Failed to upload bank statement",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const fetchBankStatements = async (): Promise<BankStatement[]> => {
    if (!profile?.tenant_id) return [];
    
    const { data, error } = await supabase
      .from('bank_statements')
      .select('*')
      .eq('tenant_id', profile.tenant_id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching bank statements:', error);
      return [];
    }

    return (data || []) as BankStatement[];
  };

  // Reconciliation Functions
  const createManualMatch = async (
    bankTransactionId: string,
    systemTransactionId: string,
    notes?: string
  ): Promise<boolean> => {
    if (!profile?.tenant_id || !profile?.id) return false;
    
    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('reconciliation_matches')
        .insert({
          tenant_id: profile.tenant_id,
          bank_transaction_id: bankTransactionId,
          system_transaction_id: systemTransactionId,
          match_type: 'manual',
          match_confidence: 1.0,
          amount_difference: 0,
          matched_by: profile.id,
          notes
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Transactions matched successfully",
      });

      return true;
    } catch (error) {
      console.error('Error creating manual match:', error);
      toast({
        title: "Error",
        description: "Failed to match transactions",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const runAutoReconciliation = async (periodStart: string, periodEnd: string): Promise<number> => {
    if (!profile?.tenant_id) return 0;
    
    setLoading(true);
    
    try {
      // This would typically call an edge function to perform auto-reconciliation
      const { data, error } = await supabase.functions.invoke('auto-reconciliation', {
        body: {
          tenant_id: profile.tenant_id,
          period_start: periodStart,
          period_end: periodEnd
        }
      });

      if (error) throw error;

      const matchCount = data?.matches_created || 0;
      
      toast({
        title: "Auto-reconciliation Complete",
        description: `${matchCount} transactions matched automatically`,
      });

      return matchCount;
    } catch (error) {
      console.error('Error running auto-reconciliation:', error);
      toast({
        title: "Error",
        description: "Failed to run auto-reconciliation",
        variant: "destructive",
      });
      return 0;
    } finally {
      setLoading(false);
    }
  };

  // Suspense Account Management
  const fetchSuspenseAccounts = async (): Promise<SuspenseAccount[]> => {
    if (!profile?.tenant_id) return [];
    
    const { data, error } = await supabase
      .from('suspense_accounts')
      .select('*')
      .eq('tenant_id', profile.tenant_id)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching suspense accounts:', error);
      return [];
    }

    return (data || []) as SuspenseAccount[];
  };

  const createSuspenseAccount = async (
    accountName: string,
    accountType: SuspenseAccount['account_type'],
    description?: string
  ): Promise<SuspenseAccount | null> => {
    if (!profile?.tenant_id || !profile?.id) return null;
    
    setLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('suspense_accounts')
        .insert({
          tenant_id: profile.tenant_id,
          account_name: accountName,
          account_type: accountType,
          description,
          created_by: profile.id
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Suspense account created successfully",
      });

      return data as SuspenseAccount;
    } catch (error) {
      console.error('Error creating suspense account:', error);
      toast({
        title: "Error",
        description: "Failed to create suspense account",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const fetchSuspenseEntries = async (accountId?: string): Promise<SuspenseEntry[]> => {
    if (!profile?.tenant_id) return [];
    
    let query = supabase
      .from('suspense_entries')
      .select(`
        *,
        suspense_accounts!inner(tenant_id)
      `)
      .eq('suspense_accounts.tenant_id', profile.tenant_id);

    if (accountId) {
      query = query.eq('suspense_account_id', accountId);
    }

    const { data, error } = await query
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching suspense entries:', error);
      return [];
    }

    return (data || []) as SuspenseEntry[];
  };

  const resolveSuspenseEntry = async (
    entryId: string,
    resolutionNotes: string
  ): Promise<boolean> => {
    if (!profile?.id) return false;
    
    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('suspense_entries')
        .update({
          resolution_status: 'resolved',
          resolved_by: profile.id,
          resolved_at: new Date().toISOString(),
          resolution_notes: resolutionNotes
        })
        .eq('id', entryId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Suspense entry resolved successfully",
      });

      return true;
    } catch (error) {
      console.error('Error resolving suspense entry:', error);
      toast({
        title: "Error",
        description: "Failed to resolve suspense entry",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // MPESA Management
  const fetchMPESATransactions = async (): Promise<MPESATransaction[]> => {
    if (!profile?.tenant_id) return [];
    
    const { data, error } = await supabase
      .from('mpesa_transactions')
      .select('*')
      .eq('tenant_id', profile.tenant_id)
      .order('transaction_date', { ascending: false });

    if (error) {
      console.error('Error fetching MPESA transactions:', error);
      return [];
    }

    return (data || []) as MPESATransaction[];
  };

  // Reporting
  const generateReconciliationReport = async (
    periodStart: string,
    periodEnd: string
  ): Promise<ReconciliationSummaryReport | null> => {
    if (!profile?.tenant_id || !profile?.id) return null;
    
    setLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-reconciliation-report', {
        body: {
          tenant_id: profile.tenant_id,
          period_start: periodStart,
          period_end: periodEnd,
          generated_by: profile.id
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Reconciliation report generated successfully",
      });

      return data?.report as ReconciliationSummaryReport;
    } catch (error) {
      console.error('Error generating reconciliation report:', error);
      toast({
        title: "Error",
        description: "Failed to generate reconciliation report",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const fetchReconciliationReports = async (): Promise<ReconciliationSummaryReport[]> => {
    if (!profile?.tenant_id) return [];
    
    const { data, error } = await supabase
      .from('reconciliation_summary_reports')
      .select('*')
      .eq('tenant_id', profile.tenant_id)
      .order('generated_at', { ascending: false });

    if (error) {
      console.error('Error fetching reconciliation reports:', error);
      return [];
    }

    return (data || []) as ReconciliationSummaryReport[];
  };

  return {
    loading,
    uploadBankStatement,
    fetchBankStatements,
    createManualMatch,
    runAutoReconciliation,
    fetchSuspenseAccounts,
    createSuspenseAccount,
    fetchSuspenseEntries,
    resolveSuspenseEntry,
    fetchMPESATransactions,
    generateReconciliationReport,
    fetchReconciliationReports
  };
};