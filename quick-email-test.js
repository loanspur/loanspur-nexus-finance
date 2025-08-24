// Quick email test script - run after fixing Resend API key
const SUPABASE_URL = "https://woqesvsopdgoikpatzxp.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvcWVzdnNvcGRnb2lrcGF0enhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1MjQ0NDMsImV4cCI6MjA2NzEwMDQ0M30.rIFhs-PZ24UZBOzE4nx1Ev8Pyp__7rMt5N-7kWNUeDI";

async function quickEmailTest() {
  console.log('🚀 Quick Email Test (After Fixing Resend API Key)...\n');

  const testEmail = 'justmurenga@gmail.com'; // Change this to your email

  try {
    // Test 1: Test Email Function
    console.log('1️⃣ Testing send-test-email function...');
    const testResponse = await fetch(`${SUPABASE_URL}/functions/v1/send-test-email`, {
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

    if (testResponse.ok) {
      const testData = await testResponse.json();
      console.log('✅ Test email sent successfully!');
      console.log('   Response:', testData);
    } else {
      const errorData = await testResponse.text();
      console.log('❌ Test email failed:', errorData);
    }

    // Test 2: Password Reset Email
    console.log('\n2️⃣ Testing password reset email...');
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

    if (resetResponse.ok) {
      const resetData = await resetResponse.json();
      console.log('✅ Password reset email sent successfully!');
      console.log('   Response:', resetData);
    } else {
      const errorData = await resetResponse.text();
      console.log('❌ Password reset email failed:', errorData);
    }

    // Test 3: OTP Email
    console.log('\n3️⃣ Testing OTP email...');
    const otpResponse = await fetch(`${SUPABASE_URL}/functions/v1/send-otp-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY
      },
      body: JSON.stringify({
        email: testEmail,
        type: 'verification',
        tenantName: 'Test Tenant'
      })
    });

    if (otpResponse.ok) {
      const otpData = await otpResponse.json();
      console.log('✅ OTP email sent successfully!');
      console.log('   Response:', otpData);
    } else {
      const errorData = await otpResponse.text();
      console.log('❌ OTP email failed:', errorData);
    }

    console.log('\n🎉 Email Test Complete!');
    console.log('📧 Check your email inbox (and spam folder) for test emails.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Instructions
console.log('📋 Instructions:');
console.log('1. Fix your Resend API key in Supabase environment variables');
console.log('2. Run this script to test email functionality');
console.log('3. Check your email inbox for test emails');
console.log('');

quickEmailTest();
