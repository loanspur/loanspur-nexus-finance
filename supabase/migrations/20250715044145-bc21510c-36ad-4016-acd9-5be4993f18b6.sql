-- Now update all revenue accounts to income accounts
UPDATE chart_of_accounts 
SET account_type = 'income', 
    updated_at = now()
WHERE account_type = 'revenue';