-- Update the RLS policy for clients table to include tenant_admin users
DROP POLICY IF EXISTS "Office-based access for clients" ON public.clients;

CREATE POLICY "Office-based access for clients" 
ON public.clients 
FOR ALL 
USING (
  -- Allow super_admin and tenant_admin users full access
  (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role IN ('super_admin'::user_role, 'tenant_admin'::user_role)
  )) 
  OR 
  -- Regular users can only access clients in offices they have access to
  (office_id IN (
    SELECT get_user_accessible_offices.office_id
    FROM get_user_accessible_offices((
      SELECT profiles.id
      FROM profiles
      WHERE profiles.user_id = auth.uid()
    )) get_user_accessible_offices(office_id)
  ))
);