-- Check if account_type is an enum and what values it allows
SELECT 
    t.typname AS enum_name,
    e.enumlabel AS enum_value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname LIKE '%account%'
ORDER BY t.typname, e.enumsortorder;