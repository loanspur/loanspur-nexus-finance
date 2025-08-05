-- Add accounting fields to savings_products table if they don't exist
DO $$
BEGIN
    -- Check if max_overdraft_amount column exists, if not add it
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'savings_products' 
                   AND column_name = 'max_overdraft_amount') THEN
        ALTER TABLE public.savings_products 
        ADD COLUMN max_overdraft_amount NUMERIC DEFAULT 0;
    END IF;

    -- Check if accounting_method column exists, if not add it
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'savings_products' 
                   AND column_name = 'accounting_method') THEN
        ALTER TABLE public.savings_products 
        ADD COLUMN accounting_method TEXT DEFAULT 'accrual_periodic';
    END IF;

    -- Check if savings_reference_account_id column exists, if not add it
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'savings_products' 
                   AND column_name = 'savings_reference_account_id') THEN
        ALTER TABLE public.savings_products 
        ADD COLUMN savings_reference_account_id UUID REFERENCES public.chart_of_accounts(id);
    END IF;

    -- Check if savings_control_account_id column exists, if not add it
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'savings_products' 
                   AND column_name = 'savings_control_account_id') THEN
        ALTER TABLE public.savings_products 
        ADD COLUMN savings_control_account_id UUID REFERENCES public.chart_of_accounts(id);
    END IF;

    -- Check if interest_on_savings_account_id column exists, if not add it
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'savings_products' 
                   AND column_name = 'interest_on_savings_account_id') THEN
        ALTER TABLE public.savings_products 
        ADD COLUMN interest_on_savings_account_id UUID REFERENCES public.chart_of_accounts(id);
    END IF;

    -- Check if income_from_fees_account_id column exists, if not add it
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'savings_products' 
                   AND column_name = 'income_from_fees_account_id') THEN
        ALTER TABLE public.savings_products 
        ADD COLUMN income_from_fees_account_id UUID REFERENCES public.chart_of_accounts(id);
    END IF;

    -- Check if income_from_penalties_account_id column exists, if not add it
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'savings_products' 
                   AND column_name = 'income_from_penalties_account_id') THEN
        ALTER TABLE public.savings_products 
        ADD COLUMN income_from_penalties_account_id UUID REFERENCES public.chart_of_accounts(id);
    END IF;

    -- Check if overdraft_portfolio_control_id column exists, if not add it
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'savings_products' 
                   AND column_name = 'overdraft_portfolio_control_id') THEN
        ALTER TABLE public.savings_products 
        ADD COLUMN overdraft_portfolio_control_id UUID REFERENCES public.chart_of_accounts(id);
    END IF;

    -- Check if payment_type_mappings column exists, if not add it
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'savings_products' 
                   AND column_name = 'payment_type_mappings') THEN
        ALTER TABLE public.savings_products 
        ADD COLUMN payment_type_mappings JSONB DEFAULT '[]'::jsonb;
    END IF;

    -- Check if fee_mappings column exists, if not add it
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'savings_products' 
                   AND column_name = 'fee_mappings') THEN
        ALTER TABLE public.savings_products 
        ADD COLUMN fee_mappings JSONB DEFAULT '[]'::jsonb;
    END IF;
END $$;