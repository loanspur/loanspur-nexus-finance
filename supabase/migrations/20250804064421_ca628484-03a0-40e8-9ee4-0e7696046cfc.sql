-- Enhanced Role and Permissions System
-- This migration enhances the existing permissions system without breaking current functionality

-- 1. Add tenant-level maker-checker configuration
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS maker_checker_enabled boolean DEFAULT false;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS maker_checker_settings jsonb DEFAULT '{
  "global_enabled": false,
  "minimum_approval_amount": 0,
  "auto_approve_threshold": 0,
  "require_different_approver": true
}'::jsonb;

-- 2. Add permission bundling and enhanced metadata
ALTER TABLE permissions ADD COLUMN IF NOT EXISTS permission_bundle text;
ALTER TABLE permissions ADD COLUMN IF NOT EXISTS display_order integer DEFAULT 0;
ALTER TABLE permissions ADD COLUMN IF NOT EXISTS is_core_permission boolean DEFAULT true;
ALTER TABLE permissions ADD COLUMN IF NOT EXISTS permission_group text;

-- 3. Add comprehensive system permissions
INSERT INTO permissions (name, description, module, action, permission_bundle, permission_group, display_order, requires_maker_checker, maker_checker_enabled) VALUES
-- Accounting Module
('accounting.chart_of_accounts.create', 'Create chart of accounts', 'accounting', 'create', 'accounting_management', 'chart_of_accounts', 10, false, false),
('accounting.chart_of_accounts.read', 'View chart of accounts', 'accounting', 'read', 'accounting_management', 'chart_of_accounts', 11, false, false),
('accounting.chart_of_accounts.update', 'Update chart of accounts', 'accounting', 'update', 'accounting_management', 'chart_of_accounts', 12, false, false),
('accounting.chart_of_accounts.delete', 'Delete chart of accounts', 'accounting', 'delete', 'accounting_management', 'chart_of_accounts', 13, true, true),

('accounting.journal_entries.create', 'Create journal entries', 'accounting', 'create', 'accounting_management', 'journal_entries', 20, false, false),
('accounting.journal_entries.read', 'View journal entries', 'accounting', 'read', 'accounting_management', 'journal_entries', 21, false, false),
('accounting.journal_entries.update', 'Update journal entries', 'accounting', 'update', 'accounting_management', 'journal_entries', 22, true, true),
('accounting.journal_entries.delete', 'Delete journal entries', 'accounting', 'delete', 'accounting_management', 'journal_entries', 23, true, true),
('accounting.journal_entries.post', 'Post journal entries', 'accounting', 'post', 'accounting_management', 'journal_entries', 24, true, true),

('accounting.accruals.create', 'Create accruals', 'accounting', 'create', 'accounting_management', 'accruals', 30, false, false),
('accounting.accruals.read', 'View accruals', 'accounting', 'read', 'accounting_management', 'accruals', 31, false, false),
('accounting.accruals.update', 'Update accruals', 'accounting', 'update', 'accounting_management', 'accruals', 32, false, false),
('accounting.accruals.delete', 'Delete accruals', 'accounting', 'delete', 'accounting_management', 'accruals', 33, true, true),

-- Payments Module
('payments.transactions.create', 'Process payments', 'payments', 'create', 'payment_management', 'transactions', 40, false, false),
('payments.transactions.read', 'View payment transactions', 'payments', 'read', 'payment_management', 'transactions', 41, false, false),
('payments.transactions.update', 'Update payment transactions', 'payments', 'update', 'payment_management', 'transactions', 42, true, true),
('payments.transactions.delete', 'Delete payment transactions', 'payments', 'delete', 'payment_management', 'transactions', 43, true, true),
('payments.transactions.reverse', 'Reverse payments', 'payments', 'reverse', 'payment_management', 'transactions', 44, true, true),

('payments.reconciliation.create', 'Create reconciliation', 'payments', 'create', 'payment_management', 'reconciliation', 50, false, false),
('payments.reconciliation.read', 'View reconciliation', 'payments', 'read', 'payment_management', 'reconciliation', 51, false, false),
('payments.reconciliation.update', 'Update reconciliation', 'payments', 'update', 'payment_management', 'reconciliation', 52, false, false),
('payments.reconciliation.approve', 'Approve reconciliation', 'payments', 'approve', 'payment_management', 'reconciliation', 53, true, true),

-- Documents Module
('documents.templates.create', 'Create document templates', 'documents', 'create', 'document_management', 'templates', 60, false, false),
('documents.templates.read', 'View document templates', 'documents', 'read', 'document_management', 'templates', 61, false, false),
('documents.templates.update', 'Update document templates', 'documents', 'update', 'document_management', 'templates', 62, false, false),
('documents.templates.delete', 'Delete document templates', 'documents', 'delete', 'document_management', 'templates', 63, false, false),

