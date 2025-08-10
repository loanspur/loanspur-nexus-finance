-- Fix root cause: RLS INSERT policy relied solely on client_office_assignments via get_user_accessible_client_ids(),
-- while many clients only use clients.office_id. Also allow tenant_admins to insert within their tenant.

-- Drop previous INSERT policy
DROP POLICY IF EXISTS "Users can insert savings accounts for accessible clients" ON public.savings_accounts;

-- Create improved INSERT policy
CREATE POLICY "Users can insert savings accounts (tenant admins or office-based)"
ON public.savings_accounts
AS PERMISSIVE
FOR INSERT
WITH CHECK (
  (
    -- super admins or tenant admins can insert for their tenant
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.role IN ('super_admin'::user_role, 'tenant_admin'::user_role)
    )
    AND tenant_id = (
      SELECT c.tenant_id FROM public.clients c WHERE c.id = client_id
    )
  )
  OR (
    -- office-based access path (loan officers, etc.)
    tenant_id = (
      SELECT c.tenant_id FROM public.clients c WHERE c.id = client_id
    )
    AND (
      -- either explicitly assigned via client_office_assignments
      client_id IN (
        SELECT client_id FROM public.get_user_accessible_client_ids()
      )
      -- or the client belongs to an office accessible to the user
      OR EXISTS (
        SELECT 1
        FROM public.clients c2
        WHERE c2.id = client_id
          AND c2.office_id IN (
            SELECT office_id FROM public.get_user_accessible_offices(public.get_current_user_profile_id())
          )
      )
    )
  )
);
