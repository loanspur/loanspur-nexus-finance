-- Add a permissive INSERT policy to allow tenant users to create savings accounts within their tenant
-- This avoids dependency on office-based access paths and fixes persistent RLS failures

-- Safety: keep existing policies; this one is additional and permissive
CREATE POLICY IF NOT EXISTS "Tenant users can insert savings accounts in their tenant"
ON public.savings_accounts
AS PERMISSIVE
FOR INSERT
TO authenticated
WITH CHECK (
  tenant_id = get_user_tenant_id()
);
