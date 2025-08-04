-- Final comprehensive cleanup of the dummy profile

-- First delete all dependent records
DELETE FROM user_activity_logs WHERE user_id = '550e8400-e29b-41d4-a716-446655440011';
DELETE FROM user_activity_logs WHERE session_id IN (
    SELECT id FROM user_activity_sessions WHERE user_id = '550e8400-e29b-41d4-a716-446655440011'
);
DELETE FROM user_activity_sessions WHERE user_id = '550e8400-e29b-41d4-a716-446655440011';
DELETE FROM audit_trails WHERE user_id = '550e8400-e29b-41d4-a716-446655440011';
DELETE FROM user_invitations WHERE invited_by = '550e8400-e29b-41d4-a716-446655440011';
DELETE FROM approval_workflow_types WHERE created_by = '550e8400-e29b-41d4-a716-446655440011';
DELETE FROM approval_workflows WHERE created_by = '550e8400-e29b-41d4-a716-446655440011';
DELETE FROM approval_requests WHERE requested_by = '550e8400-e29b-41d4-a716-446655440011';
DELETE FROM approval_actions WHERE approver_id = '550e8400-e29b-41d4-a716-446655440011';
DELETE FROM compliance_rules WHERE created_by = '550e8400-e29b-41d4-a716-446655440011';
DELETE FROM office_staff WHERE staff_id = '550e8400-e29b-41d4-a716-446655440011';
DELETE FROM custom_roles WHERE created_by = '550e8400-e29b-41d4-a716-446655440011';

-- Clean up any remaining references
DELETE FROM notification_preferences WHERE user_id = '550e8400-e29b-41d4-a716-446655440011';
DELETE FROM message_read_receipts WHERE user_id = '550e8400-e29b-41d4-a716-446655440011';
DELETE FROM chat_participants WHERE user_id = '550e8400-e29b-41d4-a716-446655440011';

-- Finally delete the profile
DELETE FROM profiles WHERE id = '550e8400-e29b-41d4-a716-446655440011';