('documents.client_documents.create', 'Upload client documents', 'documents', 'create', 'document_management', 'client_documents', 70, false, false),
('documents.client_documents.read', 'View client documents', 'documents', 'read', 'document_management', 'client_documents', 71, false, false),
('documents.client_documents.update', 'Update client documents', 'documents', 'update', 'document_management', 'client_documents', 72, false, false),
('documents.client_documents.delete', 'Delete client documents', 'documents', 'delete', 'document_management', 'client_documents', 73, true, true),

-- Compliance Module
('compliance.rules.create', 'Create compliance rules', 'compliance', 'create', 'compliance_management', 'rules', 80, false, false),
('compliance.rules.read', 'View compliance rules', 'compliance', 'read', 'compliance_management', 'rules', 81, false, false),
('compliance.rules.update', 'Update compliance rules', 'compliance', 'update', 'compliance_management', 'rules', 82, false, false),
('compliance.rules.delete', 'Delete compliance rules', 'compliance', 'delete', 'compliance_management', 'rules', 83, true, true),

('compliance.violations.read', 'View compliance violations', 'compliance', 'read', 'compliance_management', 'violations', 90, false, false),
('compliance.violations.resolve', 'Resolve compliance violations', 'compliance', 'resolve', 'compliance_management', 'violations', 91, true, true),

-- Settings Module
('settings.tenant.read', 'View tenant settings', 'settings', 'read', 'system_administration', 'tenant', 100, false, false),
('settings.tenant.update', 'Update tenant settings', 'settings', 'update', 'system_administration', 'tenant', 101, true, true),

('settings.users.create', 'Create users', 'settings', 'create', 'system_administration', 'users', 110, false, false),
('settings.users.read', 'View users', 'settings', 'read', 'system_administration', 'users', 111, false, false),
('settings.users.update', 'Update users', 'settings', 'update', 'system_administration', 'users', 112, false, false),
('settings.users.delete', 'Delete users', 'settings', 'delete', 'system_administration', 'users', 113, true, true),
('settings.users.activate', 'Activate/Deactivate users', 'settings', 'activate', 'system_administration', 'users', 114, true, true),

('settings.roles.create', 'Create roles', 'settings', 'create', 'system_administration', 'roles', 120, false, false),
('settings.roles.read', 'View roles', 'settings', 'read', 'system_administration', 'roles', 121, false, false),
('settings.roles.update', 'Update roles', 'settings', 'update', 'system_administration', 'roles', 122, false, false),
('settings.roles.delete', 'Delete roles', 'settings', 'delete', 'system_administration', 'roles', 123, true, true),

-- Integrations Module
('integrations.mifos.read', 'View MifoS integration', 'integrations', 'read', 'system_integrations', 'mifos', 130, false, false),
('integrations.mifos.update', 'Configure MifoS integration', 'integrations', 'update', 'system_integrations', 'mifos', 131, true, true),

('integrations.mpesa.read', 'View M-Pesa integration', 'integrations', 'read', 'system_integrations', 'mpesa', 140, false, false),
('integrations.mpesa.update', 'Configure M-Pesa integration', 'integrations', 'update', 'system_integrations', 'mpesa', 141, true, true),

-- Notifications Module
('notifications.read', 'View notifications', 'notifications', 'read', 'communication', 'notifications', 150, false, false),
('notifications.create', 'Send notifications', 'notifications', 'create', 'communication', 'notifications', 151, false, false),
('notifications.delete', 'Delete notifications', 'notifications', 'delete', 'communication', 'notifications', 152, false, false),

-- Savings Module (enhance existing)
('savings.accounts.create', 'Create savings accounts', 'savings', 'create', 'savings_management', 'accounts', 160, false, false),
('savings.accounts.read', 'View savings accounts', 'savings', 'read', 'savings_management', 'accounts', 161, false, false),
('savings.accounts.update', 'Update savings accounts', 'savings', 'update', 'savings_management', 'accounts', 162, false, false),
('savings.accounts.delete', 'Delete savings accounts', 'savings', 'delete', 'savings_management', 'accounts', 163, true, true),
('savings.accounts.activate', 'Activate savings accounts', 'savings', 'activate', 'savings_management', 'accounts', 164, true, true),

('savings.products.create', 'Create savings products', 'savings', 'create', 'savings_management', 'products', 170, false, false),
('savings.products.read', 'View savings products', 'savings', 'read', 'savings_management', 'products', 171, false, false),
('savings.products.update', 'Update savings products', 'savings', 'update', 'savings_management', 'products', 172, false, false),
('savings.products.delete', 'Delete savings products', 'savings', 'delete', 'savings_management', 'products', 173, true, true),

('savings.transactions.create', 'Process savings transactions', 'savings', 'create', 'savings_management', 'transactions', 180, false, false),
('savings.transactions.read', 'View savings transactions', 'savings', 'read', 'savings_management', 'transactions', 181, false, false),
('savings.transactions.reverse', 'Reverse savings transactions', 'savings', 'reverse', 'savings_management', 'transactions', 182, true, true)

ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  permission_bundle = EXCLUDED.permission_bundle,
  permission_group = EXCLUDED.permission_group,
  display_order = EXCLUDED.display_order,
  updated_at = now();

