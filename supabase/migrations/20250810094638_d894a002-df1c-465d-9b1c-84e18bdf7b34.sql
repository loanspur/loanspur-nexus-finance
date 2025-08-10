-- Create permissive INSERT policy allowing tenant users to insert when tenant_id matches their tenant
CREATE POLICY "Tenant users can insert savings accounts (tenant match)"
ON public.savings_accounts
AS PERMISSIVE
FOR INSERT
TO authenticated
WITH CHECK (
  tenant_id = get_user_tenant_id()
);
