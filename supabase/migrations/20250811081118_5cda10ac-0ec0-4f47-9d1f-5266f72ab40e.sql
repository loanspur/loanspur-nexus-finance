-- Restrict tenants table visibility to authenticated users of their own tenant
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- Remove overly permissive public policy
DROP POLICY IF EXISTS "Public can view tenant info by subdomain" ON public.tenants;

-- Allow authenticated users to view only their own tenant; super_admins keep full access via existing ALL policy
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='tenants' AND policyname='Tenant users can select their own tenant')
  THEN
    CREATE POLICY "Tenant users can select their own tenant"
    ON public.tenants
    FOR SELECT
    USING (
      (id = get_user_tenant_id()) OR 
      (EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role = 'super_admin'))
    );
  END IF;
END $$;