-- Financial Reporting Dashboard

-- Financial Reports Configuration
CREATE TABLE IF NOT EXISTS financial_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  report_type TEXT NOT NULL CHECK (report_type IN ('balance_sheet', 'profit_loss', 'cash_flow', 'portfolio_analysis', 'loan_aging', 'regulatory_cbk', 'custom')),
  report_name TEXT NOT NULL,
  report_config JSONB NOT NULL DEFAULT '{}',
  generated_by UUID REFERENCES profiles(id),
  report_data JSONB,
  report_period_start DATE NOT NULL,
  report_period_end DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'generating', 'completed', 'failed')),
  file_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Chart of Accounts for Financial Reporting
CREATE TABLE IF NOT EXISTS chart_of_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  account_code TEXT NOT NULL,
  account_name TEXT NOT NULL,
  account_type TEXT NOT NULL CHECK (account_type IN ('asset', 'liability', 'equity', 'revenue', 'expense')),
  account_category TEXT NOT NULL,
  parent_account_id UUID REFERENCES chart_of_accounts(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  balance NUMERIC NOT NULL DEFAULT 0,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, account_code)
);

-- Journal Entries for Accounting
CREATE TABLE IF NOT EXISTS journal_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  entry_number TEXT NOT NULL,
  transaction_date DATE NOT NULL,
  description TEXT NOT NULL,
  reference_type TEXT CHECK (reference_type IN ('loan_disbursement', 'loan_payment', 'savings_deposit', 'savings_withdrawal', 'fee_collection', 'manual')),
  reference_id UUID,
  total_amount NUMERIC NOT NULL,
  created_by UUID REFERENCES profiles(id),
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'posted', 'reversed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, entry_number)
);

-- Journal Entry Line Items
CREATE TABLE IF NOT EXISTS journal_entry_lines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  journal_entry_id UUID NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES chart_of_accounts(id),
  debit_amount NUMERIC DEFAULT 0,
  credit_amount NUMERIC DEFAULT 0,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Portfolio Analysis Cache
CREATE TABLE IF NOT EXISTS portfolio_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  analysis_date DATE NOT NULL,
  total_portfolio_value NUMERIC NOT NULL DEFAULT 0,
  active_loans INTEGER NOT NULL DEFAULT 0,
  overdue_loans INTEGER NOT NULL DEFAULT 0,
  par_30 NUMERIC NOT NULL DEFAULT 0, -- Portfolio at Risk 30 days
  par_90 NUMERIC NOT NULL DEFAULT 0, -- Portfolio at Risk 90 days
  write_off_ratio NUMERIC NOT NULL DEFAULT 0,
  average_loan_size NUMERIC NOT NULL DEFAULT 0,
  yield_on_portfolio NUMERIC NOT NULL DEFAULT 0,
  analysis_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, analysis_date)
);

-- Custom Report Builder Templates
CREATE TABLE IF NOT EXISTS custom_report_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  template_name TEXT NOT NULL,
  description TEXT,
  report_query JSONB NOT NULL, -- Stores the query configuration
  columns_config JSONB NOT NULL, -- Column definitions and formatting
  filters_config JSONB, -- Available filters
  chart_config JSONB, -- Chart configuration if applicable
  is_public BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE financial_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE chart_of_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entry_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_report_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can access their tenant's financial reports" ON financial_reports
  FOR ALL USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can access their tenant's chart of accounts" ON chart_of_accounts
  FOR ALL USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can access their tenant's journal entries" ON journal_entries
  FOR ALL USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can access their tenant's journal entry lines" ON journal_entry_lines
  FOR ALL USING (journal_entry_id IN (SELECT id FROM journal_entries WHERE tenant_id IN (SELECT tenant_id FROM profiles WHERE user_id = auth.uid())));

CREATE POLICY "Users can access their tenant's portfolio analysis" ON portfolio_analysis
  FOR ALL USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can access their tenant's custom report templates" ON custom_report_templates
  FOR ALL USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE user_id = auth.uid()));

-- Add updated_at triggers
CREATE TRIGGER update_financial_reports_updated_at
  BEFORE UPDATE ON financial_reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chart_of_accounts_updated_at
  BEFORE UPDATE ON chart_of_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_journal_entries_updated_at
  BEFORE UPDATE ON journal_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_custom_report_templates_updated_at
  BEFORE UPDATE ON custom_report_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_financial_reports_tenant_type ON financial_reports(tenant_id, report_type);
CREATE INDEX idx_financial_reports_period ON financial_reports(report_period_start, report_period_end);
CREATE INDEX idx_chart_of_accounts_tenant ON chart_of_accounts(tenant_id, account_type);
CREATE INDEX idx_journal_entries_tenant_date ON journal_entries(tenant_id, transaction_date);
CREATE INDEX idx_journal_entry_lines_account ON journal_entry_lines(account_id);
CREATE INDEX idx_portfolio_analysis_tenant_date ON portfolio_analysis(tenant_id, analysis_date);

-- Insert default chart of accounts for new tenants
INSERT INTO chart_of_accounts (tenant_id, account_code, account_name, account_type, account_category, description) 
SELECT id, '1000', 'Cash and Bank', 'asset', 'current_assets', 'Cash in hand and bank accounts' FROM tenants
ON CONFLICT (tenant_id, account_code) DO NOTHING;

INSERT INTO chart_of_accounts (tenant_id, account_code, account_name, account_type, account_category, description) 
SELECT id, '1100', 'Loans Receivable', 'asset', 'current_assets', 'Outstanding loan balances' FROM tenants
ON CONFLICT (tenant_id, account_code) DO NOTHING;

INSERT INTO chart_of_accounts (tenant_id, account_code, account_name, account_type, account_category, description) 
SELECT id, '1200', 'Interest Receivable', 'asset', 'current_assets', 'Accrued interest on loans' FROM tenants
ON CONFLICT (tenant_id, account_code) DO NOTHING;

INSERT INTO chart_of_accounts (tenant_id, account_code, account_name, account_type, account_category, description) 
SELECT id, '2000', 'Customer Deposits', 'liability', 'current_liabilities', 'Savings and deposit accounts' FROM tenants
ON CONFLICT (tenant_id, account_code) DO NOTHING;

INSERT INTO chart_of_accounts (tenant_id, account_code, account_name, account_type, account_category, description) 
SELECT id, '3000', 'Share Capital', 'equity', 'equity', 'Member share capital' FROM tenants
ON CONFLICT (tenant_id, account_code) DO NOTHING;

INSERT INTO chart_of_accounts (tenant_id, account_code, account_name, account_type, account_category, description) 
SELECT id, '4000', 'Interest Income', 'revenue', 'operating_income', 'Interest earned from loans' FROM tenants
ON CONFLICT (tenant_id, account_code) DO NOTHING;

INSERT INTO chart_of_accounts (tenant_id, account_code, account_name, account_type, account_category, description) 
SELECT id, '5000', 'Operating Expenses', 'expense', 'operating_expenses', 'General operating expenses' FROM tenants
ON CONFLICT (tenant_id, account_code) DO NOTHING;