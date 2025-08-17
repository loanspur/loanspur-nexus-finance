-- Fix RLS policy for journal_entry_lines to allow accounting functions to work
-- The current policy is too restrictive and blocks loan repayment journal entries

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can access their tenant's journal entry lines" ON journal_entry_lines;

-- Create a more permissive policy that allows:
-- 1. Users to access their tenant's journal entry lines
-- 2. Database functions (SECURITY DEFINER) to insert/update journal entries for accounting
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
  -- OR if this is a database function call (no auth context)
  OR auth.uid() IS NULL
)
WITH CHECK (
  -- For inserts/updates, allow if user belongs to the same tenant
  tenant_id IN (
    SELECT profiles.tenant_id
    FROM profiles
    WHERE profiles.user_id = auth.uid()
  )
  -- OR if this is a database function call (no auth context)
  OR auth.uid() IS NULL
);