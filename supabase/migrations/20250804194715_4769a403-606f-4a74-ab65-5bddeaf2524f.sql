-- Activate the legitimate Umoja Magharibi user profile
UPDATE profiles 
SET is_active = true, 
    updated_at = now()
WHERE tenant_id = '1f819953-8f72-4696-88a3-e30aae532d07' 
AND email = 'umojamagharibi@gmail.com';