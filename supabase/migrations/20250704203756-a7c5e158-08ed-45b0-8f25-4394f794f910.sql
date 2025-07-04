-- Create approval workflow tables for maker-checker functionality

-- Create approval workflow types
CREATE TABLE public.approval_workflow_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create approval workflows
CREATE TABLE public.approval_workflows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_type_id UUID NOT NULL REFERENCES public.approval_workflow_types(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL, -- e.g., 'loan_approval', 'client_approval', 'user_creation'
  table_name TEXT NOT NULL, -- table that requires approval
  minimum_approvers INTEGER NOT NULL DEFAULT 1,
  maximum_approvers INTEGER,
  approval_order TEXT NOT NULL DEFAULT 'any', -- 'sequential', 'any', 'all'
  auto_approve_threshold NUMERIC, -- auto approve if amount is below this
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(action_type, tenant_id)
);

-- Create approval workflow roles (who can approve what)
CREATE TABLE public.approval_workflow_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_id UUID NOT NULL REFERENCES public.approval_workflows(id) ON DELETE CASCADE,
  role TEXT NOT NULL, -- system role like 'tenant_admin', 'loan_officer'
  custom_role_id UUID REFERENCES public.custom_roles(id) ON DELETE CASCADE,
  approval_level INTEGER NOT NULL DEFAULT 1, -- for sequential approvals
  can_approve BOOLEAN NOT NULL DEFAULT true,
  can_reject BOOLEAN NOT NULL DEFAULT true,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create approval requests (actual approval instances)
CREATE TABLE public.approval_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_id UUID NOT NULL REFERENCES public.approval_workflows(id) ON DELETE CASCADE,
  record_id UUID NOT NULL, -- ID of the record that needs approval
  record_data JSONB, -- snapshot of the record data
  requested_by UUID NOT NULL REFERENCES public.profiles(id),
  current_level INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'cancelled'
  priority TEXT NOT NULL DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
  reason TEXT, -- reason for the approval request
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  expires_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create approval actions (individual approvals/rejections)
CREATE TABLE public.approval_actions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  approval_request_id UUID NOT NULL REFERENCES public.approval_requests(id) ON DELETE CASCADE,
  approver_id UUID NOT NULL REFERENCES public.profiles(id),
  action TEXT NOT NULL, -- 'approved', 'rejected', 'delegated'
  comments TEXT,
  approval_level INTEGER NOT NULL,
  delegated_to UUID REFERENCES public.profiles(id),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.approval_workflow_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_workflow_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_actions ENABLE ROW LEVEL SECURITY;

-- RLS policies for approval_workflow_types
CREATE POLICY "Users can view their tenant's approval workflow types" 
ON public.approval_workflow_types 
FOR SELECT 
TO authenticated 
USING (tenant_id IN (
  SELECT tenant_id FROM public.profiles 
  WHERE user_id = auth.uid()
));

CREATE POLICY "Tenant admins can manage approval workflow types" 
ON public.approval_workflow_types 
FOR ALL 
TO authenticated 
USING (
  tenant_id IN (
    SELECT tenant_id FROM public.profiles 
    WHERE user_id = auth.uid() AND role IN ('tenant_admin', 'super_admin')
  )
);

-- RLS policies for approval_workflows
CREATE POLICY "Users can view their tenant's approval workflows" 
ON public.approval_workflows 
FOR SELECT 
TO authenticated 
USING (tenant_id IN (
  SELECT tenant_id FROM public.profiles 
  WHERE user_id = auth.uid()
));

CREATE POLICY "Tenant admins can manage approval workflows" 
ON public.approval_workflows 
FOR ALL 
TO authenticated 
USING (
  tenant_id IN (
    SELECT tenant_id FROM public.profiles 
    WHERE user_id = auth.uid() AND role IN ('tenant_admin', 'super_admin')
  )
);

-- RLS policies for approval_workflow_roles
CREATE POLICY "Users can view their tenant's approval workflow roles" 
ON public.approval_workflow_roles 
FOR SELECT 
TO authenticated 
USING (tenant_id IN (
  SELECT tenant_id FROM public.profiles 
  WHERE user_id = auth.uid()
));

CREATE POLICY "Tenant admins can manage approval workflow roles" 
ON public.approval_workflow_roles 
FOR ALL 
TO authenticated 
USING (
  tenant_id IN (
    SELECT tenant_id FROM public.profiles 
    WHERE user_id = auth.uid() AND role IN ('tenant_admin', 'super_admin')
  )
);

-- RLS policies for approval_requests
CREATE POLICY "Users can view relevant approval requests" 
ON public.approval_requests 
FOR SELECT 
TO authenticated 
USING (
  tenant_id IN (
    SELECT tenant_id FROM public.profiles 
    WHERE user_id = auth.uid()
  ) AND (
    requested_by IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()) OR
    EXISTS (
      SELECT 1 FROM public.approval_workflow_roles awr
      JOIN public.profiles p ON p.user_id = auth.uid()
      WHERE awr.workflow_id = approval_requests.workflow_id
      AND (awr.role = p.role OR awr.custom_role_id = p.custom_role_id)
    )
  )
);

CREATE POLICY "Users can create approval requests" 
ON public.approval_requests 
FOR INSERT 
TO authenticated 
WITH CHECK (
  tenant_id IN (
    SELECT tenant_id FROM public.profiles 
    WHERE user_id = auth.uid()
  ) AND
  requested_by IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Users can update their approval requests" 
ON public.approval_requests 
FOR UPDATE 
TO authenticated 
USING (
  tenant_id IN (
    SELECT tenant_id FROM public.profiles 
    WHERE user_id = auth.uid()
  ) AND
  requested_by IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);

-- RLS policies for approval_actions
CREATE POLICY "Users can view relevant approval actions" 
ON public.approval_actions 
FOR SELECT 
TO authenticated 
USING (tenant_id IN (
  SELECT tenant_id FROM public.profiles 
  WHERE user_id = auth.uid()
));

CREATE POLICY "Approvers can create approval actions" 
ON public.approval_actions 
FOR INSERT 
TO authenticated 
WITH CHECK (
  tenant_id IN (
    SELECT tenant_id FROM public.profiles 
    WHERE user_id = auth.uid()
  ) AND
  approver_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);

-- Add update triggers
CREATE TRIGGER update_approval_workflow_types_updated_at
  BEFORE UPDATE ON public.approval_workflow_types
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_approval_workflows_updated_at
  BEFORE UPDATE ON public.approval_workflows
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_approval_requests_updated_at
  BEFORE UPDATE ON public.approval_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default approval workflow types
INSERT INTO public.approval_workflow_types (name, description, tenant_id, created_by)
SELECT 
  'Loan Approval',
  'Approval workflow for loan applications',
  t.id,
  p.id
FROM tenants t
CROSS JOIN profiles p
WHERE p.role = 'tenant_admin'
ON CONFLICT DO NOTHING;

INSERT INTO public.approval_workflow_types (name, description, tenant_id, created_by)
SELECT 
  'Client Approval',
  'Approval workflow for client onboarding',
  t.id,
  p.id
FROM tenants t
CROSS JOIN profiles p
WHERE p.role = 'tenant_admin'
ON CONFLICT DO NOTHING;

INSERT INTO public.approval_workflow_types (name, description, tenant_id, created_by)
SELECT 
  'User Management',
  'Approval workflow for user creation and role changes',
  t.id,
  p.id
FROM tenants t
CROSS JOIN profiles p
WHERE p.role = 'tenant_admin'
ON CONFLICT DO NOTHING;