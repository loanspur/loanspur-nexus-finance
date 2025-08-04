-- Create offices table
CREATE TABLE public.offices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  office_name TEXT NOT NULL,
  office_code TEXT NOT NULL,
  office_type TEXT NOT NULL DEFAULT 'branch' CHECK (office_type IN ('head_office', 'branch', 'sub_branch', 'collection_center')),
  address JSONB,
  phone TEXT,
  email TEXT,
  branch_manager_id UUID,
  is_active BOOLEAN NOT NULL DEFAULT true,
  opening_date DATE,
  closing_date DATE,
  office_hours JSONB,
  parent_office_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, office_code),
  FOREIGN KEY (parent_office_id) REFERENCES public.offices(id) ON DELETE SET NULL
);

-- Create office_staff table for multi-office assignments
CREATE TABLE public.office_staff (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  office_id UUID NOT NULL REFERENCES public.offices(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL,
  role_in_office TEXT NOT NULL DEFAULT 'staff' CHECK (role_in_office IN ('manager', 'assistant_manager', 'loan_officer', 'cashier', 'staff')),
  assigned_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(office_id, staff_id, assigned_date)
);

-- Create client_office_assignments table
CREATE TABLE public.client_office_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  office_id UUID NOT NULL REFERENCES public.offices(id) ON DELETE CASCADE,
  assigned_date DATE NOT NULL DEFAULT CURRENT_DATE,
  assigned_by UUID,
  is_primary BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.offices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.office_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_office_assignments ENABLE ROW LEVEL SECURITY;

-- Create function to get user's accessible offices (including sub-offices)
CREATE OR REPLACE FUNCTION public.get_user_accessible_offices(user_profile_id UUID)
RETURNS TABLE(office_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
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

-- Create function to check if user can access specific office data
CREATE OR REPLACE FUNCTION public.can_user_access_office_data(target_office_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  user_profile_id UUID;
BEGIN
  -- Get current user's profile id
  SELECT id INTO user_profile_id 
  FROM public.profiles 
  WHERE user_id = auth.uid();
  
  IF user_profile_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check if user has access to this office
  RETURN EXISTS (
    SELECT 1 FROM public.get_user_accessible_offices(user_profile_id) 
    WHERE office_id = target_office_id
  );
END;
$$;

-- RLS Policies for offices
CREATE POLICY "Users can access their tenant's offices based on assignment"
ON public.offices
FOR ALL
USING (
  tenant_id IN (
    SELECT tenant_id FROM public.profiles WHERE user_id = auth.uid()
  )
);

-- RLS Policies for office_staff
CREATE POLICY "Users can access office staff assignments"
ON public.office_staff
FOR ALL
USING (
  office_id IN (
    SELECT office_id FROM public.get_user_accessible_offices(
      (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    )
  )
);

-- RLS Policies for client_office_assignments  
CREATE POLICY "Users can access client office assignments for their offices"
ON public.client_office_assignments
FOR ALL
USING (
  office_id IN (
    SELECT office_id FROM public.get_user_accessible_offices(
      (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    )
  )
);

-- Create triggers for updated_at
CREATE TRIGGER update_offices_updated_at
  BEFORE UPDATE ON public.offices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_office_staff_updated_at
  BEFORE UPDATE ON public.office_staff
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_client_office_assignments_updated_at
  BEFORE UPDATE ON public.client_office_assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-assign all existing clients to head office
DO $$
DECLARE
  tenant_record RECORD;
  head_office_id UUID;
BEGIN
  FOR tenant_record IN SELECT DISTINCT tenant_id FROM public.clients LOOP
    -- Create head office if it doesn't exist
    INSERT INTO public.offices (
      tenant_id, 
      office_name, 
      office_code, 
      office_type,
      is_active
    )
    VALUES (
      tenant_record.tenant_id,
      'Head Office',
      'HO001',
      'head_office',
      true
    )
    ON CONFLICT (tenant_id, office_code) DO NOTHING
    RETURNING id INTO head_office_id;
    
    -- Get head office id if it already existed
    IF head_office_id IS NULL THEN
      SELECT id INTO head_office_id 
      FROM public.offices 
      WHERE tenant_id = tenant_record.tenant_id 
        AND office_type = 'head_office' 
      LIMIT 1;
    END IF;
    
    -- Assign all existing clients to head office
    INSERT INTO public.client_office_assignments (client_id, office_id, is_primary)
    SELECT c.id, head_office_id, true
    FROM public.clients c
    WHERE c.tenant_id = tenant_record.tenant_id
    ON CONFLICT DO NOTHING;
  END LOOP;
END $$;