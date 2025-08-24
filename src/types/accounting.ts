// Accounting Integration Types
// Phase 4: Advanced Features

export interface ChartOfAccounts {
  id: string;
  tenant_id: string;
  mifos_account_id?: number;
  
  // Account Details
  account_code: string;
  account_name: string;
  account_type: 'asset' | 'liability' | 'equity' | 'income' | 'expense';
  account_category: string;
  parent_account_id?: string;
  
  // Financial Details
  opening_balance: number;
  current_balance: number;
  currency_code: string;
  
  // Account Properties
  is_active: boolean;
  is_system_account: boolean;
  allow_manual_entries: boolean;
  
  created_at: string;
  updated_at: string;
}

export interface JournalEntry {
  id: string;
  tenant_id: string;
  mifos_journal_entry_id?: number;
  
  // Entry Details
  entry_number: string;
  entry_date: string;
  reference_number: string;
  description: string;
  
  // Financial Details
  total_debits: number;
  total_credits: number;
  currency_code: string;
  
  // Status
  status: 'draft' | 'posted' | 'reversed';
  posted_date?: string;
  posted_by?: string;
  
  // Audit
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface JournalEntryLine {
  id: string;
  tenant_id: string;
  journal_entry_id: string;
  account_id: string;
  
  // Line Details
  line_number: number;
  description: string;
  debit_amount: number;
  credit_amount: number;
  
  // Reference
  reference_type?: 'loan' | 'savings' | 'client' | 'fee' | 'other';
  reference_id?: string;
  
  created_at: string;
  updated_at: string;
}

export interface FinancialPeriod {
  id: string;
  tenant_id: string;
  
  // Period Details
  period_name: string;
  start_date: string;
  end_date: string;
  fiscal_year: string;
  
  // Status
  status: 'open' | 'closed' | 'locked';
  closed_date?: string;
  closed_by?: string;
  
  created_at: string;
  updated_at: string;
}

export interface TrialBalance {
  id: string;
  tenant_id: string;
  period_id: string;
  
  // Balance Details
  account_id: string;
  account_code: string;
  account_name: string;
  account_type: string;
  
  // Balances
  opening_debit: number;
  opening_credit: number;
  current_debit: number;
  current_credit: number;
  closing_debit: number;
  closing_credit: number;
  
  // Calculated
  net_movement: number;
  closing_balance: number;
  
  generated_at: string;
  created_at: string;
}