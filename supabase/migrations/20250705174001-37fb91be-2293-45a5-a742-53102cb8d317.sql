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

-- Enable RLS on all new tables
ALTER TABLE public.account_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accruals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.closing_entries ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for new tables
CREATE POLICY "Users can access their tenant's account balances" ON public.account_balances
  FOR ALL USING (tenant_id IN (
    SELECT tenant_id FROM profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can access their tenant's accruals" ON public.accruals
  FOR ALL USING (tenant_id IN (
    SELECT tenant_id FROM profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can access their tenant's provisions" ON public.provisions
  FOR ALL USING (tenant_id IN (
    SELECT tenant_id FROM profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can access their tenant's closing entries" ON public.closing_entries
  FOR ALL USING (tenant_id IN (
    SELECT tenant_id FROM profiles WHERE user_id = auth.uid()
  ));

-- Create indexes for better performance
CREATE INDEX idx_account_balances_account_date ON account_balances(account_id, balance_date);
CREATE INDEX idx_accruals_tenant_date ON accruals(tenant_id, accrual_date);
CREATE INDEX idx_provisions_tenant_date ON provisions(tenant_id, provision_date);
CREATE INDEX idx_closing_entries_tenant_period ON closing_entries(tenant_id, closing_period);

-- Create triggers for updating timestamps
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