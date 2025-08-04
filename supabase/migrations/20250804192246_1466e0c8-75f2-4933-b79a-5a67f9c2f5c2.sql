-- Complete cleanup of dummy data for Umoja Magharibi tenant

-- Remove all references to the dummy profile systematically
DELETE FROM user_activity_logs 
WHERE user_id = '550e8400-e29b-41d4-a716-446655440011';

DELETE FROM user_activity_logs 
WHERE session_id IN (
  SELECT id FROM user_activity_sessions 
  WHERE user_id = '550e8400-e29b-41d4-a716-446655440011'
);

DELETE FROM user_activity_sessions 
WHERE user_id = '550e8400-e29b-41d4-a716-446655440011';

DELETE FROM audit_trails 
WHERE user_id = '550e8400-e29b-41d4-a716-446655440011';

DELETE FROM custom_roles 
WHERE created_by = '550e8400-e29b-41d4-a716-446655440011';

DELETE FROM approval_workflows 
WHERE created_by = '550e8400-e29b-41d4-a716-446655440011';

DELETE FROM approval_requests 
WHERE created_by = '550e8400-e29b-41d4-a716-446655440011';

DELETE FROM approval_actions 
WHERE approver_id = '550e8400-e29b-41d4-a716-446655440011';

DELETE FROM office_staff 
WHERE staff_id = '550e8400-e29b-41d4-a716-446655440011';

DELETE FROM office_staff 
WHERE office_id IN (
  SELECT id FROM offices 
  WHERE tenant_id = '1f819953-8f72-4696-88a3-e30aae532d07'
);

-- Clean up any test clients
DELETE FROM clients 
WHERE tenant_id = '1f819953-8f72-4696-88a3-e30aae532d07'
AND (first_name ILIKE '%test%' OR last_name ILIKE '%test%' OR first_name ILIKE '%dummy%');

-- Now remove the dummy profile
DELETE FROM profiles 
WHERE tenant_id = '1f819953-8f72-4696-88a3-e30aae532d07' 
AND id = '550e8400-e29b-41d4-a716-446655440011';

-- Remove head office
DELETE FROM offices 
WHERE tenant_id = '1f819953-8f72-4696-88a3-e30aae532d07' 
AND office_type = 'head_office';

-- Ensure BUNGOMA branch is properly configured
UPDATE offices 
SET 
  parent_office_id = NULL,
  is_active = true
WHERE tenant_id = '1f819953-8f72-4696-88a3-e30aae532d07' 
AND office_code = 'BBR356';