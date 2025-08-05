-- Clean up role permissions for the roles we're removing
DELETE FROM role_permissions 
WHERE role IN ('manager', 'accountant', 'loan_officer');