-- Remove the dev_switch_user_context function to prevent super admin profile switching
DROP FUNCTION IF EXISTS public.dev_switch_user_context(uuid);

-- Add comment for security audit trail
COMMENT ON SCHEMA public IS 'Super admin isolation: removed dev_switch_user_context function to prevent tenant access compromise';