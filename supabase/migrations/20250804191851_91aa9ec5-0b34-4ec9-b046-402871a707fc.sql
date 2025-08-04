-- Remove dummy/test data for Umoja Magharibi tenant
-- Clean up foreign key references first

-- Remove user activity sessions for the dummy profile
DELETE FROM user_activity_sessions 
WHERE user_id = '550e8400-e29b-41d4-a716-446655440011';

-- Clean up any other references to the dummy profile
DELETE FROM audit_trails 
WHERE user_id = '550e8400-e29b-41d4-a716-446655440011';

-- Remove any office staff assignments
DELETE FROM office_staff 
WHERE office_id IN (
  SELECT id FROM offices 
  WHERE tenant_id = '1f819953-8f72-4696-88a3-e30aae532d07'
);

-- Clean up any test clients
DELETE FROM clients 
WHERE tenant_id = '1f819953-8f72-4696-88a3-e30aae532d07'
AND (first_name ILIKE '%test%' OR last_name ILIKE '%test%' OR first_name ILIKE '%dummy%');

-- Now remove the dummy "John Manager" profile
DELETE FROM profiles 
WHERE tenant_id = '1f819953-8f72-4696-88a3-e30aae532d07' 
AND id = '550e8400-e29b-41d4-a716-446655440011';

-- Remove head office (clients shouldn't be assigned to head office)
DELETE FROM offices 
WHERE tenant_id = '1f819953-8f72-4696-88a3-e30aae532d07' 
AND office_type = 'head_office';

-- Update BUNGOMA office for proper branch operations
UPDATE offices 
SET 
  parent_office_id = NULL,
  is_active = true
WHERE tenant_id = '1f819953-8f72-4696-88a3-e30aae532d07' 
AND office_code = 'BBR356';