-- Enhanced Group Management Module

-- Group Meeting Types and Schedules
CREATE TABLE IF NOT EXISTS group_meeting_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  name TEXT NOT NULL,
  description TEXT,
  default_duration_minutes INTEGER NOT NULL DEFAULT 60,
  required_attendance_percentage NUMERIC DEFAULT 75,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Group Meetings
CREATE TABLE IF NOT EXISTS group_meetings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES groups(id),
  meeting_type_id UUID NOT NULL REFERENCES group_meeting_types(id),
  meeting_title TEXT NOT NULL,
  meeting_date DATE NOT NULL,
  meeting_time TIME NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  location TEXT,
  agenda TEXT,
  minutes TEXT,
  facilitator_id UUID REFERENCES profiles(id),
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Meeting Attendance Tracking
CREATE TABLE IF NOT EXISTS meeting_attendance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id UUID NOT NULL REFERENCES group_meetings(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES group_members(id),
  attendance_status TEXT NOT NULL DEFAULT 'absent' CHECK (attendance_status IN ('present', 'absent', 'excused', 'late')),
  check_in_time TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  recorded_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(meeting_id, member_id)
);

-- Group Loan Products (specific to groups)
CREATE TABLE IF NOT EXISTS group_loan_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  product_name TEXT NOT NULL,
  description TEXT,
  min_group_size INTEGER NOT NULL DEFAULT 5,
  max_group_size INTEGER NOT NULL DEFAULT 50,
  min_loan_amount NUMERIC NOT NULL,
  max_loan_amount NUMERIC NOT NULL,
  interest_rate NUMERIC NOT NULL,
  term_months INTEGER NOT NULL,
  group_guarantee_required BOOLEAN NOT NULL DEFAULT true,
  individual_guarantee_amount NUMERIC DEFAULT 0,
  meeting_frequency_required TEXT CHECK (meeting_frequency_required IN ('weekly', 'bi_weekly', 'monthly')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Group Loan Applications
CREATE TABLE IF NOT EXISTS group_loan_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES groups(id),
  product_id UUID NOT NULL REFERENCES group_loan_products(id),
  application_number TEXT NOT NULL UNIQUE,
  requested_amount NUMERIC NOT NULL,
  loan_purpose TEXT NOT NULL,
  repayment_plan TEXT,
  group_resolution TEXT, -- Group decision/resolution
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'approved', 'rejected', 'disbursed')),
  applied_by UUID REFERENCES profiles(id),
  reviewed_by UUID REFERENCES profiles(id),
  approved_by UUID REFERENCES profiles(id),
  applied_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  approved_at TIMESTAMP WITH TIME ZONE,
  disbursement_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Individual Member Loan Allocations within Group Loans
