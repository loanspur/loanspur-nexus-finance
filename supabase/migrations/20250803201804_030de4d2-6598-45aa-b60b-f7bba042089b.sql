-- Temporarily update the Umoja Magharibi admin password to a known value for testing
-- This will allow the admin to login and then change their password
UPDATE auth.users 
SET encrypted_password = crypt('TempPassword123!', gen_salt('bf'))
WHERE email = 'umojamagharibi@gmail.com';