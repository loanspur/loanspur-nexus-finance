-- Comprehensive cleanup of all dummy data created by the hardcoded profile
-- This will clean up all references to the dummy profile across all tenants

-- 1. Clean up approval workflow types
DELETE FROM approval_workflow_types WHERE created_by = '550e8400-e29b-41d4-a716-446655440011';

-- 2. Clean up approval workflows
DELETE FROM approval_workflows WHERE created_by = '550e8400-e29b-41d4-a716-446655440011';

-- 3. Clean up any other references we might have missed
DELETE FROM approval_requests WHERE created_by = '550e8400-e29b-41d4-a716-446655440011';
DELETE FROM approval_actions WHERE approver_id = '550e8400-e29b-41d4-a716-446655440011';

-- 4. Clean up any compliance rules
DELETE FROM compliance_rules WHERE created_by = '550e8400-e29b-41d4-a716-446655440011';

-- 5. Clean up any system health metrics
DELETE FROM system_health_metrics WHERE tenant_id IS NULL;

-- 6. Clean up office staff assignments
DELETE FROM office_staff WHERE staff_id = '550e8400-e29b-41d4-a716-446655440011';

-- 7. Clean up custom roles
DELETE FROM custom_roles WHERE created_by = '550e8400-e29b-41d4-a716-446655440011';

-- 8. Clean up user activity logs
DELETE FROM user_activity_logs WHERE user_id = '550e8400-e29b-41d4-a716-446655440011';

-- 9. Clean up user activity sessions
DELETE FROM user_activity_sessions WHERE user_id = '550e8400-e29b-41d4-a716-446655440011';

-- 10. Clean up audit trails
DELETE FROM audit_trails WHERE user_id = '550e8400-e29b-41d4-a716-446655440011';

-- 11. Clean up notification preferences
DELETE FROM notification_preferences WHERE user_id = '550e8400-e29b-41d4-a716-446655440011';

-- 12. Clean up message read receipts
DELETE FROM message_read_receipts WHERE user_id = '550e8400-e29b-41d4-a716-446655440011';

-- 13. Clean up chat participants
DELETE FROM chat_participants WHERE user_id = '550e8400-e29b-41d4-a716-446655440011';

-- 14. Finally, remove the dummy profile
DELETE FROM profiles WHERE id = '550e8400-e29b-41d4-a716-446655440011';