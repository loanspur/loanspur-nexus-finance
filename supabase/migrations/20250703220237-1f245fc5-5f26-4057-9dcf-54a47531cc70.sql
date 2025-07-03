-- Reconciliation Module Enhancement

-- Bank Statements
CREATE TABLE IF NOT EXISTS bank_statements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  bank_account_name TEXT NOT NULL,
  bank_account_number TEXT NOT NULL,
  statement_period_start DATE NOT NULL,
  statement_period_end DATE NOT NULL,
  opening_balance NUMERIC NOT NULL DEFAULT 0,
  closing_balance NUMERIC NOT NULL DEFAULT 0,
  statement_file_url TEXT,
  statement_type TEXT NOT NULL DEFAULT 'csv' CHECK (statement_type IN ('csv', 'excel', 'pdf', 'mt940')),
  upload_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  uploaded_by UUID REFERENCES profiles(id),
  is_processed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Bank Statement Transactions
CREATE TABLE IF NOT EXISTS bank_statement_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bank_statement_id UUID NOT NULL REFERENCES bank_statements(id) ON DELETE CASCADE,
  transaction_date DATE NOT NULL,
  description TEXT NOT NULL,
  reference_number TEXT,
  debit_amount NUMERIC DEFAULT 0,
  credit_amount NUMERIC DEFAULT 0,
  balance NUMERIC,
  transaction_code TEXT,
  raw_data JSONB, -- Store original transaction data
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Reconciliation Matches
CREATE TABLE IF NOT EXISTS reconciliation_matches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  bank_transaction_id UUID NOT NULL REFERENCES bank_statement_transactions(id),
  system_transaction_id UUID REFERENCES transactions(id),
  match_type TEXT NOT NULL CHECK (match_type IN ('automatic', 'manual', 'suggested')),
  match_confidence NUMERIC DEFAULT 0 CHECK (match_confidence >= 0 AND match_confidence <= 1),
  amount_difference NUMERIC DEFAULT 0,
  matched_by UUID REFERENCES profiles(id),
  matched_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Suspense Accounts for Unmatched Transactions
CREATE TABLE IF NOT EXISTS suspense_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  account_name TEXT NOT NULL,
  account_type TEXT NOT NULL CHECK (account_type IN ('bank_suspense', 'mpesa_suspense', 'cash_suspense', 'unidentified_deposits')),
  current_balance NUMERIC NOT NULL DEFAULT 0,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Suspense Account Entries
CREATE TABLE IF NOT EXISTS suspense_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  suspense_account_id UUID NOT NULL REFERENCES suspense_accounts(id),
  reference_transaction_id UUID, -- Could reference bank_statement_transactions or transactions
  reference_type TEXT NOT NULL CHECK (reference_type IN ('bank_transaction', 'system_transaction', 'mpesa_transaction')),
  amount NUMERIC NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('debit', 'credit')),
  description TEXT NOT NULL,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  resolution_status TEXT NOT NULL DEFAULT 'pending' CHECK (resolution_status IN ('pending', 'resolved', 'written_off')),
  resolved_by UUID REFERENCES profiles(id),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolution_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- MPESA Transaction Records
CREATE TABLE IF NOT EXISTS mpesa_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  mpesa_receipt_number TEXT NOT NULL UNIQUE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('c2b', 'b2c', 'paybill', 'till')),
  amount NUMERIC NOT NULL,
  phone_number TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  middle_name TEXT,
  transaction_date TIMESTAMP WITH TIME ZONE NOT NULL,
  account_reference TEXT,
  bill_ref_number TEXT,
  org_account_balance NUMERIC,
  third_party_trans_id TEXT,
  msisdn TEXT,
  raw_callback_data JSONB,
  reconciliation_status TEXT NOT NULL DEFAULT 'unmatched' CHECK (reconciliation_status IN ('matched', 'unmatched', 'suspended')),
  matched_transaction_id UUID REFERENCES transactions(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Reconciliation Reports
CREATE TABLE IF NOT EXISTS reconciliation_summary_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  report_period_start DATE NOT NULL,
  report_period_end DATE NOT NULL,
  total_bank_transactions INTEGER DEFAULT 0,
  total_system_transactions INTEGER DEFAULT 0,
  matched_transactions INTEGER DEFAULT 0,
  unmatched_bank_transactions INTEGER DEFAULT 0,
  unmatched_system_transactions INTEGER DEFAULT 0,
  total_bank_amount NUMERIC DEFAULT 0,
  total_system_amount NUMERIC DEFAULT 0,
  variance_amount NUMERIC DEFAULT 0,
  mpesa_transactions INTEGER DEFAULT 0,
  mpesa_matched INTEGER DEFAULT 0,
  mpesa_unmatched INTEGER DEFAULT 0,
  suspense_entries INTEGER DEFAULT 0,
  suspense_balance NUMERIC DEFAULT 0,
  generated_by UUID REFERENCES profiles(id),
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  report_data JSONB, -- Store detailed report data
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create storage bucket for reconciliation files
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('reconciliation-statements', 'reconciliation-statements', false)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on all new tables
ALTER TABLE bank_statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_statement_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reconciliation_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE suspense_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE suspense_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE mpesa_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reconciliation_summary_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can access their tenant's bank statements" ON bank_statements
  FOR ALL USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can access their tenant's bank statement transactions" ON bank_statement_transactions
  FOR ALL USING (bank_statement_id IN (SELECT id FROM bank_statements WHERE tenant_id IN (SELECT tenant_id FROM profiles WHERE user_id = auth.uid())));

CREATE POLICY "Users can access their tenant's reconciliation matches" ON reconciliation_matches
  FOR ALL USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can access their tenant's suspense accounts" ON suspense_accounts
  FOR ALL USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can access their tenant's suspense entries" ON suspense_entries
  FOR ALL USING (suspense_account_id IN (SELECT id FROM suspense_accounts WHERE tenant_id IN (SELECT tenant_id FROM profiles WHERE user_id = auth.uid())));

CREATE POLICY "Users can access their tenant's mpesa transactions" ON mpesa_transactions
  FOR ALL USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can access their tenant's reconciliation reports" ON reconciliation_summary_reports
  FOR ALL USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE user_id = auth.uid()));

-- Storage policies for reconciliation files
CREATE POLICY "Users can access their tenant's reconciliation files" ON storage.objects
  FOR ALL USING (bucket_id = 'reconciliation-statements' AND 
    (storage.foldername(name))[1] IN (SELECT tenant_id::text FROM profiles WHERE user_id = auth.uid()));

-- Add updated_at triggers
CREATE TRIGGER update_bank_statements_updated_at
  BEFORE UPDATE ON bank_statements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_suspense_accounts_updated_at
  BEFORE UPDATE ON suspense_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mpesa_transactions_updated_at
  BEFORE UPDATE ON mpesa_transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_bank_statement_transactions_date ON bank_statement_transactions(transaction_date);
CREATE INDEX idx_bank_statement_transactions_amount ON bank_statement_transactions(debit_amount, credit_amount);
CREATE INDEX idx_mpesa_transactions_receipt ON mpesa_transactions(mpesa_receipt_number);
CREATE INDEX idx_mpesa_transactions_phone ON mpesa_transactions(phone_number);
CREATE INDEX idx_mpesa_transactions_date ON mpesa_transactions(transaction_date);
CREATE INDEX idx_reconciliation_matches_bank_tx ON reconciliation_matches(bank_transaction_id);
CREATE INDEX idx_reconciliation_matches_system_tx ON reconciliation_matches(system_transaction_id);