-- Fix RLS policy for clients table to handle super_admin users
DROP POLICY IF EXISTS "Users can access their tenant's clients" ON public.clients;

CREATE POLICY "Users can access their tenant's clients" 
ON public.clients 
FOR ALL 
USING (
  -- Super admins can see all clients
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role = 'super_admin'
  )
  OR
  -- Regular users can see their tenant's clients
  tenant_id IN (
    SELECT p.tenant_id 
    FROM public.profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.tenant_id IS NOT NULL
  )
);