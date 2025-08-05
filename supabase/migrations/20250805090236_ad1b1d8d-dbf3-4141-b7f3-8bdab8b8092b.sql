-- Add custom_role_id column to role_permissions table
ALTER TABLE public.role_permissions 
ADD COLUMN custom_role_id uuid REFERENCES public.custom_roles(id) ON DELETE CASCADE;

-- Update the role column to be nullable since custom roles won't use it
ALTER TABLE public.role_permissions 
ALTER COLUMN role DROP NOT NULL;

-- Create an index for better performance on custom_role_id lookups
CREATE INDEX idx_role_permissions_custom_role_id ON public.role_permissions(custom_role_id);

-- Add constraint to ensure either role or custom_role_id is specified, but not both
ALTER TABLE public.role_permissions 
ADD CONSTRAINT check_role_xor_custom_role 
CHECK (
  (role IS NOT NULL AND custom_role_id IS NULL) OR 
  (role IS NULL AND custom_role_id IS NOT NULL)
);