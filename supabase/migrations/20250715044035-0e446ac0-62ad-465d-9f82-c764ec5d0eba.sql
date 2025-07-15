-- Check the column definition for account_type
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    check_clause
FROM information_schema.columns c
LEFT JOIN information_schema.check_constraints cc ON cc.constraint_name = c.column_name
WHERE table_name = 'chart_of_accounts' AND column_name = 'account_type';