-- First, let's see what constraint is blocking us by trying to insert a test record
-- Check current account types
SELECT account_type, COUNT(*) as count 
FROM chart_of_accounts 
GROUP BY account_type;