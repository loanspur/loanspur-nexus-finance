-- Fix the audit trail function to properly map INSERT to CREATE
CREATE OR REPLACE FUNCTION public.log_audit_trail()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  current_user_id UUID;
  current_tenant_id UUID;
  mapped_action audit_action;
BEGIN
  -- Get current user and tenant from profiles
  SELECT p.id, p.tenant_id INTO current_user_id, current_tenant_id
  FROM profiles p WHERE p.user_id = auth.uid();

  -- Skip if no user context (system operations)
  IF current_tenant_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Map TG_OP to audit_action enum values
  CASE TG_OP
    WHEN 'INSERT' THEN mapped_action := 'CREATE';
    WHEN 'UPDATE' THEN mapped_action := 'UPDATE';
    WHEN 'DELETE' THEN mapped_action := 'DELETE';
    ELSE mapped_action := 'UPDATE'; -- Default fallback
  END CASE;

  -- Log the change
  INSERT INTO audit_trails (
    tenant_id,
    user_id,
    table_name,
    record_id,
    action,
    old_values,
    new_values
  ) VALUES (
    current_tenant_id,
    current_user_id,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    mapped_action,
    CASE WHEN TG_OP != 'INSERT' THEN row_to_json(OLD) ELSE NULL END,
    CASE WHEN TG_OP != 'DELETE' THEN row_to_json(NEW) ELSE NULL END
  );

  RETURN COALESCE(NEW, OLD);
END;
$function$;