-- Create journal entries table
CREATE TABLE public.journal_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  entry_number TEXT NOT NULL,
  entry_date DATE NOT NULL,
  reference_number TEXT,
  description TEXT NOT NULL,
  entry_type TEXT NOT NULL DEFAULT 'manual' CHECK (entry_type IN ('manual', 'automatic', 'adjusting', 'closing', 'accrual', 'provision')),
  total_debit NUMERIC NOT NULL DEFAULT 0,
  total_credit NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'posted', 'reversed')),
  created_by UUID,
  approved_by UUID,
  posted_at TIMESTAMP WITH TIME ZONE,
  reversed_at TIMESTAMP WITH TIME ZONE,
  reversal_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT fk_journal_entries_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_journal_entries_created_by FOREIGN KEY (created_by) REFERENCES profiles(id),
  CONSTRAINT fk_journal_entries_approved_by FOREIGN KEY (approved_by) REFERENCES profiles(id)
);

-- Create journal entry lines table
CREATE TABLE public.journal_entry_lines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  journal_entry_id UUID NOT NULL,
  account_id UUID NOT NULL,
  description TEXT,
  debit_amount NUMERIC DEFAULT 0,
  credit_amount NUMERIC DEFAULT 0,
  line_order INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT fk_journal_entry_lines_entry FOREIGN KEY (journal_entry_id) REFERENCES journal_entries(id) ON DELETE CASCADE,
  CONSTRAINT fk_journal_entry_lines_account FOREIGN KEY (account_id) REFERENCES chart_of_accounts(id),
  CONSTRAINT check_debit_or_credit CHECK ((debit_amount > 0 AND credit_amount = 0) OR (credit_amount > 0 AND debit_amount = 0))
);

-- Create account balances table for tracking balances
CREATE TABLE public.account_balances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  account_id UUID NOT NULL,
  balance_date DATE NOT NULL,
  opening_balance NUMERIC NOT NULL DEFAULT 0,
  period_debits NUMERIC NOT NULL DEFAULT 0,
  period_credits NUMERIC NOT NULL DEFAULT 0,
  closing_balance NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT fk_account_balances_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_account_balances_account FOREIGN KEY (account_id) REFERENCES chart_of_accounts(id),
  UNIQUE(tenant_id, account_id, balance_date)
);

-- Create accruals table
CREATE TABLE public.accruals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  accrual_name TEXT NOT NULL,
  description TEXT,
  accrual_type TEXT NOT NULL CHECK (accrual_type IN ('expense', 'revenue', 'liability', 'asset')),
  amount NUMERIC NOT NULL,
  accrual_date DATE NOT NULL,
  reversal_date DATE,
  account_id UUID NOT NULL,
  contra_account_id UUID NOT NULL,
  journal_entry_id UUID,
  reversal_entry_id UUID,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'posted', 'reversed')),
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT fk_accruals_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_accruals_account FOREIGN KEY (account_id) REFERENCES chart_of_accounts(id),
  CONSTRAINT fk_accruals_contra_account FOREIGN KEY (contra_account_id) REFERENCES chart_of_accounts(id),
  CONSTRAINT fk_accruals_journal_entry FOREIGN KEY (journal_entry_id) REFERENCES journal_entries(id),
  CONSTRAINT fk_accruals_reversal_entry FOREIGN KEY (reversal_entry_id) REFERENCES journal_entries(id),
  CONSTRAINT fk_accruals_created_by FOREIGN KEY (created_by) REFERENCES profiles(id)
);

-- Create provisions table
CREATE TABLE public.provisions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  provision_name TEXT NOT NULL,
  description TEXT,
  provision_type TEXT NOT NULL CHECK (provision_type IN ('bad_debt', 'loan_loss', 'depreciation', 'tax', 'other')),
  calculation_method TEXT NOT NULL CHECK (calculation_method IN ('percentage', 'fixed', 'formula')),
  calculation_rate NUMERIC,
  base_amount NUMERIC,
  provision_amount NUMERIC NOT NULL,
  provision_date DATE NOT NULL,
  account_id UUID NOT NULL,
  expense_account_id UUID NOT NULL,
  journal_entry_id UUID,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'posted', 'adjusted')),
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT fk_provisions_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_provisions_account FOREIGN KEY (account_id) REFERENCES chart_of_accounts(id),
  CONSTRAINT fk_provisions_expense_account FOREIGN KEY (expense_account_id) REFERENCES chart_of_accounts(id),
  CONSTRAINT fk_provisions_journal_entry FOREIGN KEY (journal_entry_id) REFERENCES journal_entries(id),
  CONSTRAINT fk_provisions_created_by FOREIGN KEY (created_by) REFERENCES profiles(id)
);

