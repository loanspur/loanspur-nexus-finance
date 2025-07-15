-- Drop the existing constraint if it exists and recreate with income included
DO $$ 
BEGIN
    -- Try to drop the constraint if it exists
    BEGIN
        ALTER TABLE chart_of_accounts DROP CONSTRAINT IF EXISTS chart_of_accounts_account_type_check;
    EXCEPTION 
        WHEN OTHERS THEN NULL;
    END;
    
    -- Add a new constraint that includes income
    ALTER TABLE chart_of_accounts 
    ADD CONSTRAINT chart_of_accounts_account_type_check 
    CHECK (account_type IN ('asset', 'liability', 'equity', 'income', 'revenue', 'expense'));
END $$;