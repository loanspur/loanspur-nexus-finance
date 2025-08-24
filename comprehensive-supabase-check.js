// Comprehensive Supabase Connection and Email Diagnostic
const SUPABASE_URL = "https://woqesvsopdgoikpatzxp.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvcWVzdnNvcGRnb2lrcGF0enhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1MjQ0NDMsImV4cCI6MjA2NzEwMDQ0M30.rIFhs-PZ24UZBOzE4nx1Ev8Pyp__7rMt5N-7kWNUeDI";

async function comprehensiveSupabaseCheck() {
  console.log('🔍 COMPREHENSIVE SUPABASE DIAGNOSTIC\n');
  console.log('=' .repeat(50));

  const testEmail = 'justmurenga@gmail.com';

  try {
    // Test 1: Basic Supabase Connection
    console.log('\n1️⃣ Testing Basic Supabase Connection...');
    const healthResponse = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });

    console.log('   Health check status:', healthResponse.status);
    if (healthResponse.ok) {
      console.log('   ✅ Supabase connection is working');
    } else {
      console.log('   ❌ Supabase connection failed');
      const errorText = await healthResponse.text();
      console.log('   Error:', errorText);
    }

    // Test 2: Authentication
    console.log('\n2️⃣ Testing Authentication...');
    const authResponse = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        email: testEmail,
        password: 'your_password_here' // You'll need to provide the actual password
      })
    });

    console.log('   Auth status:', authResponse.status);
    if (authResponse.ok) {
      const authData = await authResponse.json();
      console.log('   ✅ Authentication successful');
      console.log('   User ID:', authData.user?.id);
    } else {
      const errorData = await authResponse.text();
      console.log('   ❌ Authentication failed:', errorData);
    }

    // Test 3: Database Tables Access
    console.log('\n3️⃣ Testing Database Tables Access...');
    
    // Check profiles table
    const profilesResponse = await fetch(`${SUPABASE_URL}/rest/v1/profiles?select=*&limit=1`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });

    console.log('   Profiles table status:', profilesResponse.status);
    if (profilesResponse.ok) {
      const profilesData = await profilesResponse.json();
      console.log('   ✅ Profiles table accessible');
      console.log('   Records found:', profilesData.length);
    } else {
      console.log('   ❌ Profiles table not accessible');
    }

    // Check password_reset_tokens table
    const tokensResponse = await fetch(`${SUPABASE_URL}/rest/v1/password_reset_tokens?select=*&limit=1`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });

    console.log('   Password reset tokens status:', tokensResponse.status);
    if (tokensResponse.ok) {
      console.log('   ✅ Password reset tokens table accessible');
    } else {
      console.log('   ❌ Password reset tokens table not accessible');
    }

    // Test 4: Edge Functions
    console.log('\n4️⃣ Testing Edge Functions...');
    
    // Test password reset function
    const resetResponse = await fetch(`${SUPABASE_URL}/functions/v1/send-password-reset-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY
      },
      body: JSON.stringify({
        email: testEmail,
        tenantSubdomain: undefined
      })
    });

    console.log('   Password reset function status:', resetResponse.status);
    if (resetResponse.ok) {
      const resetData = await resetResponse.json();
      console.log('   ✅ Password reset function working');
      console.log('   Response:', resetData);
    } else {
      const errorData = await resetResponse.text();
      console.log('   ❌ Password reset function failed:', errorData);
    }

    // Test general email function
    const emailResponse = await fetch(`${SUPABASE_URL}/functions/v1/send-test-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY
      },
      body: JSON.stringify({
        testEmail: testEmail,
        fromName: 'LoanSpur Test'
      })
    });

    console.log('   Test email function status:', emailResponse.status);
    if (emailResponse.ok) {
      const emailData = await emailResponse.json();
      console.log('   ✅ Test email function working');
      console.log('   Response:', emailData);
    } else {
      const errorData = await emailResponse.text();
      console.log('   ❌ Test email function failed:', errorData);
    }

    // Test 5: Environment Variables Check
    console.log('\n5️⃣ Checking Environment Variables...');
    console.log('   Supabase URL:', SUPABASE_URL);
    console.log('   Supabase Key (first 20 chars):', SUPABASE_ANON_KEY.substring(0, 20) + '...');
    
    // Test if the key is valid by making a simple request
    const keyTestResponse = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_ANON_KEY
      }
    });
    
    console.log('   API Key test status:', keyTestResponse.status);
    if (keyTestResponse.ok) {
      console.log('   ✅ API Key is valid');
    } else {
      console.log('   ❌ API Key might be invalid');
    }

    console.log('\n' + '=' .repeat(50));
    console.log('🎯 DIAGNOSTIC SUMMARY');
    console.log('=' .repeat(50));
    
    // Summary
    console.log('\n📋 Next Steps:');
    console.log('1. If authentication failed, check if the password is correct');
    console.log('2. If Edge Functions failed, check Supabase environment variables');
    console.log('3. If tables are not accessible, check RLS policies');
    console.log('4. If emails are not working, check Resend configuration');
    
    console.log('\n🔧 To fix email issues:');
    console.log('1. Go to Supabase Dashboard → Settings → Environment Variables');
    console.log('2. Verify RESEND_API_KEY and RESEND_EMAIL_FROM are set');
    console.log('3. Update RESEND_EMAIL_FROM to noreply@loanspur.online');
    console.log('4. Redeploy Edge Functions if needed');

  } catch (error) {
    console.error('❌ Diagnostic failed:', error.message);
    console.log('\n🔍 This might indicate:');
    console.log('- Network connectivity issues');
    console.log('- Invalid Supabase URL or API key');
    console.log('- CORS issues');
    console.log('- Supabase service downtime');
  }
}

// Instructions
console.log('📋 COMPREHENSIVE SUPABASE DIAGNOSTIC');
console.log('This will test:');
console.log('- Basic Supabase connection');
console.log('- Authentication');
console.log('- Database table access');
console.log('- Edge Functions');
console.log('- Environment variables');
console.log('');

comprehensiveSupabaseCheck();
