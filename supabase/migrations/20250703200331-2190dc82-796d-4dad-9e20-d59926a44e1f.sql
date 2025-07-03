-- Drop the problematic policies first
DROP POLICY IF EXISTS "Super admins can access all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view and update their own profile" ON public.profiles;

-- Create a security definer function to get current user role
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS user_role AS $$
  SELECT role FROM public.profiles WHERE user_id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Create non-recursive policies using the function
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
  public.get_current_user_role() = 'super_admin'
);