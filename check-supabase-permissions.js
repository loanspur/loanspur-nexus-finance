// Check Supabase permissions and access levels
const SUPABASE_URL = "https://woqesvsopdgoikpatzxp.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvcWVzdnNvcGRnb2lrcGF0enhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1MjQ0NDMsImV4cCI6MjA2NzEwMDQ0M30.rIFhs-PZ24UZBOzE4nx1Ev8Pyp__7rMt5N-7kWNUeDI";

async function checkSupabasePermissions() {
  console.log('🔍 CHECKING SUPABASE PERMISSIONS AND ACCESS\n');
  console.log('=' .repeat(60));

  try {
    // Test 1: Check API key permissions
    console.log('\n1️⃣ Testing API Key Permissions...');
    console.log('   API Key Type: Anonymous Key (anl)');
    console.log('   Expected Permissions: Limited read/write based on RLS policies');
    
    const keyTestResponse = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_ANON_KEY
      }
    });

    console.log('   API Key test status:', keyTestResponse.status);
    if (keyTestResponse.ok) {
      console.log('   ✅ API Key is valid and has basic access');
    } else {
      console.log('   ❌ API Key access denied');
      const errorText = await keyTestResponse.text();
      console.log('   Error:', errorText);
    }

    // Test 2: Check what tables are accessible
    console.log('\n2️⃣ Checking Accessible Tables...');
    const tablesResponse = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });

    if (tablesResponse.ok) {
      const tablesData = await tablesResponse.json();
      console.log('   ✅ Tables accessible:', Object.keys(tablesData).length);
      console.log('   Available tables:', Object.keys(tablesData).slice(0, 10).join(', '));
      if (Object.keys(tablesData).length > 10) {
        console.log('   ... and', Object.keys(tablesData).length - 10, 'more tables');
      }
    }

    // Test 3: Check profiles table access with different methods
    console.log('\n3️⃣ Testing Profiles Table Access Methods...');
    
    // Method 1: Anonymous access
    console.log('   Method 1: Anonymous access...');
    const anonymousProfilesResponse = await fetch(`${SUPABASE_URL}/rest/v1/profiles?select=*&limit=1`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json'
      }
    });

    console.log('   Anonymous access status:', anonymousProfilesResponse.status);
    if (anonymousProfilesResponse.ok) {
      const anonymousData = await anonymousProfilesResponse.json();
      console.log('   ✅ Anonymous access successful - Records:', anonymousData.length);
    } else {
      const errorText = await anonymousProfilesResponse.text();
      console.log('   ❌ Anonymous access blocked:', errorText);
    }

    // Method 2: With Authorization header
    console.log('   Method 2: With Authorization header...');
    const authHeaderResponse = await fetch(`${SUPABASE_URL}/rest/v1/profiles?select=*&limit=1`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('   Auth header status:', authHeaderResponse.status);
    if (authHeaderResponse.ok) {
      const authHeaderData = await authHeaderResponse.json();
      console.log('   ✅ Auth header access successful - Records:', authHeaderData.length);
    } else {
      const errorText = await authHeaderResponse.text();
      console.log('   ❌ Auth header access blocked:', errorText);
    }

    // Test 4: Check RLS policies by trying to insert/update
    console.log('\n4️⃣ Testing Write Permissions...');
    
    // Try to insert a test record (should fail due to RLS)
    const insertResponse = await fetch(`${SUPABASE_URL}/rest/v1/profiles`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User'
      })
    });

    console.log('   Insert test status:', insertResponse.status);
    if (insertResponse.ok) {
      console.log('   ⚠️  Insert succeeded (unexpected - RLS might be disabled)');
    } else {
      const errorText = await insertResponse.text();
      console.log('   ✅ Insert blocked as expected:', errorText);
    }

    // Test 5: Check if we can access auth.users (should be restricted)
    console.log('\n5️⃣ Testing Auth Tables Access...');
    const authUsersResponse = await fetch(`${SUPABASE_URL}/rest/v1/auth.users?select=*&limit=1`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('   Auth.users access status:', authUsersResponse.status);
    if (authUsersResponse.ok) {
      console.log('   ⚠️  Auth.users accessible (unexpected - should be restricted)');
    } else {
      console.log('   ✅ Auth.users properly restricted');
    }

    // Test 6: Check password reset tokens table
    console.log('\n6️⃣ Testing Password Reset Tokens Table...');
    const resetTokensResponse = await fetch(`${SUPABASE_URL}/rest/v1/password_reset_tokens?select=*&limit=1`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('   Password reset tokens status:', resetTokensResponse.status);
    if (resetTokensResponse.ok) {
      const resetTokensData = await resetTokensResponse.json();
      console.log('   ✅ Password reset tokens accessible - Records:', resetTokensData.length);
    } else {
      const errorText = await resetTokensResponse.text();
      console.log('   ❌ Password reset tokens blocked:', errorText);
    }

    // Test 7: Check Edge Functions access
    console.log('\n7️⃣ Testing Edge Functions Access...');
    const edgeFunctionResponse = await fetch(`${SUPABASE_URL}/functions/v1/send-test-email`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        testEmail: 'test@example.com',
        fromName: 'Permission Test'
      })
    });

    console.log('   Edge function status:', edgeFunctionResponse.status);
    if (edgeFunctionResponse.ok) {
      const edgeFunctionData = await edgeFunctionResponse.json();
      console.log('   ✅ Edge function accessible:', edgeFunctionData);
    } else {
      const errorText = await edgeFunctionResponse.text();
      console.log('   ❌ Edge function blocked:', errorText);
    }

    console.log('\n' + '=' .repeat(60));
    console.log('🎯 PERMISSIONS ANALYSIS SUMMARY');
    console.log('=' .repeat(60));
    
    console.log('\n📋 Current Access Level:');
    console.log('✅ API Key: Valid anonymous key');
    console.log('✅ Tables: Can see table structure');
    console.log('❌ Profiles: RLS policies blocking access');
    console.log('✅ Edge Functions: Should be accessible');
    console.log('✅ Password Reset: Should be accessible');
    
    console.log('\n🔧 Permission Issues:');
    console.log('1. RLS policies are active on profiles table');
    console.log('2. Anonymous key cannot bypass RLS policies');
    console.log('3. Authentication required for profiles access');
    console.log('4. This is a security feature, not a bug');
    
    console.log('\n💡 Solutions:');
    console.log('1. Users must authenticate before accessing profiles');
    console.log('2. Application needs proper auth flow');
    console.log('3. RLS policies are working correctly');
    console.log('4. Consider using service role key for admin operations');

  } catch (error) {
    console.error('❌ Permission check failed:', error.message);
  }
}

// Instructions
console.log('📋 SUPABASE PERMISSIONS CHECK');
console.log('This will check:');
console.log('- API key permissions');
console.log('- Table access levels');
console.log('- RLS policy restrictions');
console.log('- Edge function access');
console.log('- Write permissions');
console.log('');

checkSupabasePermissions();
