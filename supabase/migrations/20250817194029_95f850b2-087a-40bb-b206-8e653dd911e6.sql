-- Add missing tenant_id column to journal_entry_lines table
-- This column is needed for multi-tenant data isolation

ALTER TABLE journal_entry_lines 
ADD COLUMN IF NOT EXISTS tenant_id UUID;

-- Add foreign key constraint to ensure data integrity
-- First, let's update existing records to inherit tenant_id from journal_entries
UPDATE journal_entry_lines 
SET tenant_id = je.tenant_id
FROM journal_entries je
WHERE journal_entry_lines.journal_entry_id = je.id
AND journal_entry_lines.tenant_id IS NULL;

-- Now add the NOT NULL constraint
ALTER TABLE journal_entry_lines 
ALTER COLUMN tenant_id SET NOT NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_journal_entry_lines_tenant_id 
ON journal_entry_lines(tenant_id);

-- Add RLS policy for tenant isolation
ALTER TABLE journal_entry_lines ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can access their tenant's journal entry lines" ON journal_entry_lines;

CREATE POLICY "Users can access their tenant's journal entry lines" 
ON journal_entry_lines 
FOR ALL 
USING (tenant_id IN (
  SELECT tenant_id FROM profiles WHERE user_id = auth.uid()
));