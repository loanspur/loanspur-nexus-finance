// Simple authentication test using fetch API (no npm dependencies)
const SUPABASE_URL = "https://woqesvsopdgoikpatzxp.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvcWVzdnNvcGRnb2lrcGF0enhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1MjQ0NDMsImV4cCI6MjA2NzEwMDQ0M30.rIFhs-PZ24UZBOzE4nx1Ev8Pyp__7rMt5N-7kWNUeDI";

async function testAuth() {
  console.log('🔍 Testing Supabase Authentication...\n');

  try {
    // Test 1: Check if Supabase is accessible
    console.log('1️⃣ Testing Supabase connectivity...');
    const healthResponse = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });

    if (healthResponse.ok) {
      console.log('✅ Supabase is accessible');
    } else {
      console.log('❌ Supabase connectivity failed:', healthResponse.status);
    }

    // Test 2: Try authentication
    console.log('\n2️⃣ Testing authentication...');
    const authResponse = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        email: 'justmurenga@gmail.com',
        password: 'password123'
      })
    });

    console.log('Auth response status:', authResponse.status);
    
    if (authResponse.ok) {
      const authData = await authResponse.json();
      console.log('✅ Authentication successful:', {
        user_id: authData.user?.id,
        email: authData.user?.email
      });
    } else {
      const errorData = await authResponse.text();
      console.log('❌ Authentication failed:', {
        status: authResponse.status,
        statusText: authResponse.statusText,
        error: errorData
      });
    }

    // Test 3: Check profiles table
    console.log('\n3️⃣ Testing profiles table access...');
    const profilesResponse = await fetch(`${SUPABASE_URL}/rest/v1/profiles?email=eq.justmurenga@gmail.com`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });

    if (profilesResponse.ok) {
      const profiles = await profilesResponse.json();
      console.log(`✅ Found ${profiles.length} profile(s) for justmurenga@gmail.com`);
      profiles.forEach((profile, index) => {
        console.log(`  Profile ${index + 1}:`, {
          id: profile.id,
          email: profile.email,
          role: profile.role,
          is_active: profile.is_active
        });
      });
    } else {
      console.log('❌ Profiles table access failed:', profilesResponse.status);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAuth();
