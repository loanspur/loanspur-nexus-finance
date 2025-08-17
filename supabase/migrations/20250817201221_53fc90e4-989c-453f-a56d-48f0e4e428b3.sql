-- Fix RLS policy for journal_entry_lines to be more secure
-- Remove the overly permissive auth.uid() IS NULL condition and make it more specific

-- Drop the existing policy
DROP POLICY IF EXISTS "Users can access their tenant's journal entry lines" ON journal_entry_lines;

-- Create a more secure policy that only allows tenant users
CREATE POLICY "Users can access their tenant's journal entry lines" 
ON journal_entry_lines 
FOR ALL 
USING (
  -- Allow if user belongs to the same tenant
  tenant_id IN (
    SELECT profiles.tenant_id
    FROM profiles
    WHERE profiles.user_id = auth.uid()
  )
)
WITH CHECK (
  -- For inserts/updates, ensure tenant_id matches user's tenant
  tenant_id IN (
    SELECT profiles.tenant_id
    FROM profiles
    WHERE profiles.user_id = auth.uid()
  )
);