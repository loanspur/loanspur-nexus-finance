-- Clean up user invitations and then remove the dummy profile

-- 1. Clean up user invitations
DELETE FROM user_invitations WHERE invited_by = '550e8400-e29b-41d4-a716-446655440011';

-- 2. Remove the dummy profile
DELETE FROM profiles WHERE id = '550e8400-e29b-41d4-a716-446655440011';