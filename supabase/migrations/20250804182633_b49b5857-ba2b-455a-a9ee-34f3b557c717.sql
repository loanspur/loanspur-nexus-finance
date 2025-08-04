-- Fix 1: Update RLS policies for offices to properly handle super admins
DROP POLICY IF EXISTS "Users can view their tenant's offices" ON public.offices;
DROP POLICY IF EXISTS "Tenant admins can manage offices" ON public.offices;

-- Create improved RLS policies that handle super admins correctly
CREATE POLICY "Super admins can access all offices" 
ON public.offices 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND role = 'super_admin'
  )
);

CREATE POLICY "Users can view their tenant's offices" 
ON public.offices 
FOR SELECT 
USING (
  tenant_id IN (
    SELECT tenant_id FROM profiles 
    WHERE user_id = auth.uid() 
    AND tenant_id IS NOT NULL
  )
);

CREATE POLICY "Tenant admins can manage their tenant's offices" 
ON public.offices 
FOR INSERT, UPDATE, DELETE
USING (
  tenant_id IN (
    SELECT tenant_id FROM profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('tenant_admin', 'super_admin')
    AND tenant_id IS NOT NULL
  )
);

-- Fix 2: Create a more robust function to get accessible offices for super admins
CREATE OR REPLACE FUNCTION public.get_user_accessible_offices_v2(user_profile_id UUID DEFAULT NULL)
RETURNS TABLE(office_id UUID)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  profile_id UUID;
  user_role user_role;
  user_tenant_id UUID;
BEGIN
  -- If no profile_id provided, get current user's profile
  IF user_profile_id IS NULL THEN
    SELECT id, role, tenant_id INTO profile_id, user_role, user_tenant_id
    FROM public.profiles 
    WHERE user_id = auth.uid();
  ELSE
    SELECT id, role, tenant_id INTO profile_id, user_role, user_tenant_id
    FROM public.profiles 
    WHERE id = user_profile_id;
  END IF;
  
  IF profile_id IS NULL THEN
    RETURN;
  END IF;
  
  -- Super admins can access all offices
  IF user_role = 'super_admin' THEN
    RETURN QUERY SELECT o.id FROM public.offices o;
    RETURN;
  END IF;
  
  -- Regular users: office-based access
  RETURN QUERY
  WITH RECURSIVE office_hierarchy AS (
    -- Get directly assigned offices
    SELECT o.id, o.parent_office_id, o.office_type
    FROM public.offices o
    JOIN public.office_staff os ON o.id = os.office_id
    WHERE os.staff_id = profile_id AND os.is_active = true
    
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

-- Fix 3: Add a simplified function for super admin office access
CREATE OR REPLACE FUNCTION public.can_access_all_offices()
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = 'super_admin'
  );
$$;