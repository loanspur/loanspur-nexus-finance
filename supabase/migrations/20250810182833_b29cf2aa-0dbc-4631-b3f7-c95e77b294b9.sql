-- Create missing INSERT policies for clients to prevent blank screen on create due to RLS
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'clients' AND policyname = 'Tenant admins can create clients in their tenant'
  ) THEN
    CREATE POLICY "Tenant admins can create clients in their tenant"
    ON public.clients
    FOR INSERT
    WITH CHECK (
      (EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.user_id = auth.uid() AND p.role IN ('tenant_admin','super_admin')
      ))
      AND (tenant_id = get_user_tenant_id())
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'clients' AND policyname = 'Office staff can create clients in accessible offices'
  ) THEN
    CREATE POLICY "Office staff can create clients in accessible offices"
    ON public.clients
    FOR INSERT
    WITH CHECK (
      (tenant_id = get_user_tenant_id())
      AND (office_id IN (
        SELECT office_id FROM get_user_accessible_offices(get_current_user_profile_id())
      ))
    );
  END IF;
END $$;