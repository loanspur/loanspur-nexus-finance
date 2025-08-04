-- Add validation function to prevent clients from being assigned to head offices
CREATE OR REPLACE FUNCTION public.validate_client_office_type()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    office_type_val TEXT;
BEGIN
    -- Get the office type for the assigned office
    SELECT office_type INTO office_type_val 
    FROM offices 
    WHERE id = NEW.office_id;
    
    -- Check if office type is head_office
    IF office_type_val = 'head_office' THEN
        RAISE EXCEPTION 'Clients cannot be assigned to head office. Please select a branch or other office type.';
    END IF;
    
    RETURN NEW;
END;
$function$;

-- Create trigger to validate client office assignment
CREATE TRIGGER validate_client_office_type_trigger
    BEFORE INSERT OR UPDATE ON clients
    FOR EACH ROW
    WHEN (NEW.office_id IS NOT NULL)
    EXECUTE FUNCTION validate_client_office_type();