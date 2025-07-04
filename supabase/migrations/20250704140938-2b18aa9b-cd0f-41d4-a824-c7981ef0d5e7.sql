-- Add location and timezone fields to tenants table
ALTER TABLE tenants 
ADD COLUMN country TEXT,
ADD COLUMN timezone TEXT DEFAULT 'UTC',
ADD COLUMN address JSONB DEFAULT '{}',
ADD COLUMN city TEXT,
ADD COLUMN state_province TEXT,
ADD COLUMN postal_code TEXT;