-- Fix search path for security definer functions
CREATE OR REPLACE FUNCTION public.get_user_accessible_offices(user_profile_id UUID)
RETURNS TABLE(office_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE office_hierarchy AS (
    -- Get directly assigned offices
    SELECT o.id, o.parent_office_id, o.office_type
    FROM public.offices o
    JOIN public.office_staff os ON o.id = os.office_id
    WHERE os.staff_id = user_profile_id AND os.is_active = true
    
    UNION ALL
    
    -- Get sub-offices for branch/head_office users
    SELECT o.id, o.parent_office_id, o.office_type
    FROM public.offices o
    JOIN office_hierarchy oh ON o.parent_office_id = oh.id
    WHERE oh.office_type IN ('head_office', 'branch')
  )
  SELECT oh.id FROM office_hierarchy oh;
END;
$$;

-- Fix search path for get_user_accessible_client_ids function
CREATE OR REPLACE FUNCTION public.get_user_accessible_client_ids()
RETURNS TABLE(client_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  user_profile_id UUID;
BEGIN
  -- Get current user's profile id
  SELECT id INTO user_profile_id 
  FROM public.profiles 
  WHERE user_id = auth.uid();
  
  IF user_profile_id IS NULL THEN
    RETURN;
  END IF;
  
  RETURN QUERY
  SELECT DISTINCT coa.client_id
  FROM public.client_office_assignments coa
  WHERE coa.office_id IN (
    SELECT office_id FROM public.get_user_accessible_offices(user_profile_id)
  );
END;
$$;