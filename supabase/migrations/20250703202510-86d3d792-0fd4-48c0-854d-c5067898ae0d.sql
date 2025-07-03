-- Update client1 profile to link to the existing auth user for testing
UPDATE public.profiles 
SET user_id = 'd3ee51ba-0fa8-4cb1-9fd1-f7822274281e',
    email = 'umojamagharibi@gmail.com'
WHERE email = 'client1@example.com' AND role = 'client';