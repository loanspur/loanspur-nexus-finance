-- Instead of deleting, let's update the duplicate profile issue differently
-- We'll set the duplicate profile's tenant_id to NULL and make it inactive
-- This preserves data integrity while fixing the login issue

UPDATE profiles 
SET tenant_id = NULL,
    is_active = false,
    updated_at = now()
WHERE email = 'umojamagharibi@gmail.com' 
  AND tenant_id = '550e8400-e29b-41d4-a716-446655440001'; -- ABC Microfinance

-- Verify the remaining active profile
SELECT 
  email, 
  tenant_id, 
  is_active,
  (SELECT name FROM tenants WHERE id = tenant_id) as tenant_name
FROM profiles 
WHERE email = 'umojamagharibi@gmail.com' 
  AND is_active = true;