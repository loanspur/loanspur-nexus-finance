-- Allow inserting clients safely with proper RLS checks
-- Policy 1: Tenant admins and super admins can create clients for their tenant
CREATE POLICY IF NOT EXISTS "Tenant admins can create clients in their tenant"
ON public.clients
FOR INSERT
WITH CHECK (
  (EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() AND p.role IN ('tenant_admin','super_admin')
  ))
  AND (tenant_id = get_user_tenant_id())
);

-- Policy 2: Office-based users can create clients in offices they have access to
CREATE POLICY IF NOT EXISTS "Office staff can create clients in accessible offices"
ON public.clients
FOR INSERT
WITH CHECK (
  (tenant_id = get_user_tenant_id())
  AND (office_id IN (
    SELECT office_id FROM get_user_accessible_offices(get_current_user_profile_id())
  ))
);
