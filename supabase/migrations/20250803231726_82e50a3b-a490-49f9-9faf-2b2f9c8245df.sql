-- Insert default role permissions for tenant_admin role to demonstrate the UI
INSERT INTO role_permissions (role, permission_id, tenant_id, can_make, can_check)
SELECT 
  'tenant_admin',
  p.id,
  '1f819953-8f72-4696-88a3-e30aae532d07',
  true,
  CASE WHEN p.requires_maker_checker THEN false ELSE true END
FROM permissions p
WHERE p.module IN ('users', 'clients', 'loans', 'savings', 'reports')
LIMIT 15;

-- Insert some permissions for loan_officer role as well
INSERT INTO role_permissions (role, permission_id, tenant_id, can_make, can_check)
SELECT 
  'loan_officer',
  p.id,
  '1f819953-8f72-4696-88a3-e30aae532d07',
  true,
  false
FROM permissions p
WHERE p.module IN ('clients', 'loans') AND p.action IN ('read', 'create', 'update')
LIMIT 10;