-- Fix security warnings by setting search paths for the new functions
CREATE OR REPLACE FUNCTION validate_group_member_office()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    group_office_id UUID;
    member_office_id UUID;
BEGIN
    -- Get the group's office
    SELECT office_id INTO group_office_id 
    FROM groups 
    WHERE id = NEW.group_id;
    
    -- Get the member's office
    SELECT office_id INTO member_office_id 
    FROM clients 
    WHERE id = NEW.client_id;
    
    -- Check if offices match
    IF group_office_id IS NOT NULL AND member_office_id IS NOT NULL THEN
        IF group_office_id != member_office_id THEN
            RAISE EXCEPTION 'Client office must match group office';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION validate_single_group_membership()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    -- Check if client is already in another group
    IF EXISTS (
        SELECT 1 FROM group_members 
        WHERE client_id = NEW.client_id 
        AND group_id != NEW.group_id
        AND id != COALESCE(NEW.id, gen_random_uuid())
    ) THEN
        RAISE EXCEPTION 'Client can only be a member of one group at a time';
    END IF;
    
    RETURN NEW;
END;
$$;