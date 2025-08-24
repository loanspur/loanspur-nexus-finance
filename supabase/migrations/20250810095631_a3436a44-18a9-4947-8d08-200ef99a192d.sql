-- Create permissive SELECT policy allowing tenant users to view their tenant's savings accounts
CREATE POLICY "Tenant users can select savings accounts (tenant match)"
ON public.savings_accounts
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (tenant_id = get_user_tenant_id());