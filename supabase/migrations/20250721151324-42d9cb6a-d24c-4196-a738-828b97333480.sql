-- Check if loan_disbursements table has RLS enabled and create policies if missing
ALTER TABLE public.loan_disbursements ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for loan_disbursements if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'loan_disbursements' 
        AND policyname = 'Users can access their tenant loan disbursements'
    ) THEN
        CREATE POLICY "Users can access their tenant loan disbursements" 
        ON public.loan_disbursements
        FOR ALL
        USING (tenant_id IN (
            SELECT profiles.tenant_id
            FROM profiles
            WHERE profiles.user_id = auth.uid()
        ));
    END IF;
END $$;

-- Check if loans table has proper RLS
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for loans if it doesn't exist  
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'loans' 
        AND policyname = 'Users can access their tenant loans'
    ) THEN
        CREATE POLICY "Users can access their tenant loans" 
        ON public.loans
        FOR ALL
        USING (tenant_id IN (
            SELECT profiles.tenant_id
            FROM profiles
            WHERE profiles.user_id = auth.uid()
        ));
    END IF;
END $$;