-- Create custom roles table
CREATE TABLE public.custom_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(name, tenant_id)
);

-- Create custom role permissions junction table
CREATE TABLE public.custom_role_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  custom_role_id UUID NOT NULL REFERENCES public.custom_roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(custom_role_id, permission_id)
);

-- Add custom_role_id to profiles table to support custom roles
ALTER TABLE public.profiles 
ADD COLUMN custom_role_id UUID REFERENCES public.custom_roles(id);

-- Enable RLS
ALTER TABLE public.custom_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_role_permissions ENABLE ROW LEVEL SECURITY;

-- RLS policies for custom_roles
CREATE POLICY "Users can view their tenant's custom roles" 
ON public.custom_roles 
FOR SELECT 
TO authenticated 
USING (tenant_id IN (
  SELECT tenant_id FROM public.profiles 
  WHERE user_id = auth.uid()
));

CREATE POLICY "Tenant admins can manage custom roles" 
ON public.custom_roles 
FOR ALL 
TO authenticated 
USING (
  tenant_id IN (
    SELECT tenant_id FROM public.profiles 
    WHERE user_id = auth.uid() AND role IN ('tenant_admin', 'super_admin')
  )
);

-- RLS policies for custom_role_permissions
CREATE POLICY "Users can view their tenant's custom role permissions" 
ON public.custom_role_permissions 
FOR SELECT 
TO authenticated 
USING (tenant_id IN (
  SELECT tenant_id FROM public.profiles 
  WHERE user_id = auth.uid()
));

CREATE POLICY "Tenant admins can manage custom role permissions" 
ON public.custom_role_permissions 
FOR ALL 
TO authenticated 
USING (
  tenant_id IN (
    SELECT tenant_id FROM public.profiles 
    WHERE user_id = auth.uid() AND role IN ('tenant_admin', 'super_admin')
  )
);

-- Add update triggers
CREATE TRIGGER update_custom_roles_updated_at
  BEFORE UPDATE ON public.custom_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some default custom roles for demonstration
INSERT INTO public.custom_roles (name, description, tenant_id, created_by)
SELECT 
  'Teller',
  'Front office teller with limited access',
  t.id,
  p.id
FROM tenants t
CROSS JOIN profiles p
WHERE p.role = 'tenant_admin'
ON CONFLICT (name, tenant_id) DO NOTHING;

INSERT INTO public.custom_roles (name, description, tenant_id, created_by)
SELECT 
  'Branch Manager',
  'Branch manager with supervisory access',
  t.id,
  p.id
FROM tenants t
CROSS JOIN profiles p
WHERE p.role = 'tenant_admin'
ON CONFLICT (name, tenant_id) DO NOTHING;