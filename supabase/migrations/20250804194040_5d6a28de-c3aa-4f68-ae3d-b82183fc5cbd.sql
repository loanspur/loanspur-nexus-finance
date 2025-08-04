-- Clean up any remaining auth user references that might be cached
-- First check if the auth user still exists in auth.users table
-- Note: We can't query auth.users directly, but we can clean up profile references

-- Check for any remaining profiles with this problematic user_id
DO $$
DECLARE
    problematic_user_id UUID := 'd3ee51ba-0fa8-4cb1-9fd1-f7822274281e';
BEGIN
    -- Log any remaining references
    RAISE NOTICE 'Checking for user_id: %', problematic_user_id;
    
    -- Clean up any remaining profile references (should be none after our cleanup)
    DELETE FROM profiles WHERE user_id = problematic_user_id;
    
    -- Clean up any activity sessions that might reference this user
    DELETE FROM user_activity_sessions WHERE user_id IN (
        SELECT id FROM profiles WHERE user_id = problematic_user_id
    );
    
    -- Clean up any other references
    DELETE FROM audit_trails WHERE user_id IN (
        SELECT id FROM profiles WHERE user_id = problematic_user_id
    );
    
    RAISE NOTICE 'Cleanup completed for user_id: %', problematic_user_id;
END $$;