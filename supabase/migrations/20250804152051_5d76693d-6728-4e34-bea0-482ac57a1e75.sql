-- Update client_office_assignments to enforce one office per client
-- First, remove the current table and recreate with proper constraints
DROP TABLE IF EXISTS client_office_assignments;

-- Create a simpler client-office relationship (one-to-one)
ALTER TABLE clients ADD COLUMN IF NOT EXISTS office_id uuid;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS loan_officer_id uuid;

-- Add foreign key constraints
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'clients_office_id_fkey'
    ) THEN
        ALTER TABLE clients ADD CONSTRAINT clients_office_id_fkey 
        FOREIGN KEY (office_id) REFERENCES offices(id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'clients_loan_officer_id_fkey'
    ) THEN
        ALTER TABLE clients ADD CONSTRAINT clients_loan_officer_id_fkey 
        FOREIGN KEY (loan_officer_id) REFERENCES profiles(id);
    END IF;
END $$;

-- Add office_id to groups table
ALTER TABLE groups ADD COLUMN IF NOT EXISTS office_id uuid;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'groups_office_id_fkey'
    ) THEN
        ALTER TABLE groups ADD CONSTRAINT groups_office_id_fkey 
        FOREIGN KEY (office_id) REFERENCES offices(id);
    END IF;
END $$;

-- Create function to validate group member office consistency
CREATE OR REPLACE FUNCTION validate_group_member_office()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Create function to prevent clients from being in multiple groups
CREATE OR REPLACE FUNCTION validate_single_group_membership()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Create triggers for group member validation
DROP TRIGGER IF EXISTS trigger_validate_group_member_office ON group_members;
CREATE TRIGGER trigger_validate_group_member_office
    BEFORE INSERT OR UPDATE ON group_members
    FOR EACH ROW EXECUTE FUNCTION validate_group_member_office();

DROP TRIGGER IF EXISTS trigger_validate_single_group_membership ON group_members;
CREATE TRIGGER trigger_validate_single_group_membership
    BEFORE INSERT OR UPDATE ON group_members
    FOR EACH ROW EXECUTE FUNCTION validate_single_group_membership();

-- Update RLS policies for clients to use direct office_id
DROP POLICY IF EXISTS "Office-based access for clients" ON clients;
CREATE POLICY "Office-based access for clients" ON clients
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE user_id = auth.uid() 
      AND role = 'super_admin'
    ) OR 
    office_id IN (
      SELECT office_id FROM get_user_accessible_offices(
        (SELECT id FROM profiles WHERE user_id = auth.uid())
      )
    )
  );

-- Migrate existing client_office_assignments data to clients table
UPDATE clients 
SET office_id = (
    SELECT office_id 
    FROM client_office_assignments 
    WHERE client_id = clients.id 
    AND is_primary = true 
    LIMIT 1
)
WHERE office_id IS NULL;

-- For clients without primary office assignment, use any office assignment
UPDATE clients 
SET office_id = (
    SELECT office_id 
    FROM client_office_assignments 
    WHERE client_id = clients.id 
    LIMIT 1
)
WHERE office_id IS NULL;

-- Assign remaining clients to head office if they exist
UPDATE clients 
SET office_id = (
    SELECT id FROM offices 
    WHERE tenant_id = clients.tenant_id 
    AND office_type = 'head_office' 
    LIMIT 1
)
WHERE office_id IS NULL;