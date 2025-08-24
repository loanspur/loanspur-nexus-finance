-- Add explicit INSERT policy for savings_accounts to allow creating accounts under RLS
CREATE POLICY IF NOT EXISTS "Users can insert savings accounts for accessible clients"
ON public.savings_accounts
FOR INSERT
WITH CHECK (
  (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.role = 'super_admin'
    )
  )
  OR (
    client_id IN (
      SELECT client_id FROM public.get_user_accessible_client_ids()
    )
    AND tenant_id = public.get_user_tenant_id()
  )
);

-- Optional: ensure UPDATEs also allowed for accessible clients (keeps parity with ALL policy)
CREATE POLICY IF NOT EXISTS "Users can update savings accounts for accessible clients"
ON public.savings_accounts
FOR UPDATE
USING (
  (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.role = 'super_admin'
    )
  )
  OR (
    client_id IN (
      SELECT client_id FROM public.get_user_accessible_client_ids()
    )
  )
)
WITH CHECK (
  (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid() AND p.role = 'super_admin'
    )
  )
  OR (
    client_id IN (
      SELECT client_id FROM public.get_user_accessible_client_ids()
    )
    AND tenant_id = public.get_user_tenant_id()
  )
);