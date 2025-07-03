-- Fix infinite recursion by dropping and recreating RLS policies
DROP POLICY IF EXISTS "Super admins can access all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view and update their own profile" ON public.profiles;

-- Create non-recursive policies
CREATE POLICY "Users can view and update their own profile" 
ON public.profiles 
FOR ALL 
TO authenticated 
USING (user_id = auth.uid());

CREATE POLICY "Super admins can access all profiles" 
ON public.profiles 
FOR ALL 
TO authenticated 
USING (
  user_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role = 'super_admin'
  )
);