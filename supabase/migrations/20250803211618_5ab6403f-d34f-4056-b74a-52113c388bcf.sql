-- Add unique constraints for client identifiers
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS unique_client_national_id
ON clients (tenant_id, national_id)
WHERE national_id IS NOT NULL AND national_id != '';

CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS unique_client_passport
ON clients (tenant_id, passport_number)
WHERE passport_number IS NOT NULL AND passport_number != '';

CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS unique_client_driving_license
ON clients (tenant_id, driving_license_number)
WHERE driving_license_number IS NOT NULL AND driving_license_number != '';

CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS unique_client_email
ON clients (tenant_id, email)
WHERE email IS NOT NULL AND email != '';

CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS unique_client_phone
ON clients (tenant_id, phone)
WHERE phone IS NOT NULL AND phone != '';

-- Add unique constraints for client_identifiers table
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS unique_client_identifier_value
ON client_identifiers (tenant_id, identifier_type, identifier_value)
WHERE identifier_value IS NOT NULL AND identifier_value != '';

-- Add activation functionality to clients table
ALTER TABLE clients ADD COLUMN IF NOT EXISTS can_be_activated BOOLEAN DEFAULT false;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS activation_date DATE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS activated_by UUID REFERENCES profiles(id);

-- Function to check if client has mandatory fields completed
CREATE OR REPLACE FUNCTION check_client_activation_eligibility(client_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Function to activate client
CREATE OR REPLACE FUNCTION activate_client(
    client_id UUID,
    activated_by_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Trigger to automatically set can_be_activated flag when client data changes
CREATE OR REPLACE FUNCTION update_client_activation_eligibility()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    NEW.can_be_activated := check_client_activation_eligibility(NEW.id);
    RETURN NEW;
END;
$$;

-- Create trigger for clients table
DROP TRIGGER IF EXISTS trigger_update_client_activation_eligibility ON clients;
CREATE TRIGGER trigger_update_client_activation_eligibility
    BEFORE UPDATE ON clients
    FOR EACH ROW
    EXECUTE FUNCTION update_client_activation_eligibility();

-- Create trigger for client_identifiers table to update parent client
CREATE OR REPLACE FUNCTION update_parent_client_activation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    can_activate BOOLEAN;
BEGIN
    -- Check activation eligibility for the parent client
    SELECT check_client_activation_eligibility(COALESCE(NEW.client_id, OLD.client_id)) INTO can_activate;
    
    -- Update the parent client's activation eligibility
    UPDATE clients 
    SET can_be_activated = can_activate,
        updated_at = now()
    WHERE id = COALESCE(NEW.client_id, OLD.client_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create triggers for client_identifiers table
DROP TRIGGER IF EXISTS trigger_update_parent_client_activation_insert ON client_identifiers;
CREATE TRIGGER trigger_update_parent_client_activation_insert
    AFTER INSERT ON client_identifiers
    FOR EACH ROW
    EXECUTE FUNCTION update_parent_client_activation();

DROP TRIGGER IF EXISTS trigger_update_parent_client_activation_update ON client_identifiers;
CREATE TRIGGER trigger_update_parent_client_activation_update
    AFTER UPDATE ON client_identifiers
    FOR EACH ROW
    EXECUTE FUNCTION update_parent_client_activation();

DROP TRIGGER IF EXISTS trigger_update_parent_client_activation_delete ON client_identifiers;
CREATE TRIGGER trigger_update_parent_client_activation_delete
    AFTER DELETE ON client_identifiers
    FOR EACH ROW
    EXECUTE FUNCTION update_parent_client_activation();