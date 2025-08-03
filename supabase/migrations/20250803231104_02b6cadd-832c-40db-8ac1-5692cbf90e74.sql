-- Add maker-checker functionality to permissions
ALTER TABLE permissions 
ADD COLUMN requires_maker_checker BOOLEAN DEFAULT FALSE,
ADD COLUMN maker_checker_enabled BOOLEAN DEFAULT FALSE;

-- Add maker-checker tracking to role permissions
ALTER TABLE role_permissions 
ADD COLUMN can_make BOOLEAN DEFAULT TRUE,
ADD COLUMN can_check BOOLEAN DEFAULT FALSE;

-- Add custom role permissions table similar to role_permissions
CREATE TABLE IF NOT EXISTS custom_role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  custom_role_id UUID NOT NULL REFERENCES custom_roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL,
  can_make BOOLEAN DEFAULT TRUE,
  can_check BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(custom_role_id, permission_id, tenant_id)
);

-- Enable RLS on custom_role_permissions
ALTER TABLE custom_role_permissions ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for custom_role_permissions
CREATE POLICY "Users can access their tenant's custom role permissions" 
ON custom_role_permissions 
FOR ALL 
USING (tenant_id IN (
  SELECT tenant_id FROM profiles WHERE user_id = auth.uid()
));

-- Update the profiles table to make custom_role_id more prominent for role assignment
COMMENT ON COLUMN profiles.custom_role_id IS 'Custom role assigned to the user, takes precedence over the enum role for permissions';

-- Clean up existing custom roles (since user said they are not being used)
DELETE FROM custom_role_permissions WHERE custom_role_id IN (SELECT id FROM custom_roles);
DELETE FROM custom_roles;

-- Update permissions to include maker-checker flags for sensitive operations
UPDATE permissions 
SET requires_maker_checker = TRUE, maker_checker_enabled = TRUE 
WHERE action IN ('approve', 'disburse', 'delete') OR name LIKE '%.approve' OR name LIKE '%.disburse';