-- Remove permissions for accruals, compliance management, violations, and Mifos

-- First remove any role_permissions that reference these permissions
DELETE FROM role_permissions 
WHERE permission_id IN (
  SELECT id FROM permissions 
  WHERE module IN ('compliance') 
     OR permission_group IN ('accruals', 'violations', 'mifos')
     OR name LIKE '%accrual%' 
     OR name LIKE '%compliance%' 
     OR name LIKE '%violation%' 
     OR name LIKE '%mifos%'
);

-- Then remove the permissions themselves
DELETE FROM permissions 
WHERE module IN ('compliance') 
   OR permission_group IN ('accruals', 'violations', 'mifos')
   OR name LIKE '%accrual%' 
   OR name LIKE '%compliance%' 
   OR name LIKE '%violation%' 
   OR name LIKE '%mifos%';