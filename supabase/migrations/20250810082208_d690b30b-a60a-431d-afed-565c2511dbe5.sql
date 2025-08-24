-- Consolidate and simplify savings_accounts INSERT/UPDATE policies to be PERMISSIVE and tenant-scoped

-- Ensure RLS is enabled (no-op if already enabled)
ALTER TABLE public.savings_accounts ENABLE ROW LEVEL SECURITY;

-- Drop existing overlapping INSERT/UPDATE policies to avoid restrictive intersections
DROP POLICY IF EXISTS "Insert savings accounts when user's tenant matches client" ON public.savings_accounts;
DROP POLICY IF EXISTS "Tenant users can insert savings accounts for tenant clients" ON public.savings_accounts;
DROP POLICY IF EXISTS "Tenant users can update savings accounts for tenant clients" ON public.savings_accounts;
DROP POLICY IF EXISTS "Update savings accounts when user's tenant matches client" ON public.savings_accounts;

-- Create a single PERMISSIVE INSERT policy
CREATE POLICY "Tenant users can insert savings accounts for their tenant"
ON public.savings_accounts
AS PERMISSIVE
FOR INSERT
WITH CHECK (
  -- Super admins can insert anywhere
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() AND p.role = 'super_admin'::user_role
  )
  OR (
    -- Tenant users can insert for clients in their tenant and rows must carry their tenant_id
    tenant_id = public.get_user_tenant_id()
    AND client_id IN (
      SELECT id FROM public.clients WHERE tenant_id = public.get_user_tenant_id()
    )
  )
);

-- Create a single PERMISSIVE UPDATE policy
CREATE POLICY "Tenant users can update their tenant savings accounts"
ON public.savings_accounts
AS PERMISSIVE
FOR UPDATE
USING (
  -- Row is visible for update if super_admin, or client's tenant matches user's tenant
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() AND p.role = 'super_admin'::user_role
  )
  OR client_id IN (
    SELECT id FROM public.clients WHERE tenant_id = public.get_user_tenant_id()
  )
)
WITH CHECK (
  -- After update, ensure row still belongs to user's tenant (or super_admin)
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() AND p.role = 'super_admin'::user_role
  )
  OR tenant_id = public.get_user_tenant_id()
);
