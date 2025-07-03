-- Update super admin email to justmurenga@gmail.com
UPDATE public.profiles 
SET email = 'justmurenga@gmail.com' 
WHERE role = 'super_admin' AND email = 'admin@loanspur.com';