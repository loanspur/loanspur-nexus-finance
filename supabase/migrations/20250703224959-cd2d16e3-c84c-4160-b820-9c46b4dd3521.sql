-- Audit & Compliance System

-- Audit Actions Enum
CREATE TYPE audit_action AS ENUM (
  'CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 
  'EXPORT', 'IMPORT', 'BACKUP', 'RESTORE', 'VIEW'
);

-- Audit Trails Table
CREATE TABLE IF NOT EXISTS audit_trails (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  user_id UUID REFERENCES profiles(id),
  table_name TEXT NOT NULL,
  record_id UUID,
  action audit_action NOT NULL,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  session_id TEXT,
  risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high', 'critical')) DEFAULT 'low',
  compliance_flags JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User Activity Sessions
CREATE TABLE IF NOT EXISTS user_activity_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id),
  session_token TEXT NOT NULL UNIQUE,
  ip_address INET,
  user_agent TEXT,
  device_fingerprint TEXT,
  login_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  logout_time TIMESTAMP WITH TIME ZONE,
  last_activity TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  location_data JSONB,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User Activity Logs
CREATE TABLE IF NOT EXISTS user_activity_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES user_activity_sessions(id),
  user_id UUID NOT NULL REFERENCES profiles(id),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  activity_type TEXT NOT NULL,
  activity_description TEXT,
  page_url TEXT,
  api_endpoint TEXT,
  request_method TEXT,
  response_status INTEGER,
  duration_ms INTEGER,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Compliance Rules
CREATE TABLE IF NOT EXISTS compliance_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  rule_name TEXT NOT NULL,
  rule_description TEXT,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('data_retention', 'access_control', 'privacy', 'security', 'financial')),
  rule_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'error', 'critical')) DEFAULT 'warning',
  is_active BOOLEAN NOT NULL DEFAULT true,
  auto_remediation BOOLEAN NOT NULL DEFAULT false,
  remediation_config JSONB DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Compliance Violations
CREATE TABLE IF NOT EXISTS compliance_violations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  rule_id UUID NOT NULL REFERENCES compliance_rules(id),
  violation_type TEXT NOT NULL,
  violation_description TEXT NOT NULL,
  affected_table TEXT,
  affected_record_id UUID,
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  status TEXT NOT NULL CHECK (status IN ('open', 'investigating', 'resolved', 'ignored')) DEFAULT 'open',
  auto_detected BOOLEAN NOT NULL DEFAULT true,
  detection_details JSONB DEFAULT '{}'::jsonb,
  resolution_notes TEXT,
  resolved_by UUID REFERENCES profiles(id),
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Data Backups
CREATE TABLE IF NOT EXISTS data_backups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  backup_name TEXT NOT NULL,
  backup_type TEXT NOT NULL CHECK (backup_type IN ('full', 'incremental', 'differential')),
  backup_scope TEXT NOT NULL CHECK (backup_scope IN ('all_data', 'tenant_data', 'specific_tables')),
  backup_config JSONB DEFAULT '{}'::jsonb,
  file_path TEXT,
  file_size BIGINT,
  checksum TEXT,
  backup_status TEXT NOT NULL CHECK (backup_status IN ('pending', 'in_progress', 'completed', 'failed')) DEFAULT 'pending',
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  retention_until DATE,
  backup_metadata JSONB DEFAULT '{}'::jsonb,
  error_message TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- System Health Metrics
CREATE TABLE IF NOT EXISTS system_health_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id), -- NULL for system-wide metrics
  metric_name TEXT NOT NULL,
  metric_value NUMERIC NOT NULL,
  metric_unit TEXT,
  metric_type TEXT NOT NULL CHECK (metric_type IN ('performance', 'security', 'compliance', 'availability')),
  threshold_warning NUMERIC,
  threshold_critical NUMERIC,
  status TEXT CHECK (status IN ('healthy', 'warning', 'critical')) DEFAULT 'healthy',
  metadata JSONB DEFAULT '{}'::jsonb,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Compliance Reports
CREATE TABLE IF NOT EXISTS compliance_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  report_name TEXT NOT NULL,
  report_type TEXT NOT NULL CHECK (report_type IN ('audit_summary', 'compliance_status', 'risk_assessment', 'activity_analysis')),
  report_period_start DATE NOT NULL,
  report_period_end DATE NOT NULL,
  report_data JSONB NOT NULL,
  report_status TEXT NOT NULL CHECK (report_status IN ('generating', 'completed', 'failed')) DEFAULT 'generating',
  file_url TEXT,
  generated_by UUID REFERENCES profiles(id),
  generated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE audit_trails ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_backups ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_health_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can access their tenant's audit trails" ON audit_trails
  FOR ALL USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can access their tenant's activity sessions" ON user_activity_sessions
  FOR ALL USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can access their tenant's activity logs" ON user_activity_logs
  FOR ALL USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can access their tenant's compliance rules" ON compliance_rules
  FOR ALL USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can access their tenant's compliance violations" ON compliance_violations
  FOR ALL USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can access their tenant's data backups" ON data_backups
  FOR ALL USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can access system health metrics" ON system_health_metrics
  FOR ALL USING (tenant_id IS NULL OR tenant_id IN (SELECT tenant_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can access their tenant's compliance reports" ON compliance_reports
  FOR ALL USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE user_id = auth.uid()));

