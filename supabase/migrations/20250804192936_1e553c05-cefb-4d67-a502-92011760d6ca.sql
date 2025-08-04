-- Remove the hardcoded dummy profile that was referenced in migrations
-- This profile should have been cleaned up but let's ensure it's gone
DELETE FROM profiles 
WHERE id = '550e8400-e29b-41d4-a716-446655440011'
AND tenant_id = '1f819953-8f72-4696-88a3-e30aae532d07';

-- Remove the dummy cashier custom role that was created by the dummy profile
DELETE FROM custom_roles 
WHERE created_by = '550e8400-e29b-41d4-a716-446655440011'
AND tenant_id = '1f819953-8f72-4696-88a3-e30aae532d07';