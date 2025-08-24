-- Replace restrictive ALL policy with PERMISSIVE SELECT-only policy to avoid interfering with INSERT

DROP POLICY IF EXISTS "Office-based access for savings accounts" ON public.savings_accounts;

CREATE POLICY "Office-based SELECT for savings accounts"
ON public.savings_accounts
AS PERMISSIVE
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() AND p.role = 'super_admin'::user_role
  )
  OR client_id IN (
    SELECT client_id FROM public.get_user_accessible_client_ids()
  )
);