-- Create closing entries table
CREATE TABLE public.closing_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  closing_period TEXT NOT NULL, -- e.g., "2024-12", "2024-Q4", "2024"
  closing_date DATE NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'posted', 'finalized')),
  total_revenue NUMERIC DEFAULT 0,
  total_expenses NUMERIC DEFAULT 0,
  net_income NUMERIC DEFAULT 0,
  retained_earnings_account_id UUID,
  income_summary_account_id UUID,
  journal_entry_id UUID,
  created_by UUID,
  posted_by UUID,
  posted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT fk_closing_entries_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_closing_entries_retained_earnings FOREIGN KEY (retained_earnings_account_id) REFERENCES chart_of_accounts(id),
  CONSTRAINT fk_closing_entries_income_summary FOREIGN KEY (income_summary_account_id) REFERENCES chart_of_accounts(id),
  CONSTRAINT fk_closing_entries_journal_entry FOREIGN KEY (journal_entry_id) REFERENCES journal_entries(id),
  CONSTRAINT fk_closing_entries_created_by FOREIGN KEY (created_by) REFERENCES profiles(id),
  CONSTRAINT fk_closing_entries_posted_by FOREIGN KEY (posted_by) REFERENCES profiles(id),
  UNIQUE(tenant_id, closing_period)
);

-- Enable RLS on all tables
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entry_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accruals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.closing_entries ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Journal entries policies
CREATE POLICY "Users can access their tenant's journal entries" ON public.journal_entries
  FOR ALL USING (tenant_id IN (
    SELECT tenant_id FROM profiles WHERE user_id = auth.uid()
  ));

-- Journal entry lines policies
CREATE POLICY "Users can access their tenant's journal entry lines" ON public.journal_entry_lines
  FOR ALL USING (journal_entry_id IN (
    SELECT id FROM journal_entries WHERE tenant_id IN (
      SELECT tenant_id FROM profiles WHERE user_id = auth.uid()
    )
  ));

-- Account balances policies
CREATE POLICY "Users can access their tenant's account balances" ON public.account_balances
  FOR ALL USING (tenant_id IN (
    SELECT tenant_id FROM profiles WHERE user_id = auth.uid()
  ));

-- Accruals policies
CREATE POLICY "Users can access their tenant's accruals" ON public.accruals
  FOR ALL USING (tenant_id IN (
    SELECT tenant_id FROM profiles WHERE user_id = auth.uid()
  ));

-- Provisions policies
CREATE POLICY "Users can access their tenant's provisions" ON public.provisions
  FOR ALL USING (tenant_id IN (
    SELECT tenant_id FROM profiles WHERE user_id = auth.uid()
  ));

-- Closing entries policies
CREATE POLICY "Users can access their tenant's closing entries" ON public.closing_entries
  FOR ALL USING (tenant_id IN (
    SELECT tenant_id FROM profiles WHERE user_id = auth.uid()
  ));

-- Create indexes for better performance
CREATE INDEX idx_journal_entries_tenant_date ON journal_entries(tenant_id, entry_date);
CREATE INDEX idx_journal_entries_status ON journal_entries(status);
CREATE INDEX idx_journal_entry_lines_entry_id ON journal_entry_lines(journal_entry_id);
CREATE INDEX idx_account_balances_account_date ON account_balances(account_id, balance_date);
CREATE INDEX idx_accruals_tenant_date ON accruals(tenant_id, accrual_date);
CREATE INDEX idx_provisions_tenant_date ON provisions(tenant_id, provision_date);
CREATE INDEX idx_closing_entries_tenant_period ON closing_entries(tenant_id, closing_period);

-- Create triggers for updating timestamps
CREATE TRIGGER update_journal_entries_updated_at
  BEFORE UPDATE ON journal_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_account_balances_updated_at
  BEFORE UPDATE ON account_balances
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_accruals_updated_at
  BEFORE UPDATE ON accruals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_provisions_updated_at
  BEFORE UPDATE ON provisions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_closing_entries_updated_at
  BEFORE UPDATE ON closing_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();