-- Allow tenant admins (and super admins) to update their own tenant settings
DO $$
BEGIN
  -- Drop existing policy if present to avoid duplicates
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'tenants' AND policyname = 'Tenant admins can update their tenant'
  ) THEN
    DROP POLICY "Tenant admins can update their tenant" ON public.tenants;
  END IF;

  CREATE POLICY "Tenant admins can update their tenant"
    ON public.tenants
    FOR UPDATE
    USING (
      id = get_user_tenant_id() AND EXISTS (
        SELECT 1 FROM public.profiles p 
        WHERE p.user_id = auth.uid() AND p.role IN ('tenant_admin','super_admin')
      )
    )
    WITH CHECK (
      id = get_user_tenant_id() AND EXISTS (
        SELECT 1 FROM public.profiles p 
        WHERE p.user_id = auth.uid() AND p.role IN ('tenant_admin','super_admin')
      )
    );
END $$;