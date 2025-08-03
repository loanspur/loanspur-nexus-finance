-- Remove tenant association from super admin user justmurenga@gmail.com
UPDATE public.profiles 
SET tenant_id = NULL,
    updated_at = now()
WHERE email = 'justmurenga@gmail.com' 
  AND role = 'super_admin';