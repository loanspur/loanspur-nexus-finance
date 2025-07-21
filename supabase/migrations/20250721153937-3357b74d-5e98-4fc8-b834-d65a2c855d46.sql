-- Add missing loan application status values
-- First, let's see what constraint exists
DO $$ 
BEGIN
    -- Remove the existing check constraint if it exists
    ALTER TABLE loan_applications DROP CONSTRAINT IF EXISTS loan_applications_status_check;
    
    -- Add the new check constraint with all required status values
    ALTER TABLE loan_applications ADD CONSTRAINT loan_applications_status_check 
    CHECK (status IN ('pending', 'under_review', 'approved', 'pending_disbursement', 'disbursed', 'rejected', 'withdrawn'));
END $$;