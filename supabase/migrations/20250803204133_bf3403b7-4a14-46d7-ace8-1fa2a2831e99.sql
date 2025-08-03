-- Fix the duplicate profile issue
-- First, let's see which profile is the correct one for Umoja Magharibi
-- The user should only have one profile per tenant

-- Delete the incorrect profile (the one assigned to ABC Microfinance for umojamagharibi@gmail.com)
-- Keep the one assigned to Umoja Magharibi
DELETE FROM profiles 
WHERE email = 'umojamagharibi@gmail.com' 
  AND tenant_id = '550e8400-e29b-41d4-a716-446655440001'; -- ABC Microfinance

-- Also add a unique constraint to prevent this in the future
ALTER TABLE profiles ADD CONSTRAINT unique_user_id_tenant UNIQUE (user_id, tenant_id);

-- Add an additional constraint to prevent duplicate emails across different auth users
-- (This ensures one email = one auth user, which should be the case)
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_email_unique ON profiles (email);