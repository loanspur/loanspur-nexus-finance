-- Create offices table
CREATE TABLE public.offices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  office_name TEXT NOT NULL,
  office_code TEXT NOT NULL,
  office_type TEXT NOT NULL DEFAULT 'branch' CHECK (office_type IN ('head_office', 'branch', 'sub_branch', 'collection_center')),
  address JSONB,
  phone TEXT,
  email TEXT,
  branch_manager_id UUID REFERENCES public.profiles(id) SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  opening_date DATE DEFAULT CURRENT_DATE,
  closing_date DATE,
  office_hours JSONB DEFAULT '{"monday": {"open": "08:00", "close": "17:00"}, "tuesday": {"open": "08:00", "close": "17:00"}, "wednesday": {"open": "08:00", "close": "17:00"}, "thursday": {"open": "08:00", "close": "17:00"}, "friday": {"open": "08:00", "close": "17:00"}, "saturday": {"open": "08:00", "close": "13:00"}, "sunday": {"closed": true}}'::jsonb,
  parent_office_id UUID REFERENCES public.offices(id) SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, office_code)
);

-- Enable Row Level Security
ALTER TABLE public.offices ENABLE ROW LEVEL SECURITY;

-- Create policies for offices
CREATE POLICY "Users can view their tenant's offices" 
ON public.offices 
FOR SELECT 
USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Tenant admins can manage offices" 
ON public.offices 
FOR ALL 
USING (
  tenant_id IN (
    SELECT tenant_id FROM profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('tenant_admin', 'super_admin')
  )
);

-- Create office staff assignments table
CREATE TABLE public.office_staff (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  office_id UUID NOT NULL REFERENCES public.offices(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role_in_office TEXT NOT NULL DEFAULT 'staff' CHECK (role_in_office IN ('manager', 'assistant_manager', 'loan_officer', 'cashier', 'staff')),
  assigned_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(office_id, staff_id)
);

-- Enable Row Level Security for office staff
ALTER TABLE public.office_staff ENABLE ROW LEVEL SECURITY;

-- Create policies for office staff
CREATE POLICY "Users can view their tenant's office staff" 
ON public.office_staff 
FOR SELECT 
USING (
  office_id IN (
    SELECT id FROM offices 
    WHERE tenant_id IN (
      SELECT tenant_id FROM profiles WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Tenant admins can manage office staff" 
ON public.office_staff 
FOR ALL 
USING (
  office_id IN (
    SELECT id FROM offices 
    WHERE tenant_id IN (
      SELECT tenant_id FROM profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('tenant_admin', 'super_admin')
    )
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_offices_updated_at
BEFORE UPDATE ON public.offices
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_office_staff_updated_at
BEFORE UPDATE ON public.office_staff
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();