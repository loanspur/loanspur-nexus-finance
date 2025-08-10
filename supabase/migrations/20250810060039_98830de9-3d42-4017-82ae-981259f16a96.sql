-- Relax INSERT/UPDATE RLS for savings_accounts to allow tenant users to create accounts for any client within the same tenant
DROP POLICY IF EXISTS "Users can insert savings accounts for accessible clients" ON public.savings_accounts;
CREATE POLICY "Tenant users can insert savings accounts for tenant clients"
ON public.savings_accounts
FOR INSERT
WITH CHECK (
  -- super admins always allowed
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.role = 'super_admin')
  OR (
    tenant_id = public.get_user_tenant_id()
    AND EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.id = client_id AND c.tenant_id = public.get_user_tenant_id()
    )
  )
);

DROP POLICY IF EXISTS "Users can update savings accounts for accessible clients" ON public.savings_accounts;
CREATE POLICY "Tenant users can update savings accounts for tenant clients"
ON public.savings_accounts
FOR UPDATE
USING (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.role = 'super_admin')
  OR (
    EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.id = client_id AND c.tenant_id = public.get_user_tenant_id()
    )
  )
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.role = 'super_admin')
  OR (
    tenant_id = public.get_user_tenant_id()
    AND EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.id = client_id AND c.tenant_id = public.get_user_tenant_id()
    )
  )
);