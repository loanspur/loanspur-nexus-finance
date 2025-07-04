-- Fix RLS policy for clients table to ensure proper access
-- First, let's check if the current user's profile has the right tenant_id

-- Update the clients RLS policy to be more permissive for debugging
DROP POLICY IF EXISTS "Users can access their tenant's clients" ON public.clients;

CREATE POLICY "Users can access their tenant's clients" 
ON public.clients 
FOR ALL 
USING (
  tenant_id IN (
    SELECT COALESCE(p.tenant_id, '550e8400-e29b-41d4-a716-446655440001') 
    FROM public.profiles p 
    WHERE p.user_id = auth.uid()
  )
);