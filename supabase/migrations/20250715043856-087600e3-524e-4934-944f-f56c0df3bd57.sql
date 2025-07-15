-- Update all revenue accounts to income accounts
UPDATE chart_of_accounts 
SET account_type = 'income'
WHERE account_type = 'revenue';