-- Create permissions table
CREATE TABLE public.permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  module TEXT NOT NULL, -- e.g., 'users', 'loans', 'clients', 'reports'
  action TEXT NOT NULL, -- e.g., 'create', 'read', 'update', 'delete', 'approve'
  resource TEXT, -- specific resource if needed
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(name)
);

-- Create role_permissions junction table
CREATE TABLE public.role_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  role TEXT NOT NULL, -- matches user_role enum
  permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(role, permission_id, tenant_id)
);

-- Enable RLS
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- RLS policies for permissions (readable by all authenticated users)
CREATE POLICY "All authenticated users can view permissions" 
ON public.permissions 
FOR SELECT 
TO authenticated 
USING (true);

-- Only super admins can manage permissions
CREATE POLICY "Super admins can manage permissions" 
ON public.permissions 
FOR ALL 
TO authenticated 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE user_id = auth.uid() AND role = 'super_admin'
));

-- RLS policies for role_permissions
CREATE POLICY "Users can view their tenant's role permissions" 
ON public.role_permissions 
FOR SELECT 
TO authenticated 
USING (tenant_id IN (
  SELECT tenant_id FROM public.profiles 
  WHERE user_id = auth.uid()
));

CREATE POLICY "Tenant admins can manage role permissions" 
ON public.role_permissions 
FOR ALL 
TO authenticated 
USING (
  tenant_id IN (
    SELECT tenant_id FROM public.profiles 
    WHERE user_id = auth.uid() AND role IN ('tenant_admin', 'super_admin')
  )
);

-- Insert default permissions
INSERT INTO public.permissions (name, description, module, action) VALUES
-- User Management
('user.create', 'Create new users', 'users', 'create'),
('user.read', 'View user information', 'users', 'read'),
('user.update', 'Update user information', 'users', 'update'),
('user.delete', 'Delete/deactivate users', 'users', 'delete'),
('user.assign_roles', 'Assign roles to users', 'users', 'assign_roles'),

-- Client Management
('client.create', 'Create new clients', 'clients', 'create'),
('client.read', 'View client information', 'clients', 'read'),
('client.update', 'Update client information', 'clients', 'update'),
('client.delete', 'Delete clients', 'clients', 'delete'),
('client.approve', 'Approve client applications', 'clients', 'approve'),

-- Loan Management
('loan.create', 'Create loan applications', 'loans', 'create'),
('loan.read', 'View loan information', 'loans', 'read'),
('loan.update', 'Update loan information', 'loans', 'update'),
('loan.delete', 'Delete loans', 'loans', 'delete'),
('loan.approve', 'Approve loan applications', 'loans', 'approve'),
('loan.disburse', 'Disburse approved loans', 'loans', 'disburse'),

-- Savings Management
('savings.create', 'Create savings accounts', 'savings', 'create'),
('savings.read', 'View savings information', 'savings', 'read'),
('savings.update', 'Update savings accounts', 'savings', 'update'),
('savings.delete', 'Delete savings accounts', 'savings', 'delete'),

-- Financial Reports
('reports.read', 'View financial reports', 'reports', 'read'),
('reports.create', 'Generate new reports', 'reports', 'create'),
('reports.export', 'Export reports', 'reports', 'export'),

-- System Configuration
('system.settings', 'Manage system settings', 'system', 'settings'),
('system.audit', 'View audit trails', 'system', 'audit'),
('system.backup', 'Manage data backups', 'system', 'backup'),

-- Group Management
('group.create', 'Create groups', 'groups', 'create'),
('group.read', 'View group information', 'groups', 'read'),
('group.update', 'Update group information', 'groups', 'update'),
('group.delete', 'Delete groups', 'groups', 'delete');

-- Add update trigger for permissions
CREATE TRIGGER update_permissions_updated_at
  BEFORE UPDATE ON public.permissions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();