-- Recalculate all account balances since journal entries are now posted
-- This will update the account_balances table with correct values

DO $$
DECLARE
    account_rec RECORD;
    calculated_balance NUMERIC;
BEGIN
    -- Loop through all active accounts and recalculate their balances
    FOR account_rec IN 
        SELECT DISTINCT coa.id, coa.tenant_id
        FROM chart_of_accounts coa 
        WHERE coa.is_active = true
    LOOP
        -- Calculate the current balance for this account
        calculated_balance := calculate_account_balance(account_rec.id, CURRENT_DATE);
        
        -- Update or insert the account balance
        INSERT INTO account_balances (
            tenant_id,
            account_id,
            balance_date,
            closing_balance,
            opening_balance,
            period_debits,
            period_credits
        ) VALUES (
            account_rec.tenant_id,
            account_rec.id,
            CURRENT_DATE,
            calculated_balance,
            0, -- We'll calculate this properly in a moment
            0, -- We'll calculate this properly in a moment  
            0  -- We'll calculate this properly in a moment
        )
        ON CONFLICT (tenant_id, account_id, balance_date)
        DO UPDATE SET 
            closing_balance = calculated_balance,
            updated_at = now();
            
    END LOOP;
END $$;