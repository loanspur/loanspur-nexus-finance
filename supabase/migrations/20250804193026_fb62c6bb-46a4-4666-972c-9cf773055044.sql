-- Clean up all references to the dummy profile systematically
-- Start with tables that don't have dependencies

-- 1. Clean up activity logs first
DELETE FROM user_activity_logs 
WHERE user_id = '550e8400-e29b-41d4-a716-446655440011';

-- 2. Clean up activity sessions
DELETE FROM user_activity_sessions 
WHERE user_id = '550e8400-e29b-41d4-a716-446655440011';

-- 3. Clean up audit trails
DELETE FROM audit_trails 
WHERE user_id = '550e8400-e29b-41d4-a716-446655440011';

-- 4. Clean up notification preferences if they exist
DELETE FROM notification_preferences 
WHERE user_id = '550e8400-e29b-41d4-a716-446655440011';

-- 5. Clean up message read receipts if they exist
DELETE FROM message_read_receipts 
WHERE user_id = '550e8400-e29b-41d4-a716-446655440011';

-- 6. Clean up chat participants if they exist
DELETE FROM chat_participants 
WHERE user_id = '550e8400-e29b-41d4-a716-446655440011';

-- 7. Now clean up the custom roles created by this user
DELETE FROM custom_roles 
WHERE created_by = '550e8400-e29b-41d4-a716-446655440011';

-- 8. Finally, remove the dummy profile
DELETE FROM profiles 
WHERE id = '550e8400-e29b-41d4-a716-446655440011';