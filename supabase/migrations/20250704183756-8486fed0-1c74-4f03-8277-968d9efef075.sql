-- Update the super admin user to have a tenant_id so they can see groups
UPDATE profiles 
SET tenant_id = '550e8400-e29b-41d4-a716-446655440001' 
WHERE user_id = '79591c7c-540d-4a22-99d7-17b481de8e68';