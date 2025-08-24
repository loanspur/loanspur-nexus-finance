// Comprehensive Subdomain Test Script
// This script tests all aspects of the subdomain issue

const SUPABASE_URL = "https://woqesvsopdgoikpatzxp.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvcWVzdnNvcGRnb2lrcGF0enhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1MjQ0NDMsImV4cCI6MjA2NzEwMDQ0M30.rIFhs-PZ24UZBOzE4nx1Ev8Pyp__7rMt5N-7kWNUeDI";

console.log('🔍 Comprehensive Subdomain Test...\n');

async function comprehensiveTest() {
  try {
    console.log('1️⃣ Testing DNS Resolution...');
    
    // Test DNS resolution for various subdomains
    const testSubdomains = [
      'abc-microfinance.loanspur.online',
      'xyz-sacco.loanspur.online',
      'community-bank.loanspur.online',
      'loanspur.online'
    ];
    
    for (const subdomain of testSubdomains) {
      try {
        const dnsResponse = await fetch(`https://${subdomain}`, {
          method: 'HEAD',
          redirect: 'manual'
        });
        console.log(`   ${subdomain}: ${dnsResponse.status} ${dnsResponse.statusText}`);
      } catch (error) {
        console.log(`   ${subdomain}: ❌ DNS/Network Error - ${error.message}`);
      }
    }

    console.log('\n2️⃣ Testing Database Access...');
    
    // Test if we can access tenants from the database
    const dbResponse = await fetch(`${SUPABASE_URL}/rest/v1/tenants?status=eq.active&select=id,name,subdomain,domain,status&limit=5`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (dbResponse.ok) {
      const tenants = await dbResponse.json();
      console.log(`   ✅ Database accessible - Found ${tenants.length} tenants`);
      
      tenants.forEach(tenant => {
        console.log(`   - ${tenant.subdomain}: ${tenant.name} (domain: ${tenant.domain || 'null'})`);
      });
    } else {
      console.log(`   ❌ Database error: ${dbResponse.status}`);
    }

    console.log('\n3️⃣ Testing Application Logic...');
    
    // Simulate the exact logic from the application
    function simulateAppLogic(hostname) {
      console.log(`   Testing hostname: ${hostname}`);
      
      // Step 1: Extract subdomain
      const cleanHostname = hostname.split(':')[0];
      console.log(`   Clean hostname: ${cleanHostname}`);
      
      // Step 2: Check if it's a main domain
      if (cleanHostname === 'loanspurcbs.com' || 
          cleanHostname === 'loanspur.online' ||
          cleanHostname === 'localhost' || 
          cleanHostname.includes('127.0.0.1')) {
        console.log(`   ❌ Detected as main domain - returning null`);
        return null;
      }
      
      // Step 3: Extract subdomain from known domains
      let subdomain = null;
      if (cleanHostname.endsWith('.loanspurcbs.com')) {
        subdomain = cleanHostname.replace('.loanspurcbs.com', '');
        console.log(`   ✅ Production subdomain: ${subdomain}`);
      } else if (cleanHostname.endsWith('.loanspur.online')) {
        subdomain = cleanHostname.replace('.loanspur.online', '');
        console.log(`   ✅ Development subdomain: ${subdomain}`);
      } else {
        console.log(`   ❌ Unknown domain pattern`);
        return null;
      }
      
      if (subdomain === 'www') {
        console.log(`   ❌ www subdomain - returning null`);
        return null;
      }
      
      console.log(`   ✅ Final subdomain: ${subdomain}`);
      return subdomain;
    }

    // Test the logic with various hostnames
    const testHostnames = [
      'abc-microfinance.loanspur.online',
      'xyz-sacco.loanspur.online',
      'loanspur.online',
      'www.loanspur.online',
      'test.loanspur.online'
    ];

    testHostnames.forEach(hostname => {
      console.log(`\n   --- Testing: ${hostname} ---`);
      const result = simulateAppLogic(hostname);
      console.log(`   Result: ${result || 'null'}`);
    });

    console.log('\n4️⃣ Testing Tenant Lookup...');
    
    // Test tenant lookup for a working subdomain
    const testSubdomain = 'abc-microfinance';
    const tenantResponse = await fetch(`${SUPABASE_URL}/rest/v1/tenants?subdomain=eq.${testSubdomain}&status=eq.active&select=*`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (tenantResponse.ok) {
      const tenantData = await tenantResponse.json();
      if (tenantData.length > 0) {
        const tenant = tenantData[0];
        console.log(`   ✅ Tenant found: ${tenant.name}`);
        console.log(`   Subdomain: ${tenant.subdomain}`);
        console.log(`   Domain: ${tenant.domain || 'null'}`);
        console.log(`   Status: ${tenant.status}`);
      } else {
        console.log(`   ❌ No tenant found for subdomain: ${testSubdomain}`);
      }
    } else {
      console.log(`   ❌ Tenant lookup failed: ${tenantResponse.status}`);
    }

    console.log('\n5️⃣ Environment Analysis...');
    
    // Check what environment we're in
    console.log(`   Current environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`   Supabase URL: ${SUPABASE_URL}`);
    console.log(`   Supabase Key: ${SUPABASE_ANON_KEY.substring(0, 20)}...`);

    console.log('\n6️⃣ Possible Issues Identified:');
    console.log('   🔍 Issue 1: DNS/Netlify routing not working');
    console.log('   🔍 Issue 2: Application not deployed correctly');
    console.log('   🔍 Issue 3: Environment variables not set in Netlify');
    console.log('   🔍 Issue 4: RLS policies blocking access');
    console.log('   🔍 Issue 5: Application logic has additional checks');

    console.log('\n7️⃣ Next Steps:');
    console.log('   1. Check Netlify dashboard for deployment status');
    console.log('   2. Verify environment variables in Netlify');
    console.log('   3. Check Netlify build logs for errors');
    console.log('   4. Test the main domain: https://loanspur.online');
    console.log('   5. Check browser console for JavaScript errors');

  } catch (error) {
    console.error('❌ Error in comprehensive test:', error);
  }
}

// Run the comprehensive test
comprehensiveTest();
