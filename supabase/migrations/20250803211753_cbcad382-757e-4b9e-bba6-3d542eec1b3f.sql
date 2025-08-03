-- Fix function search paths for security
CREATE OR REPLACE FUNCTION check_client_activation_eligibility(client_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    client_record RECORD;
    has_identifier BOOLEAN := false;
BEGIN
    -- Get client data
    SELECT * INTO client_record
    FROM clients 
    WHERE id = client_id;
    
    IF NOT FOUND THEN
        RETURN false;
    END IF;
    
    -- Check mandatory fields
    IF client_record.first_name IS NULL OR client_record.first_name = '' OR
       client_record.last_name IS NULL OR client_record.last_name = '' OR
       client_record.phone IS NULL OR client_record.phone = '' OR
       client_record.date_of_birth IS NULL THEN
        RETURN false;
    END IF;
    
    -- Check if client has at least one identifier
    IF client_record.national_id IS NOT NULL AND client_record.national_id != '' THEN
        has_identifier := true;
    ELSIF client_record.passport_number IS NOT NULL AND client_record.passport_number != '' THEN
        has_identifier := true;
    ELSIF client_record.driving_license_number IS NOT NULL AND client_record.driving_license_number != '' THEN
        has_identifier := true;
    ELSE
        -- Check client_identifiers table
        SELECT EXISTS(
            SELECT 1 FROM client_identifiers 
            WHERE client_id = client_record.id 
            AND identifier_value IS NOT NULL 
            AND identifier_value != ''
        ) INTO has_identifier;
    END IF;
    
    RETURN has_identifier;
END;
$$;

-- Fix function search paths for security
CREATE OR REPLACE FUNCTION activate_client(
    client_id UUID,
    activated_by_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    can_activate BOOLEAN;
BEGIN
    -- Check if client is eligible for activation
    SELECT check_client_activation_eligibility(client_id) INTO can_activate;
    
    IF NOT can_activate THEN
        RAISE EXCEPTION 'Client does not meet activation requirements';
    END IF;
    
    -- Activate the client
    UPDATE clients 
    SET 
        is_active = true,
        approval_status = 'approved',
        activation_date = CURRENT_DATE,
        activated_by = activated_by_id,
        approved_by = activated_by_id,
        approved_at = now(),
        updated_at = now()
    WHERE id = client_id;
    
    RETURN true;
END;
$$;