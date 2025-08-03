-- Fix duplicate user profile issue for umojamagharibi@gmail.com
-- Reactivate the original user's profile and assign correct tenant
UPDATE profiles 
SET tenant_id = '1f819953-8f72-4696-88a3-e30aae532d07', -- Umoja Magharibi
    is_active = true,
    updated_at = now()
WHERE user_id = 'd3ee51ba-0fa8-4cb1-9fd1-f7822274281e' 
  AND email = 'umojamagharibi@gmail.com';

-- Deactivate the duplicate profile
UPDATE profiles 
SET is_active = false,
    updated_at = now()
WHERE user_id = 'e43021aa-cd77-476e-8117-7f8c97134998'
  AND email = 'umojamagharibi@gmail.com';

-- Verify the fix - should show one active profile for umojamagharibi@gmail.com
SELECT 
  p.email,
  p.user_id,
  p.tenant_id,
  p.is_active,
  p.role,
  t.name as tenant_name
FROM profiles p
LEFT JOIN tenants t ON p.tenant_id = t.id
WHERE p.email = 'umojamagharibi@gmail.com'
ORDER BY p.is_active DESC, p.created_at;