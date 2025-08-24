-- Adjust RLS to fix INSERT denials on savings_accounts by gating on accessible clients rather than relying on get_user_tenant_id()

-- 1) Drop the existing restrictive INSERT policy
DROP POLICY IF EXISTS "Tenant users can insert savings accounts for their tenant" ON public.savings_accounts;

-- 2) Create a permissive INSERT policy tied to office-based access and client tenant consistency
CREATE POLICY "Users can insert savings accounts for accessible clients"
ON public.savings_accounts
AS PERMISSIVE
FOR INSERT
WITH CHECK (
  -- Allow super admins
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() AND p.role = 'super_admin'::user_role
  )
  OR (
    -- Office-based access to the client
    client_id IN (
      SELECT client_id FROM public.get_user_accessible_client_ids()
    )
    -- Ensure the inserted tenant_id matches the client's tenant to prevent cross-tenant inserts
    AND tenant_id = (
      SELECT c.tenant_id FROM public.clients c WHERE c.id = client_id
    )
  )
);
