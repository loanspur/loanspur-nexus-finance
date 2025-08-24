-- Replace restrictive SELECT with permissive tenant-based policy so inserts can return rows
DO $$
BEGIN
  -- Drop the restrictive policy if it exists
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'savings_accounts' 
      AND policyname = 'Office-based SELECT for savings accounts'
  ) THEN
    EXECUTE 'DROP POLICY "Office-based SELECT for savings accounts" ON public.savings_accounts';
  END IF;
END$$;

-- Create a permissive SELECT policy that allows tenant users to view accounts in their tenant
CREATE POLICY "Tenant users can select savings accounts (tenant or office)"
ON public.savings_accounts
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (
  tenant_id = get_user_tenant_id()
  OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.user_id = auth.uid() AND p.role = 'super_admin'
  )
  OR (client_id IN (
    SELECT client_id FROM public.get_user_accessible_client_ids()
  ))
);
