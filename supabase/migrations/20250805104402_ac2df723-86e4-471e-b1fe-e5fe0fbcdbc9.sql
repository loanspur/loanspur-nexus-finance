-- Fix the user profile to be tenant_admin for Umoja Magharibi instead of super_admin
UPDATE profiles 
SET 
  role = 'tenant_admin'::user_role,
  tenant_id = '1f819953-8f72-4696-88a3-e30aae532d07',
  updated_at = now()
WHERE user_id = '79591c7c-540d-4a22-99d7-17b481de8e68';