-- Updated_at triggers
CREATE TRIGGER update_compliance_rules_updated_at
  BEFORE UPDATE ON compliance_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_compliance_violations_updated_at
  BEFORE UPDATE ON compliance_violations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Indexes for performance
CREATE INDEX idx_audit_trails_tenant_table ON audit_trails(tenant_id, table_name, created_at);
CREATE INDEX idx_audit_trails_user_action ON audit_trails(user_id, action, created_at);
CREATE INDEX idx_user_activity_sessions_user ON user_activity_sessions(user_id, is_active);
CREATE INDEX idx_user_activity_logs_session ON user_activity_logs(session_id, created_at);
CREATE INDEX idx_compliance_violations_status ON compliance_violations(tenant_id, status, severity);
CREATE INDEX idx_data_backups_tenant_status ON data_backups(tenant_id, backup_status, created_at);
CREATE INDEX idx_system_health_metrics_type ON system_health_metrics(metric_type, recorded_at);

-- Audit Trail Function
CREATE OR REPLACE FUNCTION log_audit_trail()
RETURNS TRIGGER AS $$
DECLARE
  current_user_id UUID;
  current_tenant_id UUID;
BEGIN
  -- Get current user and tenant from profiles
  SELECT p.id, p.tenant_id INTO current_user_id, current_tenant_id
  FROM profiles p WHERE p.user_id = auth.uid();

  -- Skip if no user context (system operations)
  IF current_tenant_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Log the change
  INSERT INTO audit_trails (
    tenant_id,
    user_id,
    table_name,
    record_id,
    action,
    old_values,
    new_values
  ) VALUES (
    current_tenant_id,
    current_user_id,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    TG_OP::audit_action,
    CASE WHEN TG_OP != 'INSERT' THEN row_to_json(OLD) ELSE NULL END,
    CASE WHEN TG_OP != 'DELETE' THEN row_to_json(NEW) ELSE NULL END
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create audit triggers for key tables
CREATE TRIGGER audit_clients AFTER INSERT OR UPDATE OR DELETE ON clients
  FOR EACH ROW EXECUTE FUNCTION log_audit_trail();

CREATE TRIGGER audit_groups AFTER INSERT OR UPDATE OR DELETE ON groups
  FOR EACH ROW EXECUTE FUNCTION log_audit_trail();

CREATE TRIGGER audit_loans AFTER INSERT OR UPDATE OR DELETE ON loans
  FOR EACH ROW EXECUTE FUNCTION log_audit_trail();

CREATE TRIGGER audit_loan_payments AFTER INSERT OR UPDATE OR DELETE ON loan_payments
  FOR EACH ROW EXECUTE FUNCTION log_audit_trail();

CREATE TRIGGER audit_profiles AFTER INSERT OR UPDATE OR DELETE ON profiles
  FOR EACH ROW EXECUTE FUNCTION log_audit_trail();

-- Insert default compliance rules
INSERT INTO compliance_rules (tenant_id, rule_name, rule_description, rule_type, rule_config, severity) 
SELECT id, 'Data Retention Policy', 'Ensure data is retained according to regulatory requirements', 'data_retention', 
'{"retention_days": 2555, "apply_to": ["clients", "loans", "payments"]}'::jsonb, 'warning' FROM tenants
ON CONFLICT DO NOTHING;

INSERT INTO compliance_rules (tenant_id, rule_name, rule_description, rule_type, rule_config, severity) 
SELECT id, 'Access Control Validation', 'Validate user access patterns for anomalies', 'access_control', 
'{"max_failed_logins": 5, "session_timeout_hours": 8}'::jsonb, 'error' FROM tenants
ON CONFLICT DO NOTHING;

-- Insert default health metrics
INSERT INTO system_health_metrics (metric_name, metric_value, metric_unit, metric_type, threshold_warning, threshold_critical)
VALUES 
('database_connections', 0, 'count', 'performance', 80, 95),
('api_response_time', 0, 'ms', 'performance', 1000, 3000),
('failed_login_rate', 0, 'percentage', 'security', 10, 25),
('compliance_score', 100, 'percentage', 'compliance', 80, 60)
ON CONFLICT DO NOTHING;