-- Update existing permissions with bundling info
UPDATE permissions SET 
  permission_bundle = CASE 
    WHEN module = 'clients' THEN 'client_management'
    WHEN module = 'loans' THEN 'loan_management'
    WHEN module = 'groups' THEN 'group_management'
    WHEN module = 'reports' THEN 'reporting'
    ELSE 'other'
  END,
  permission_group = CASE 
    WHEN module = 'clients' THEN 'clients'
    WHEN module = 'loans' THEN 'loans'
    WHEN module = 'groups' THEN 'groups'
    WHEN module = 'reports' THEN 'reports'
    ELSE 'other'
  END,
  display_order = CASE 
    WHEN module = 'clients' AND action = 'create' THEN 1
    WHEN module = 'clients' AND action = 'read' THEN 2
    WHEN module = 'clients' AND action = 'update' THEN 3
    WHEN module = 'clients' AND action = 'approve' THEN 4
    WHEN module = 'clients' AND action = 'delete' THEN 5
    WHEN module = 'loans' AND action = 'create' THEN 1
    WHEN module = 'loans' AND action = 'read' THEN 2
    WHEN module = 'loans' AND action = 'update' THEN 3
    WHEN module = 'loans' AND action = 'approve' THEN 4
    WHEN module = 'loans' AND action = 'disburse' THEN 5
    WHEN module = 'loans' AND action = 'delete' THEN 6
    ELSE 0
  END
WHERE permission_bundle IS NULL;

-- Create default system roles with comprehensive permissions

-- Admin Role (full access to everything)
DO $$
DECLARE
  admin_permissions CURSOR FOR 
    SELECT id FROM permissions WHERE name NOT LIKE 'super_admin.%';
  perm_record RECORD;
BEGIN
  -- Clear existing admin permissions and recreate comprehensive set
  DELETE FROM role_permissions WHERE role = 'admin';
  
  FOR perm_record IN admin_permissions LOOP
    INSERT INTO role_permissions (role, permission_id, tenant_id, can_make, can_check)
    SELECT 'admin', perm_record.id, tenants.id, true, true
    FROM tenants
    ON CONFLICT DO NOTHING;
  END LOOP;
END $$;

-- Read-Only Role (read access to all modules)
DO $$
DECLARE
  readonly_permissions CURSOR FOR 
    SELECT id FROM permissions WHERE action = 'read' AND name NOT LIKE 'super_admin.%';
  perm_record RECORD;
BEGIN
  -- Clear existing read-only permissions
  DELETE FROM role_permissions WHERE role = 'read_only';
  
  FOR perm_record IN readonly_permissions LOOP
    INSERT INTO role_permissions (role, permission_id, tenant_id, can_make, can_check)
    SELECT 'read_only', perm_record.id, tenants.id, true, false
    FROM tenants
    ON CONFLICT DO NOTHING;
  END LOOP;
END $$;

-- Accountant Role (accounting + basic client/loan read access)
DO $$
DECLARE
  accountant_permissions CURSOR FOR 
    SELECT id FROM permissions 
    WHERE (module = 'accounting' OR 
           module = 'payments' OR 
           (module IN ('clients', 'loans', 'savings') AND action = 'read') OR
           module = 'reports')
    AND name NOT LIKE 'super_admin.%';
  perm_record RECORD;
BEGIN
  -- Clear existing accountant permissions
  DELETE FROM role_permissions WHERE role = 'accountant';
  
  FOR perm_record IN accountant_permissions LOOP
    INSERT INTO role_permissions (role, permission_id, tenant_id, can_make, can_check)
    SELECT 'accountant', perm_record.id, tenants.id, 
           CASE WHEN action IN ('delete', 'post', 'approve') THEN false ELSE true END,
           CASE WHEN requires_maker_checker = true THEN true ELSE false END
    FROM tenants, permissions 
    WHERE permissions.id = perm_record.id
    ON CONFLICT DO NOTHING;
  END LOOP;
END $$;

-- Manager Role (can do everything except critical deletions)
DO $$
DECLARE
  manager_permissions CURSOR FOR 
    SELECT id FROM permissions 
    WHERE action != 'delete' AND name NOT LIKE 'super_admin.%';
  perm_record RECORD;
BEGIN
  -- Clear existing manager permissions
  DELETE FROM role_permissions WHERE role = 'manager';
  
  FOR perm_record IN manager_permissions LOOP
    INSERT INTO role_permissions (role, permission_id, tenant_id, can_make, can_check)
    SELECT 'manager', perm_record.id, tenants.id, true, true
    FROM tenants
    ON CONFLICT DO NOTHING;
  END LOOP;
END $$;