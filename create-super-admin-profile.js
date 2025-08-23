// Script to create super admin profile for existing user
const SUPABASE_URL = "https://woqesvsopdgoikpatzxp.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvcWVzdnNvcGRnb2lrcGF0enhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1MjQ0NDMsImV4cCI6MjA2NzEwMDQ0M30.rIFhs-PZ24UZBOzE4nx1Ev8Pyp__7rMt5N-7kWNUeDI";

async function createSuperAdminProfile() {
  console.log('🔧 Creating Super Admin Profile...\n');

  try {
    // Step 1: Get authentication token
    console.log('1️⃣ Getting authentication token...');
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

    if (!authResponse.ok) {
      console.log('❌ Authentication failed:', authResponse.status);
      return;
    }

    const authData = await authResponse.json();
    const accessToken = authData.access_token;
    const userId = authData.user.id;

    console.log('✅ Authentication successful, user ID:', userId);

    // Step 2: Create super admin profile
    console.log('\n2️⃣ Creating super admin profile...');
    const profileData = {
      user_id: userId,
      email: 'justmurenga@gmail.com',
      first_name: 'Super',
      last_name: 'Admin',
      role: 'super_admin',
      is_active: true,
      tenant_id: null, // Super admin has no tenant
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const profileResponse = await fetch(`${SUPABASE_URL}/rest/v1/profiles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${accessToken}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(profileData)
    });

    if (profileResponse.ok) {
      console.log('✅ Super admin profile created successfully!');
    } else {
      const errorText = await profileResponse.text();
      console.log('❌ Failed to create profile:', {
        status: profileResponse.status,
        error: errorText
      });
    }

    // Step 3: Verify profile was created
    console.log('\n3️⃣ Verifying profile creation...');
    const verifyResponse = await fetch(`${SUPABASE_URL}/rest/v1/profiles?user_id=eq.${userId}`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (verifyResponse.ok) {
      const profiles = await verifyResponse.json();
      console.log(`✅ Found ${profiles.length} profile(s) for user`);
      profiles.forEach((profile, index) => {
        console.log(`  Profile ${index + 1}:`, {
          id: profile.id,
          email: profile.email,
          role: profile.role,
          is_active: profile.is_active,
          tenant_id: profile.tenant_id
        });
      });
    } else {
      console.log('❌ Failed to verify profile:', verifyResponse.status);
    }

  } catch (error) {
    console.error('❌ Script failed:', error.message);
  }
}

createSuperAdminProfile();
