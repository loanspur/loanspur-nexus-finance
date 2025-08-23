// Debug script to check super admin user status
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://woqesvsopdgoikpatzxp.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvcWVzdnNvcGRnb2lrcGF0enhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1MjQ0NDMsImV4cCI6MjA2NzEwMDQ0M30.rIFhs-PZ24UZBOzE4nx1Ev8Pyp__7rMt5N-7kWNUeDI";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function debugSuperAdmin() {
  console.log('🔍 Debugging Super Admin Login Issues...\n');

  try {
    // Step 1: Check if the user exists in auth.users
    console.log('1️⃣ Checking auth.users table...');
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Error accessing auth.users:', authError);
      return;
    }

    const superAdminUser = authUsers.users.find(u => u.email === 'justmurenga@gmail.com');
    
    if (!superAdminUser) {
      console.log('❌ User not found in auth.users table');
      console.log('Available users:');
      authUsers.users.forEach(user => {
        console.log(`  - ${user.email} (${user.id})`);
      });
      return;
    }

    console.log('✅ User found in auth.users:', {
      id: superAdminUser.id,
      email: superAdminUser.email,
      email_confirmed_at: superAdminUser.email_confirmed_at,
      created_at: superAdminUser.created_at,
      last_sign_in_at: superAdminUser.last_sign_in_at
    });

    // Step 2: Check profiles table
    console.log('\n2️⃣ Checking profiles table...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', 'justmurenga@gmail.com');

    if (profilesError) {
      console.error('❌ Error accessing profiles table:', profilesError);
      return;
    }

    console.log(`Found ${profiles.length} profile(s) for justmurenga@gmail.com:`);
    profiles.forEach((profile, index) => {
      console.log(`  Profile ${index + 1}:`, {
        id: profile.id,
        user_id: profile.user_id,
        email: profile.email,
        role: profile.role,
        is_active: profile.is_active,
        tenant_id: profile.tenant_id,
        created_at: profile.created_at,
        updated_at: profile.updated_at
      });
    });

    // Step 3: Check for active super admin profile
    const activeSuperAdmin = profiles.find(p => 
      p.role === 'super_admin' && 
      p.is_active === true && 
      p.tenant_id === null
    );

    if (!activeSuperAdmin) {
      console.log('\n❌ No active super admin profile found');
      console.log('Issues found:');
      
      const superAdminProfiles = profiles.filter(p => p.role === 'super_admin');
      if (superAdminProfiles.length === 0) {
        console.log('  - No super_admin role profiles found');
      } else {
        superAdminProfiles.forEach(p => {
          if (!p.is_active) console.log('  - Super admin profile is inactive');
          if (p.tenant_id !== null) console.log('  - Super admin profile has tenant_id (should be null)');
        });
      }
      return;
    }

    console.log('\n✅ Active super admin profile found:', {
      id: activeSuperAdmin.id,
      user_id: activeSuperAdmin.user_id,
      role: activeSuperAdmin.role,
      is_active: activeSuperAdmin.is_active,
      tenant_id: activeSuperAdmin.tenant_id
    });

    // Step 4: Test authentication
    console.log('\n3️⃣ Testing authentication...');
    const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'justmurenga@gmail.com',
      password: 'password123'
    });

    if (signInError) {
      console.log('❌ Authentication failed:', signInError.message);
      
      if (signInError.message.includes('Invalid login credentials')) {
        console.log('💡 Possible solutions:');
        console.log('  - Check if password is correct');
        console.log('  - Try resetting password');
        console.log('  - Verify user exists in auth.users');
      }
      return;
    }

    console.log('✅ Authentication successful:', {
      user_id: authData.user?.id,
      email: authData.user?.email
    });

    // Step 5: Test profile retrieval after authentication
    console.log('\n4️⃣ Testing profile retrieval after authentication...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', authData.user!.id)
      .eq('is_active', true)
      .single();

    if (profileError) {
      console.log('❌ Profile retrieval failed:', profileError.message);
      return;
    }

    if (!profile) {
      console.log('❌ No active profile found after authentication');
      return;
    }

    console.log('✅ Profile retrieved successfully:', {
      id: profile.id,
      role: profile.role,
      is_active: profile.is_active,
      tenant_id: profile.tenant_id
    });

    // Step 6: Check RLS policies
    console.log('\n5️⃣ Checking RLS policies...');
    const { data: rlsTest, error: rlsError } = await supabase
      .from('profiles')
      .select('count')
      .eq('role', 'super_admin');

    if (rlsError) {
      console.log('❌ RLS policy issue:', rlsError.message);
    } else {
      console.log('✅ RLS policies working correctly');
    }

    console.log('\n🎉 Super Admin Login Debug Complete!');
    console.log('Summary:');
    console.log('  ✅ User exists in auth.users');
    console.log('  ✅ Active super admin profile found');
    console.log('  ✅ Authentication successful');
    console.log('  ✅ Profile retrieval working');
    console.log('  ✅ RLS policies working');

  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

debugSuperAdmin();
