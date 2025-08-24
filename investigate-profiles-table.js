// Detailed investigation of profiles table and Supabase configuration
const SUPABASE_URL = "https://woqesvsopdgoikpatzxp.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvcWVzdnNvcGRnb2lrcGF0enhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1MjQ0NDMsImV4cCI6MjA2NzEwMDQ0M30.rIFhs-PZ24UZBOzE4nx1Ev8Pyp__7rMt5N-7kWNUeDI";

async function investigateProfilesTable() {
  console.log('🔍 DETAILED PROFILES TABLE INVESTIGATION\n');
  console.log('=' .repeat(60));

  try {
    // Test 1: Check if we're connecting to the right Supabase project
    console.log('\n1️⃣ Verifying Supabase Project Connection...');
    console.log('   Supabase URL:', SUPABASE_URL);
    console.log('   Supabase Key (first 20 chars):', SUPABASE_ANON_KEY.substring(0, 20) + '...');
    
    const healthResponse = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });

    console.log('   Health check status:', healthResponse.status);
    if (healthResponse.ok) {
      console.log('   ✅ Connected to Supabase project');
    } else {
      console.log('   ❌ Failed to connect to Supabase project');
      const errorText = await healthResponse.text();
      console.log('   Error:', errorText);
      return;
    }

    // Test 2: Check what tables are available
    console.log('\n2️⃣ Checking Available Tables...');
    const tablesResponse = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });

    if (tablesResponse.ok) {
      const tablesData = await tablesResponse.json();
      console.log('   Available tables:', Object.keys(tablesData));
      
      // Check if profiles table exists
      if (tablesData.profiles) {
        console.log('   ✅ Profiles table exists');
      } else {
        console.log('   ❌ Profiles table not found in available tables');
        console.log('   Available tables:', Object.keys(tablesData));
        return;
      }
    }

    // Test 3: Try different ways to access profiles table
    console.log('\n3️⃣ Testing Profiles Table Access Methods...');
    
    // Method 1: Direct REST API call
    console.log('   Method 1: Direct REST API call...');
    const profilesResponse1 = await fetch(`${SUPABASE_URL}/rest/v1/profiles?select=*&limit=5`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('   REST API status:', profilesResponse1.status);
    if (profilesResponse1.ok) {
      const profilesData1 = await profilesResponse1.json();
      console.log('   ✅ REST API - Records found:', profilesData1.length);
      if (profilesData1.length > 0) {
        console.log('   Sample record:', {
          id: profilesData1[0].id,
          email: profilesData1[0].email,
          role: profilesData1[0].role
        });
      }
    } else {
      const errorText = await profilesResponse1.text();
      console.log('   ❌ REST API failed:', errorText);
    }

    // Method 2: Check with count
    console.log('\n   Method 2: Count query...');
    const countResponse = await fetch(`${SUPABASE_URL}/rest/v1/profiles?select=id&limit=1`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'count=exact'
      }
    });

    console.log('   Count query status:', countResponse.status);
    if (countResponse.ok) {
      const count = countResponse.headers.get('content-range');
      console.log('   Total records (from header):', count);
    }

    // Method 3: Check specific user
    console.log('\n   Method 3: Check specific user (justmurenga@gmail.com)...');
    const specificUserResponse = await fetch(`${SUPABASE_URL}/rest/v1/profiles?email=eq.justmurenga@gmail.com&select=*`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('   Specific user query status:', specificUserResponse.status);
    if (specificUserResponse.ok) {
      const specificUserData = await specificUserResponse.json();
      console.log('   Specific user records found:', specificUserData.length);
      if (specificUserData.length > 0) {
        console.log('   User details:', {
          id: specificUserData[0].id,
          email: specificUserData[0].email,
          role: specificUserData[0].role,
          is_active: specificUserData[0].is_active
        });
      }
    } else {
      const errorText = await specificUserResponse.text();
      console.log('   ❌ Specific user query failed:', errorText);
    }

    // Test 4: Check RLS (Row Level Security) policies
    console.log('\n4️⃣ Checking RLS Policies...');
    console.log('   Note: RLS policies might be blocking access to profiles table');
    console.log('   This is common for security reasons');
    
    // Try to access with different headers
    console.log('\n   Testing with different authorization methods...');
    
    // Test without Authorization header
    const noAuthResponse = await fetch(`${SUPABASE_URL}/rest/v1/profiles?select=*&limit=1`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json'
      }
    });

    console.log('   No Authorization header status:', noAuthResponse.status);
    if (noAuthResponse.ok) {
      const noAuthData = await noAuthResponse.json();
      console.log('   Records without auth header:', noAuthData.length);
    }

    // Test 5: Check if we need to authenticate first
    console.log('\n5️⃣ Testing Authentication Flow...');
    console.log('   Trying to authenticate first, then access profiles...');
    
    const authResponse = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        email: 'justmurenga@gmail.com',
        password: 'password123' // You might need to change this
      })
    });

    console.log('   Authentication status:', authResponse.status);
    if (authResponse.ok) {
      const authData = await authResponse.json();
      console.log('   ✅ Authentication successful');
      console.log('   Access token obtained');
      
      // Now try to access profiles with the access token
      const authenticatedProfilesResponse = await fetch(`${SUPABASE_URL}/rest/v1/profiles?select=*&limit=5`, {
        method: 'GET',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${authData.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('   Authenticated profiles query status:', authenticatedProfilesResponse.status);
      if (authenticatedProfilesResponse.ok) {
        const authenticatedProfilesData = await authenticatedProfilesResponse.json();
        console.log('   ✅ Authenticated access - Records found:', authenticatedProfilesData.length);
        if (authenticatedProfilesData.length > 0) {
          console.log('   Sample authenticated record:', {
            id: authenticatedProfilesData[0].id,
            email: authenticatedProfilesData[0].email,
            role: authenticatedProfilesData[0].role
          });
        }
      } else {
        const errorText = await authenticatedProfilesResponse.text();
        console.log('   ❌ Authenticated access failed:', errorText);
      }
    } else {
      const errorData = await authResponse.text();
      console.log('   ❌ Authentication failed:', errorData);
    }

    console.log('\n' + '=' .repeat(60));
    console.log('🎯 INVESTIGATION SUMMARY');
    console.log('=' .repeat(60));
    
    console.log('\n📋 Possible Issues:');
    console.log('1. RLS (Row Level Security) policies blocking access');
    console.log('2. Wrong Supabase project or API key');
    console.log('3. Authentication required before accessing profiles');
    console.log('4. Table name mismatch');
    console.log('5. Database schema differences');
    
    console.log('\n🔧 Next Steps:');
    console.log('1. Check Supabase Dashboard → Authentication → Policies');
    console.log('2. Verify you\'re using the correct Supabase project');
    console.log('3. Check if RLS is enabled on profiles table');
    console.log('4. Try authenticating first, then accessing profiles');

  } catch (error) {
    console.error('❌ Investigation failed:', error.message);
    console.log('\n🔍 This might indicate:');
    console.log('- Network connectivity issues');
    console.log('- Invalid Supabase configuration');
    console.log('- CORS issues');
  }
}

// Instructions
console.log('📋 PROFILES TABLE INVESTIGATION');
console.log('This will check:');
console.log('- Supabase project connection');
console.log('- Available tables');
console.log('- Profiles table access methods');
console.log('- RLS policies');
console.log('- Authentication requirements');
console.log('');

investigateProfilesTable();
