-- Add unique constraint for reference numbers within each tenant
-- This ensures transaction reference numbers are unique per tenant
CREATE UNIQUE INDEX idx_unique_reference_per_tenant 
ON savings_transactions (tenant_id, reference_number) 
WHERE reference_number IS NOT NULL AND reference_number != '';

-- Add comment to explain the constraint
COMMENT ON INDEX idx_unique_reference_per_tenant IS 'Ensures reference numbers are unique within each tenant, ignoring null and empty values';