-- Create a simple user switching function for development/testing
-- This creates a development-only table to help with user switching

CREATE TABLE IF NOT EXISTS public.dev_user_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES public.profiles(id) NOT NULL,
  session_token TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.dev_user_sessions ENABLE ROW LEVEL SECURITY;

-- Only super admins can access this table
CREATE POLICY "Super admins can access dev sessions" 
ON public.dev_user_sessions 
FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.user_id = auth.uid() 
    AND p.role = 'super_admin'
  )
);

-- Create function to simulate user switching (development only)
CREATE OR REPLACE FUNCTION public.dev_switch_user_context(target_profile_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_role user_role;
  target_profile RECORD;
  result JSON;
BEGIN
  -- Check if current user is super admin
  SELECT role INTO current_user_role 
  FROM public.profiles 
  WHERE user_id = auth.uid();
  
  IF current_user_role != 'super_admin' THEN
    RAISE EXCEPTION 'Only super admins can switch user context';
  END IF;
  
  -- Get target profile info
  SELECT * INTO target_profile 
  FROM public.profiles 
  WHERE id = target_profile_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Target profile not found';
  END IF;
  
  -- Return profile info for client-side handling
  result := json_build_object(
    'profile_id', target_profile.id,
    'email', target_profile.email,
    'role', target_profile.role,
    'first_name', target_profile.first_name,
    'last_name', target_profile.last_name
  );
  
  RETURN result;
END;
$$;