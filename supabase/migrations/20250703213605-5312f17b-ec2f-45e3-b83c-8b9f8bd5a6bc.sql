-- Enhanced Loan Management Tables

-- Loan Applications Table
CREATE TABLE IF NOT EXISTS loan_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  client_id UUID NOT NULL REFERENCES clients(id),
  loan_product_id UUID NOT NULL REFERENCES loan_products(id),
  application_number TEXT NOT NULL UNIQUE,
  requested_amount NUMERIC NOT NULL,
  requested_term INTEGER NOT NULL,
  purpose TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'approved', 'rejected', 'withdrawn')),
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  approval_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Loan Approval Workflow
CREATE TABLE IF NOT EXISTS loan_approvals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  loan_application_id UUID NOT NULL REFERENCES loan_applications(id),
  approver_id UUID NOT NULL REFERENCES profiles(id),
  approval_level INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
  decision_notes TEXT,
  approved_amount NUMERIC,
  approved_term INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Loan Repayment Schedules
CREATE TABLE IF NOT EXISTS loan_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  loan_id UUID NOT NULL REFERENCES loans(id),
  installment_number INTEGER NOT NULL,
  due_date DATE NOT NULL,
  principal_amount NUMERIC NOT NULL DEFAULT 0,
  interest_amount NUMERIC NOT NULL DEFAULT 0,
  fee_amount NUMERIC NOT NULL DEFAULT 0,
  total_amount NUMERIC NOT NULL,
  paid_amount NUMERIC NOT NULL DEFAULT 0,
  outstanding_amount NUMERIC NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'partial', 'paid', 'overdue')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Loan Payments
CREATE TABLE IF NOT EXISTS loan_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  loan_id UUID NOT NULL REFERENCES loans(id),
  schedule_id UUID REFERENCES loan_schedules(id),
  payment_amount NUMERIC NOT NULL,
  principal_amount NUMERIC NOT NULL DEFAULT 0,
  interest_amount NUMERIC NOT NULL DEFAULT 0,
  fee_amount NUMERIC NOT NULL DEFAULT 0,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT NOT NULL DEFAULT 'cash',
  reference_number TEXT,
  processed_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Collections Management
CREATE TABLE IF NOT EXISTS loan_collections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  loan_id UUID NOT NULL REFERENCES loans(id),
  collection_status TEXT NOT NULL DEFAULT 'active' CHECK (collection_status IN ('active', 'resolved', 'written_off')),
  days_overdue INTEGER NOT NULL DEFAULT 0,
  overdue_amount NUMERIC NOT NULL DEFAULT 0,
  last_contact_date DATE,
  next_action_date DATE,
  collection_notes TEXT,
  assigned_to UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enhanced Savings Management Tables

-- Savings Transactions
CREATE TABLE IF NOT EXISTS savings_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  savings_account_id UUID NOT NULL REFERENCES savings_accounts(id),
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('deposit', 'withdrawal', 'interest_posting', 'fee_charge')),
  amount NUMERIC NOT NULL,
  balance_after NUMERIC NOT NULL,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT,
  reference_number TEXT,
  processed_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Interest Calculations
CREATE TABLE IF NOT EXISTS savings_interest_postings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  savings_account_id UUID NOT NULL REFERENCES savings_accounts(id),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  average_balance NUMERIC NOT NULL,
  interest_rate NUMERIC NOT NULL,
  interest_amount NUMERIC NOT NULL,
  posting_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'calculated' CHECK (status IN ('calculated', 'posted', 'reversed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE loan_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE loan_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE loan_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE loan_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE loan_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings_interest_postings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can access their tenant's loan applications" ON loan_applications
  FOR ALL USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can access their tenant's loan approvals" ON loan_approvals
  FOR ALL USING (loan_application_id IN (SELECT id FROM loan_applications WHERE tenant_id IN (SELECT tenant_id FROM profiles WHERE user_id = auth.uid())));

CREATE POLICY "Users can access their tenant's loan schedules" ON loan_schedules
  FOR ALL USING (loan_id IN (SELECT id FROM loans WHERE tenant_id IN (SELECT tenant_id FROM profiles WHERE user_id = auth.uid())));

CREATE POLICY "Users can access their tenant's loan payments" ON loan_payments
  FOR ALL USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can access their tenant's loan collections" ON loan_collections
  FOR ALL USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can access their tenant's savings transactions" ON savings_transactions
  FOR ALL USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can access their tenant's savings interest postings" ON savings_interest_postings
  FOR ALL USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE user_id = auth.uid()));

-- Add updated_at triggers
CREATE TRIGGER update_loan_applications_updated_at
  BEFORE UPDATE ON loan_applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_loan_collections_updated_at
  BEFORE UPDATE ON loan_collections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();