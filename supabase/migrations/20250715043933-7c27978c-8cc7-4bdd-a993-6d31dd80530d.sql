-- Check the table definition to see the constraint
SELECT conname, pg_get_constraintdef(c.oid) AS constraint_definition
FROM pg_constraint c
JOIN pg_class t ON c.conrelid = t.oid
JOIN pg_namespace n ON t.relnamespace = n.oid
WHERE t.relname = 'chart_of_accounts' AND c.contype = 'c';