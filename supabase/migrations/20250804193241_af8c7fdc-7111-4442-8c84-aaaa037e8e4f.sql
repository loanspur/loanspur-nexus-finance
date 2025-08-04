-- Clean up with correct column names

-- 1. Clean up approval workflow types
DELETE FROM approval_workflow_types WHERE created_by = '550e8400-e29b-41d4-a716-446655440011';

-- 2. Clean up approval workflows
DELETE FROM approval_workflows WHERE created_by = '550e8400-e29b-41d4-a716-446655440011';

-- 3. Clean up approval requests and actions with correct column names
DELETE FROM approval_requests WHERE requested_by = '550e8400-e29b-41d4-a716-446655440011';
DELETE FROM approval_actions WHERE approver_id = '550e8400-e29b-41d4-a716-446655440011';

-- 4. Clean up compliance rules
DELETE FROM compliance_rules WHERE created_by = '550e8400-e29b-41d4-a716-446655440011';

-- 5. Clean up office staff assignments
DELETE FROM office_staff WHERE staff_id = '550e8400-e29b-41d4-a716-446655440011';

-- 6. Clean up custom roles
DELETE FROM custom_roles WHERE created_by = '550e8400-e29b-41d4-a716-446655440011';

-- 7. Clean up user activity data
DELETE FROM user_activity_logs WHERE user_id = '550e8400-e29b-41d4-a716-446655440011';
DELETE FROM user_activity_sessions WHERE user_id = '550e8400-e29b-41d4-a716-446655440011';

-- 8. Clean up audit trails
DELETE FROM audit_trails WHERE user_id = '550e8400-e29b-41d4-a716-446655440011';

-- 9. Clean up other user references if they exist
DELETE FROM notification_preferences WHERE user_id = '550e8400-e29b-41d4-a716-446655440011';
DELETE FROM message_read_receipts WHERE user_id = '550e8400-e29b-41d4-a716-446655440011';
DELETE FROM chat_participants WHERE user_id = '550e8400-e29b-41d4-a716-446655440011';

-- 10. Finally, remove the dummy profile
DELETE FROM profiles WHERE id = '550e8400-e29b-41d4-a716-446655440011';