-- Create client_office_assignments table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.client_office_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  office_id UUID NOT NULL REFERENCES public.offices(id) ON DELETE CASCADE,
  assigned_date DATE NOT NULL DEFAULT CURRENT_DATE,
  assigned_by UUID,
  is_primary BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on client_office_assignments
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

-- Create function to get user's accessible client IDs based on office assignments
CREATE OR REPLACE FUNCTION public.get_user_accessible_client_ids()
RETURNS TABLE(client_id UUID)
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

-- RLS Policy for client_office_assignments
DROP POLICY IF EXISTS "Users can access client office assignments for their offices" ON public.client_office_assignments;
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

-- Update clients table RLS to use office-based restrictions
DROP POLICY IF EXISTS "Tenant data isolation for clients" ON public.clients;
CREATE POLICY "Office-based access for clients"
ON public.clients
FOR ALL
USING (
  -- Super admins can see all
  (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'super_admin'::user_role))
  OR
  -- Users can only see clients assigned to their accessible offices
  (id IN (SELECT client_id FROM public.get_user_accessible_client_ids()))
);

-- Update loans table RLS to use office-based restrictions
DROP POLICY IF EXISTS "Users can access their tenant's loans" ON public.loans;
CREATE POLICY "Office-based access for loans"
ON public.loans
FOR ALL
USING (
  client_id IN (SELECT client_id FROM public.get_user_accessible_client_ids())
);

-- Update savings_accounts table RLS to use office-based restrictions  
DROP POLICY IF EXISTS "Tenant data isolation for savings accounts" ON public.savings_accounts;
CREATE POLICY "Office-based access for savings accounts"
ON public.savings_accounts
FOR ALL
USING (
  -- Super admins can see all
  (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'super_admin'::user_role))
  OR
  -- Users can only see savings accounts for clients in their accessible offices
  (client_id IN (SELECT client_id FROM public.get_user_accessible_client_ids()))
);

-- Update transactions table RLS to use office-based restrictions
DROP POLICY IF EXISTS "Users can access their tenant's transactions" ON public.transactions;
CREATE POLICY "Office-based access for transactions"
ON public.transactions
FOR ALL
USING (
  -- Check if transaction is related to accessible clients
  (client_id IS NULL AND tenant_id IN (SELECT tenant_id FROM profiles WHERE user_id = auth.uid()))
  OR
  (client_id IN (SELECT client_id FROM public.get_user_accessible_client_ids()))
);

-- Create trigger for updated_at on client_office_assignments
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
    -- Get or create head office
    SELECT id INTO head_office_id 
    FROM public.offices 
    WHERE tenant_id = tenant_record.tenant_id 
      AND office_type = 'head_office' 
    LIMIT 1;
    
    -- Create head office if it doesn't exist
    IF head_office_id IS NULL THEN
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
      RETURNING id INTO head_office_id;
    END IF;
    
    -- Assign all existing clients to head office
    INSERT INTO public.client_office_assignments (client_id, office_id, is_primary)
    SELECT c.id, head_office_id, true
    FROM public.clients c
    WHERE c.tenant_id = tenant_record.tenant_id
      AND NOT EXISTS (
        SELECT 1 FROM public.client_office_assignments coa 
        WHERE coa.client_id = c.id
      );
  END LOOP;
END $$;