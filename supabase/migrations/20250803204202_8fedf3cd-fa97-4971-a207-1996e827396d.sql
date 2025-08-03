-- Fix the duplicate profile issue
-- First clean up the activity sessions for the duplicate profile
DELETE FROM user_activity_sessions 
WHERE user_id = (
  SELECT id FROM profiles 
  WHERE email = 'umojamagharibi@gmail.com' 
    AND tenant_id = '550e8400-e29b-41d4-a716-446655440001'
);

-- Now delete the incorrect profile (the one assigned to ABC Microfinance)
DELETE FROM profiles 
WHERE email = 'umojamagharibi@gmail.com' 
  AND tenant_id = '550e8400-e29b-41d4-a716-446655440001';

-- Verify we have the correct profile remaining
SELECT email, tenant_id, (SELECT name FROM tenants WHERE id = tenant_id) as tenant_name
FROM profiles 
WHERE email = 'umojamagharibi@gmail.com';