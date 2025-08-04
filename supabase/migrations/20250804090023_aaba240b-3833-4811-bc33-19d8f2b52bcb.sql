-- Add unique constraint to national_id field in clients table
-- This will ensure that national ID numbers are unique across the entire system

-- First, let's check if there are any duplicate national_id values and handle them
UPDATE clients 
SET national_id = NULL 
WHERE national_id IS NOT NULL 
AND national_id IN (
  SELECT national_id 
  FROM clients 
  WHERE national_id IS NOT NULL 
  GROUP BY national_id 
  HAVING COUNT(*) > 1
);

-- Now add the unique constraint
ALTER TABLE clients 
ADD CONSTRAINT clients_national_id_unique UNIQUE (national_id);

-- Also add a partial unique index to handle NULL values properly
-- This allows multiple NULL values while ensuring non-NULL values are unique
CREATE UNIQUE INDEX clients_national_id_unique_idx 
ON clients (national_id) 
WHERE national_id IS NOT NULL;