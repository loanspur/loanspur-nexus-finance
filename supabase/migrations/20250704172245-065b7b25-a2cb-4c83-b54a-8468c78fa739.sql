-- Fix RLS policy for savings_accounts table to handle super_admin users
DROP POLICY IF EXISTS "Users can access their tenant's savings accounts" ON public.savings_accounts;

CREATE POLICY "Users can access their tenant's savings accounts" 
ON public.savings_accounts 
FOR ALL 
USING (
  -- Super admins can see all savings accounts
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role = 'super_admin'
  )
  OR
  -- Regular users can see their tenant's savings accounts
  tenant_id IN (
    SELECT p.tenant_id 
    FROM public.profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.tenant_id IS NOT NULL
  )
);