-- Allow public access to view tenant information by subdomain
-- This is needed for subdomain routing to work for unauthenticated users
CREATE POLICY "Public can view tenant info by subdomain" 
ON public.tenants 
FOR SELECT 
TO public
USING (true);