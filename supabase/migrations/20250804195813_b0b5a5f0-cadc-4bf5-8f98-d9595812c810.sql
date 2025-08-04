-- Fix the user ID mismatch by updating the legitimate profile 
-- to use the auth user ID that actually exists

UPDATE profiles 
SET user_id = 'd3ee51ba-0fa8-4cb1-9fd1-f7822274281e',
    updated_at = now()
WHERE email = 'umojamagharibi@gmail.com' 
AND tenant_id = '1f819953-8f72-4696-88a3-e30aae532d07';