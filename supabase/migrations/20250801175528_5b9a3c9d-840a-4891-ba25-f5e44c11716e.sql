-- Add unique constraints to clients table for National ID, Email, and Phone
-- First, let's handle any existing duplicates by updating them to NULL where they are empty strings
UPDATE clients SET national_id = NULL WHERE national_id = '';
UPDATE clients SET email = NULL WHERE email = '';
UPDATE clients SET phone = NULL WHERE phone = '';

-- Add unique constraints (allowing NULL values but ensuring non-NULL values are unique)
ALTER TABLE clients ADD CONSTRAINT clients_national_id_unique UNIQUE (tenant_id, national_id);
ALTER TABLE clients ADD CONSTRAINT clients_email_unique UNIQUE (tenant_id, email);
ALTER TABLE clients ADD CONSTRAINT clients_phone_unique UNIQUE (tenant_id, phone);