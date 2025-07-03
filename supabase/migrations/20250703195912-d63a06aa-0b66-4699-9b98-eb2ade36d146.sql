-- Update the super admin profile to link to the actual auth user
UPDATE public.profiles 
SET user_id = '79591c7c-540d-4a22-99d7-17b481de8e68'
WHERE email = 'justmurenga@gmail.com';