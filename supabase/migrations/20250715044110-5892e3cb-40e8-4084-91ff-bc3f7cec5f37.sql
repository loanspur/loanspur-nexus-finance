-- Check if there are any records first
SELECT COUNT(*) as total_records FROM chart_of_accounts;

-- Also check what account types exist
SELECT account_type FROM chart_of_accounts LIMIT 10;