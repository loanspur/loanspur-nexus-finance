-- Update RLS policy for loans table to ensure better visibility
DROP POLICY IF EXISTS "Users can access their tenant's loans" ON loans;

-- Create a more comprehensive RLS policy for loans that allows proper access
CREATE POLICY "Users can access their tenant's loans" ON loans
FOR ALL
USING (
  tenant_id IN (
    SELECT tenant_id FROM profiles WHERE user_id = auth.uid()
  )
);

-- Also ensure users can see loan applications they have access to
DROP POLICY IF EXISTS "Users can access their tenant's loan applications" ON loan_applications;

CREATE POLICY "Users can access their tenant's loan applications" ON loan_applications
FOR ALL
USING (
  tenant_id IN (
    SELECT tenant_id FROM profiles WHERE user_id = auth.uid()
  )
);

-- Add index on loans table for better performance
CREATE INDEX IF NOT EXISTS idx_loans_client_tenant ON loans(client_id, tenant_id);
CREATE INDEX IF NOT EXISTS idx_loans_status ON loans(status);

-- Add index on loan_applications table for better performance  
CREATE INDEX IF NOT EXISTS idx_loan_applications_client_tenant ON loan_applications(client_id, tenant_id);
CREATE INDEX IF NOT EXISTS idx_loan_applications_status ON loan_applications(status);