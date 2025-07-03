-- Update the tenant admin profile to link to the existing auth user
UPDATE public.profiles 
SET user_id = 'd3ee51ba-0fa8-4cb1-9fd1-f7822274281e',
    email = 'umojamagharibi@gmail.com'
WHERE email = 'admin@abc-microfinance.com';