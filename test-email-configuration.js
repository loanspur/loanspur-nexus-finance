// Comprehensive email configuration test for Resend.com
const SUPABASE_URL = "https://woqesvsopdgoikpatzxp.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvcWVzdnNvcGRnb2lrcGF0enhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1MjQ0NDMsImV4cCI6MjA2NzEwMDQ0M30.rIFhs-PZ24UZBOzE4nx1Ev8Pyp__7rMt5N-7kWNUeDI";

async function testEmailConfiguration() {
  console.log('🔍 Testing Email Configuration (Resend.com)...\n');

  try {
    // Test 1: Check Supabase Edge Functions
    console.log('1️⃣ Testing Supabase Edge Functions...');
    const functionsResponse = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });

    if (functionsResponse.ok) {
      console.log('✅ Supabase is accessible');
    } else {
      console.log('❌ Supabase connectivity failed:', functionsResponse.status);
      return;
    }

    // Test 2: Test the send-test-email function
    console.log('\n2️⃣ Testing send-test-email function...');
    const testEmailResponse = await fetch(`${SUPABASE_URL}/functions/v1/send-test-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY
      },
      body: JSON.stringify({
        testEmail: 'justmurenga@gmail.com',
        fromName: 'LoanSpur Test'
      })
    });

    console.log('Test email response status:', testEmailResponse.status);
    
    if (testEmailResponse.ok) {
      const testEmailData = await testEmailResponse.json();
      console.log('✅ Test email function working:', testEmailData);
    } else {
      const errorData = await testEmailResponse.text();
      console.log('❌ Test email function failed:', {
        status: testEmailResponse.status,
        error: errorData
      });
    }

    // Test 3: Test password reset email function
    console.log('\n3️⃣ Testing password reset email function...');
    const passwordResetResponse = await fetch(`${SUPABASE_URL}/functions/v1/send-password-reset-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY
      },
      body: JSON.stringify({
        email: 'justmurenga@gmail.com',
        tenantSubdomain: undefined
      })
    });

    console.log('Password reset response status:', passwordResetResponse.status);
    
    if (passwordResetResponse.ok) {
      const passwordResetData = await passwordResetResponse.json();
      console.log('✅ Password reset email function working:', passwordResetData);
    } else {
      const errorData = await passwordResetResponse.text();
      console.log('❌ Password reset email function failed:', {
        status: passwordResetResponse.status,
        error: errorData
      });
    }

    // Test 4: Test OTP email function
    console.log('\n4️⃣ Testing OTP email function...');
    const otpResponse = await fetch(`${SUPABASE_URL}/functions/v1/send-otp-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY
      },
      body: JSON.stringify({
        email: 'justmurenga@gmail.com',
        type: 'verification',
        tenantName: 'Test Tenant'
      })
    });

    console.log('OTP email response status:', otpResponse.status);
    
    if (otpResponse.ok) {
      const otpData = await otpResponse.json();
      console.log('✅ OTP email function working:', otpData);
    } else {
      const errorData = await otpResponse.text();
      console.log('❌ OTP email function failed:', {
        status: otpResponse.status,
        error: errorData
      });
    }

    // Test 5: Check email configurations table
    console.log('\n5️⃣ Checking email configurations...');
    const emailConfigResponse = await fetch(`${SUPABASE_URL}/rest/v1/email_configurations`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });

    if (emailConfigResponse.ok) {
      const emailConfigs = await emailConfigResponse.json();
      console.log(`✅ Found ${emailConfigs.length} email configuration(s)`);
      emailConfigs.forEach((config, index) => {
        console.log(`  Config ${index + 1}:`, {
          id: config.id,
          provider: config.provider,
          from_email: config.from_email,
          is_active: config.is_active
        });
      });
    } else {
      console.log('❌ Email configurations table access failed:', emailConfigResponse.status);
    }

    // Test 6: Check password reset tokens table
    console.log('\n6️⃣ Checking password reset tokens...');
    const tokensResponse = await fetch(`${SUPABASE_URL}/rest/v1/password_reset_tokens`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });

    if (tokensResponse.ok) {
      const tokens = await tokensResponse.json();
      console.log(`✅ Found ${tokens.length} password reset token(s)`);
      tokens.forEach((token, index) => {
        console.log(`  Token ${index + 1}:`, {
          email: token.email,
          used: token.used,
          expires_at: token.expires_at
        });
      });
    } else {
      console.log('❌ Password reset tokens table access failed:', tokensResponse.status);
    }

    // Test 7: Check email OTPs table
    console.log('\n7️⃣ Checking email OTPs...');
    const otpsResponse = await fetch(`${SUPABASE_URL}/rest/v1/email_otps`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });

    if (otpsResponse.ok) {
      const otps = await otpsResponse.json();
      console.log(`✅ Found ${otps.length} email OTP(s)`);
      otps.forEach((otp, index) => {
        console.log(`  OTP ${index + 1}:`, {
          email: otp.email,
          used: otp.used,
          expires_at: otp.expires_at
        });
      });
    } else {
      console.log('❌ Email OTPs table access failed:', otpsResponse.status);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testEmailConfiguration();
