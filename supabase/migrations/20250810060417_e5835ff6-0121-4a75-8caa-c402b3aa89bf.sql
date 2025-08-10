-- Replace savings_accounts RLS with tenant-verified policies based on clients table to avoid reliance on get_user_tenant_id
DROP POLICY IF EXISTS "Tenant users can insert savings accounts for tenant clients" ON public.savings_accounts;
DROP POLICY IF EXISTS "Tenant users can update savings accounts for tenant clients" ON public.savings_accounts;

CREATE POLICY "Insert savings accounts when user shares tenant with client"
ON public.savings_accounts
FOR INSERT
WITH CHECK (
  -- super admins bypass
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.role = 'super_admin')
  OR EXISTS (
    SELECT 1
    FROM public.profiles p
    JOIN public.clients c ON c.tenant_id = p.tenant_id
    WHERE p.user_id = auth.uid()
      AND c.id = client_id
      AND tenant_id = p.tenant_id
  )
);

CREATE POLICY "Update savings accounts when user shares tenant with client"
ON public.savings_accounts
FOR UPDATE
USING (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.role = 'super_admin')
  OR EXISTS (
    SELECT 1
    FROM public.profiles p
    JOIN public.clients c ON c.tenant_id = p.tenant_id
    WHERE p.user_id = auth.uid()
      AND c.id = client_id
  )
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.role = 'super_admin')
  OR EXISTS (
    SELECT 1
    FROM public.profiles p
    JOIN public.clients c ON c.tenant_id = p.tenant_id
    WHERE p.user_id = auth.uid()
      AND c.id = client_id
      AND tenant_id = p.tenant_id
  )
);