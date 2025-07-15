-- Update all chart of accounts with revenue category to income
UPDATE chart_of_accounts 
SET account_category = 'income' 
WHERE account_category = 'revenue';

-- Update any other revenue references in the system
UPDATE chart_of_accounts 
SET account_name = REPLACE(account_name, 'Revenue', 'Income')
WHERE account_name ILIKE '%revenue%';

UPDATE chart_of_accounts 
SET description = REPLACE(description, 'Revenue', 'Income')
WHERE description ILIKE '%revenue%';