CREATE TABLE IF NOT EXISTS group_loan_member_allocations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_loan_application_id UUID NOT NULL REFERENCES group_loan_applications(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES group_members(id),
  allocated_amount NUMERIC NOT NULL,
  guarantee_amount NUMERIC NOT NULL DEFAULT 0,
  individual_purpose TEXT,
  approval_status TEXT NOT NULL DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Group Savings Accounts
CREATE TABLE IF NOT EXISTS group_savings_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES groups(id),
  account_name TEXT NOT NULL,
  account_number TEXT NOT NULL UNIQUE,
  account_type TEXT NOT NULL CHECK (account_type IN ('general_savings', 'emergency_fund', 'project_fund', 'loan_security')),
  target_amount NUMERIC DEFAULT 0,
  current_balance NUMERIC NOT NULL DEFAULT 0,
  interest_rate NUMERIC DEFAULT 0,
  minimum_contribution NUMERIC DEFAULT 0,
  contribution_frequency TEXT CHECK (contribution_frequency IN ('weekly', 'bi_weekly', 'monthly', 'quarterly')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  opened_date DATE NOT NULL DEFAULT CURRENT_DATE,
  maturity_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Group Member Contributions to Savings
CREATE TABLE IF NOT EXISTS group_savings_contributions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  savings_account_id UUID NOT NULL REFERENCES group_savings_accounts(id),
  member_id UUID NOT NULL REFERENCES group_members(id),
  contribution_amount NUMERIC NOT NULL,
  contribution_date DATE NOT NULL DEFAULT CURRENT_DATE,
  contribution_type TEXT NOT NULL CHECK (contribution_type IN ('regular', 'voluntary', 'penalty', 'interest')),
  payment_method TEXT NOT NULL DEFAULT 'cash' CHECK (payment_method IN ('cash', 'mpesa', 'bank_transfer')),
  reference_number TEXT,
  recorded_by UUID REFERENCES profiles(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Group Member Withdrawals from Savings
CREATE TABLE IF NOT EXISTS group_savings_withdrawals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  savings_account_id UUID NOT NULL REFERENCES group_savings_accounts(id),
  member_id UUID NOT NULL REFERENCES group_members(id),
  withdrawal_amount NUMERIC NOT NULL,
  withdrawal_date DATE NOT NULL DEFAULT CURRENT_DATE,
  withdrawal_reason TEXT NOT NULL,
  approval_status TEXT NOT NULL DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  processed_by UUID REFERENCES profiles(id),
  processed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Group Performance Metrics Cache
CREATE TABLE IF NOT EXISTS group_performance_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES groups(id),
  metric_date DATE NOT NULL,
  total_members INTEGER NOT NULL DEFAULT 0,
  active_members INTEGER NOT NULL DEFAULT 0,
  total_savings_balance NUMERIC NOT NULL DEFAULT 0,
  total_loans_outstanding NUMERIC NOT NULL DEFAULT 0,
  loan_repayment_rate NUMERIC NOT NULL DEFAULT 0,
  meeting_attendance_rate NUMERIC NOT NULL DEFAULT 0,
  savings_target_achievement NUMERIC NOT NULL DEFAULT 0,
  group_solidarity_score NUMERIC NOT NULL DEFAULT 0, -- Based on mutual support metrics
  performance_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(group_id, metric_date)
);

-- Group Leadership and Roles
CREATE TABLE IF NOT EXISTS group_leadership (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES groups(id),
  member_id UUID NOT NULL REFERENCES group_members(id),
  role_title TEXT NOT NULL CHECK (role_title IN ('chairperson', 'secretary', 'treasurer', 'committee_member')),
  role_description TEXT,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  elected_date DATE,
  election_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(group_id, member_id, role_title, start_date)
);

-- Group Rules and Policies
CREATE TABLE IF NOT EXISTS group_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES groups(id),
  rule_category TEXT NOT NULL CHECK (rule_category IN ('attendance', 'savings', 'loans', 'conduct', 'meetings')),
  rule_title TEXT NOT NULL,
  rule_description TEXT NOT NULL,
  penalty_amount NUMERIC DEFAULT 0,
  penalty_type TEXT CHECK (penalty_type IN ('fixed_amount', 'percentage', 'suspension', 'warning')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by UUID REFERENCES profiles(id),
  approved_by_group BOOLEAN NOT NULL DEFAULT false,
  approval_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE group_meeting_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_loan_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_loan_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_loan_member_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_savings_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_savings_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_savings_withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_leadership ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_rules ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can access their tenant's group meeting types" ON group_meeting_types
  FOR ALL USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can access their tenant's group meetings" ON group_meetings
  FOR ALL USING (group_id IN (SELECT id FROM groups WHERE tenant_id IN (SELECT tenant_id FROM profiles WHERE user_id = auth.uid())));

CREATE POLICY "Users can access their tenant's meeting attendance" ON meeting_attendance
  FOR ALL USING (meeting_id IN (SELECT id FROM group_meetings WHERE group_id IN (SELECT id FROM groups WHERE tenant_id IN (SELECT tenant_id FROM profiles WHERE user_id = auth.uid()))));

CREATE POLICY "Users can access their tenant's group loan products" ON group_loan_products
  FOR ALL USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can access their tenant's group loan applications" ON group_loan_applications
  FOR ALL USING (group_id IN (SELECT id FROM groups WHERE tenant_id IN (SELECT tenant_id FROM profiles WHERE user_id = auth.uid())));

CREATE POLICY "Users can access their tenant's group loan allocations" ON group_loan_member_allocations
  FOR ALL USING (group_loan_application_id IN (SELECT id FROM group_loan_applications WHERE group_id IN (SELECT id FROM groups WHERE tenant_id IN (SELECT tenant_id FROM profiles WHERE user_id = auth.uid()))));

CREATE POLICY "Users can access their tenant's group savings accounts" ON group_savings_accounts
  FOR ALL USING (group_id IN (SELECT id FROM groups WHERE tenant_id IN (SELECT tenant_id FROM profiles WHERE user_id = auth.uid())));

CREATE POLICY "Users can access their tenant's group savings contributions" ON group_savings_contributions
  FOR ALL USING (savings_account_id IN (SELECT id FROM group_savings_accounts WHERE group_id IN (SELECT id FROM groups WHERE tenant_id IN (SELECT tenant_id FROM profiles WHERE user_id = auth.uid()))));

CREATE POLICY "Users can access their tenant's group savings withdrawals" ON group_savings_withdrawals
  FOR ALL USING (savings_account_id IN (SELECT id FROM group_savings_accounts WHERE group_id IN (SELECT id FROM groups WHERE tenant_id IN (SELECT tenant_id FROM profiles WHERE user_id = auth.uid()))));

CREATE POLICY "Users can access their tenant's group performance metrics" ON group_performance_metrics
  FOR ALL USING (group_id IN (SELECT id FROM groups WHERE tenant_id IN (SELECT tenant_id FROM profiles WHERE user_id = auth.uid())));

CREATE POLICY "Users can access their tenant's group leadership" ON group_leadership
  FOR ALL USING (group_id IN (SELECT id FROM groups WHERE tenant_id IN (SELECT tenant_id FROM profiles WHERE user_id = auth.uid())));

CREATE POLICY "Users can access their tenant's group rules" ON group_rules
  FOR ALL USING (group_id IN (SELECT id FROM groups WHERE tenant_id IN (SELECT tenant_id FROM profiles WHERE user_id = auth.uid())));

-- Add updated_at triggers
CREATE TRIGGER update_group_meetings_updated_at
  BEFORE UPDATE ON group_meetings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_group_loan_products_updated_at
  BEFORE UPDATE ON group_loan_products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_group_loan_applications_updated_at
  BEFORE UPDATE ON group_loan_applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_group_savings_accounts_updated_at
  BEFORE UPDATE ON group_savings_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_group_savings_withdrawals_updated_at
  BEFORE UPDATE ON group_savings_withdrawals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_group_leadership_updated_at
  BEFORE UPDATE ON group_leadership
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_group_rules_updated_at
  BEFORE UPDATE ON group_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_group_meetings_group_date ON group_meetings(group_id, meeting_date);
CREATE INDEX idx_meeting_attendance_meeting ON meeting_attendance(meeting_id);
CREATE INDEX idx_group_loan_applications_group ON group_loan_applications(group_id, status);
CREATE INDEX idx_group_savings_contributions_account ON group_savings_contributions(savings_account_id, contribution_date);
CREATE INDEX idx_group_performance_metrics_group_date ON group_performance_metrics(group_id, metric_date);
CREATE INDEX idx_group_leadership_group_active ON group_leadership(group_id, is_active);

-- Insert default meeting types for existing tenants
INSERT INTO group_meeting_types (tenant_id, name, description, default_duration_minutes) 
SELECT id, 'Weekly Meeting', 'Regular weekly group meeting', 90 FROM tenants
ON CONFLICT DO NOTHING;

INSERT INTO group_meeting_types (tenant_id, name, description, default_duration_minutes) 
SELECT id, 'Monthly Review', 'Monthly performance and planning meeting', 120 FROM tenants
ON CONFLICT DO NOTHING;

INSERT INTO group_meeting_types (tenant_id, name, description, default_duration_minutes) 
SELECT id, 'Training Session', 'Financial literacy and training session', 180 FROM tenants
ON CONFLICT DO NOTHING;