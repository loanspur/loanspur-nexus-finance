-- Get the profile ID that we want to remove
-- (the one incorrectly assigned to ABC Microfinance)
DO $$
DECLARE
    duplicate_profile_id UUID;
BEGIN
    -- Get the duplicate profile ID
    SELECT id INTO duplicate_profile_id 
    FROM profiles 
    WHERE email = 'umojamagharibi@gmail.com' 
      AND tenant_id = '550e8400-e29b-41d4-a716-446655440001';
    
    -- Only proceed if we found the duplicate profile
    IF duplicate_profile_id IS NOT NULL THEN
        -- Clean up all related records for this profile
        -- Delete user activity logs first
        DELETE FROM user_activity_logs 
        WHERE session_id IN (
            SELECT id FROM user_activity_sessions 
            WHERE user_id = duplicate_profile_id
        );
        
        -- Delete user activity sessions
        DELETE FROM user_activity_sessions 
        WHERE user_id = duplicate_profile_id;
        
        -- Delete any audit trails
        DELETE FROM audit_trails 
        WHERE user_id = duplicate_profile_id;
        
        -- Delete the duplicate profile
        DELETE FROM profiles 
        WHERE id = duplicate_profile_id;
        
        -- Log the result
        RAISE NOTICE 'Successfully cleaned up duplicate profile for umojamagharibi@gmail.com';
    ELSE
        RAISE NOTICE 'No duplicate profile found';
    END IF;
END $$;