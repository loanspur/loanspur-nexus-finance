-- Fix ambiguous tenant_id by qualifying NEW.tenant_id
DROP POLICY IF EXISTS "Insert savings accounts when user shares tenant with client" ON public.savings_accounts;
DROP POLICY IF EXISTS "Update savings accounts when user shares tenant with client" ON public.savings_accounts;

CREATE POLICY "Insert savings accounts when user shares tenant with client"
ON public.savings_accounts
FOR INSERT
WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = auth.uid() AND p.role = 'super_admin')
  OR EXISTS (
    SELECT 1
    FROM public.profiles p
    JOIN public.clients c ON c.tenant_id = p.tenant_id
    WHERE p.user_id = auth.uid()
      AND c.id = client_id
      AND NEW.tenant_id = p.tenant_id
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
      AND NEW.tenant_id = p.tenant_id
  )
);