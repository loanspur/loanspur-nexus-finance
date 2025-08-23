// Test script to diagnose authentication issues
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://woqesvsopdgoikpatzxp.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvcWVzdnNvcGRnb2lrcGF0enhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1MjQ0NDMsImV4cCI6MjA2NzEwMDQ0M30.rIFhs-PZ24UZBOzE4nx1Ev8Pyp__7rMt5N-7kWNUeDI";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testAuthIssues() {
  console.log('🔍 Testing Authentication Issues...\n');

  try {
    // Test 1: Check if user exists in auth.users
    console.log('1️⃣ Checking if user exists in auth.users...');
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.log('❌ Cannot access auth.users (expected for anon key):', usersError.message);
    } else {
      const user = users.users.find(u => u.email === 'justmurenga@gmail.com');
      if (user) {
        console.log('✅ User found in auth.users:', {
          id: user.id,
          email: user.email,
          email_confirmed_at: user.email_confirmed_at,
          created_at: user.created_at
        });
      } else {
        console.log('❌ User not found in auth.users');
      }
    }

    // Test 2: Check profiles table
    console.log('\n2️⃣ Checking profiles table...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', 'justmurenga@gmail.com');

    if (profilesError) {
      console.log('❌ Error accessing profiles:', profilesError.message);
    } else {
      console.log(`✅ Found ${profiles.length} profile(s) for justmurenga@gmail.com`);
      profiles.forEach((profile, index) => {
        console.log(`  Profile ${index + 1}:`, {
          id: profile.id,
          user_id: profile.user_id,
          email: profile.email,
          role: profile.role,
          is_active: profile.is_active,
          tenant_id: profile.tenant_id
        });
      });
    }

    // Test 3: Try authentication with detailed error
    console.log('\n3️⃣ Testing authentication...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'justmurenga@gmail.com',
      password: 'password123'
    });

    if (authError) {
      console.log('❌ Authentication failed:', {
        message: authError.message,
        status: authError.status,
        name: authError.name
      });
      
      // Check specific error types
      if (authError.message.includes('Invalid login credentials')) {
        console.log('💡 This suggests the password is incorrect or user doesn\'t exist');
      } else if (authError.message.includes('Email not confirmed')) {
        console.log('💡 User exists but email is not confirmed');
      } else if (authError.status === 400) {
        console.log('💡 400 Bad Request - likely invalid credentials format');
      }
    } else {
      console.log('✅ Authentication successful:', {
        user_id: authData.user?.id,
        email: authData.user?.email,
        session_exists: !!authData.session
      });
    }

    // Test 4: Check if we can create a test user
    console.log('\n4️⃣ Testing user creation (will fail with anon key, but shows error)...');
    const { data: createData, error: createError } = await supabase.auth.signUp({
      email: 'test@example.com',
      password: 'testpassword123'
    });

    if (createError) {
      console.log('❌ User creation failed (expected):', createError.message);
    } else {
      console.log('✅ User creation successful (unexpected with anon key)');
    }

    // Test 5: Check Supabase configuration
    console.log('\n5️⃣ Checking Supabase configuration...');
    console.log('URL:', SUPABASE_URL);
    console.log('Key type:', SUPABASE_ANON_KEY.startsWith('eyJ') ? 'JWT Token' : 'Invalid format');
    console.log('Key length:', SUPABASE_ANON_KEY.length);

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testAuthIssues();
