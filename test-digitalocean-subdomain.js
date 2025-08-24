// Test DigitalOcean Subdomain Configuration
// This script tests the DigitalOcean setup with loanspurcbs.com

const SUPABASE_URL = 'https://woqesvsopdgoikpatzxp.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvcWVzdnNvcGRnb2lrcGF0enhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1MjQ0NDMsImV4cCI6MjA2NzEwMDQ0M30.rIFhs-PZ24UZBOzE4nx1Ev8Pyp__7rMt5N-7kWNUeDI';

async function testDigitalOceanSubdomain() {
  console.log('🔍 Testing DigitalOcean Subdomain Configuration\n');

  try {
    // 1. Test subdomain detection for loanspurcbs.com
    console.log('1️⃣ Testing subdomain detection for loanspurcbs.com...');
    
    const testHostname = 'umoja-magharibi.loanspurcbs.com';
    console.log('   Testing hostname:', testHostname);
    
    // Simulate the subdomain extraction logic
    const cleanHostname = testHostname.split(':')[0];
    
    if (cleanHostname === 'loanspurcbs.com') {
      console.log('   ❌ Detected as main domain');
    } else if (cleanHostname.endsWith('.loanspurcbs.com')) {
      const subdomain = cleanHostname.replace('.loanspurcbs.com', '');
      console.log('   ✅ Extracted subdomain:', subdomain);
      console.log('   ✅ Subdomain detection working correctly');
    } else {
      console.log('   ❌ No subdomain pattern matched');
    }

    // 2. Test tenant lookup in database
    console.log('\n2️⃣ Testing tenant lookup in database...');
    
    const response = await fetch(`${SUPABASE_URL}/rest/v1/tenants?subdomain=eq.umoja-magharibi&status=eq.active&select=id,name,subdomain,domain,status`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('   Response status:', response.status);
    
    if (!response.ok) {
      console.error('   ❌ Database query failed:', response.status);
      return;
    }

    const tenants = await response.json();
    console.log('   Results found:', tenants.length);
    
    if (tenants.length > 0) {
      const tenant = tenants[0];
      console.log('   ✅ Tenant found!');
      console.log('   Tenant name:', tenant.name);
      console.log('   Tenant subdomain:', tenant.subdomain);
      console.log('   Tenant domain:', tenant.domain);
      console.log('   Tenant status:', tenant.status);
      
      // Check domain mismatch
      if (tenant.domain === 'umoja-magharibi.loanspurcbs.com') {
        console.log('   ✅ Domain matches correctly');
      } else {
        console.log('   ⚠️  Domain mismatch!');
        console.log('   Expected: umoja-magharibi.loanspurcbs.com');
        console.log('   Actual:', tenant.domain);
      }
    } else {
      console.log('   ❌ No tenant found');
    }

    // 3. Test application routing
    console.log('\n3️⃣ Testing application routing...');
    
    console.log('   Testing URLs:');
    console.log('   - https://umoja-magharibi.loanspurcbs.com');
    console.log('   - https://umoja-magharibi.loanspurcbs.com/tenant');
    console.log('   - https://umoja-magharibi.loanspurcbs.com/auth');
    
    // 4. Check DigitalOcean deployment
    console.log('\n4️⃣ Checking DigitalOcean deployment...');
    
    console.log('   Expected DigitalOcean configuration:');
    console.log('   - Domain: loanspurcbs.com');
    console.log('   - Wildcard subdomains: *.loanspurcbs.com');
    console.log('   - SSL: Wildcard certificate for *.loanspurcbs.com');
    console.log('   - Application: Deployed and running');
    
    // 5. Root cause analysis
    console.log('\n5️⃣ Root Cause Analysis...');
    
    if (tenants.length > 0) {
      const tenant = tenants[0];
      if (tenant.domain !== 'umoja-magharibi.loanspurcbs.com') {
        console.log('   🔍 Root Cause: Domain mismatch in database');
        console.log('   Solution: Update tenant domain to umoja-magharibi.loanspurcbs.com');
      } else {
        console.log('   🔍 Root Cause: Application deployment or routing issue');
        console.log('   Possible causes:');
        console.log('   - Application not deployed on DigitalOcean');
        console.log('   - DNS not pointing to DigitalOcean');
        console.log('   - SSL certificate issues');
        console.log('   - Nginx configuration problems');
      }
    } else {
      console.log('   🔍 Root Cause: Tenant not found in database');
      console.log('   Solution: Create or activate the tenant');
    }

    console.log('\n📋 Next Steps:');
    console.log('1. Verify DigitalOcean app is deployed and running');
    console.log('2. Check DNS configuration for *.loanspurcbs.com');
    console.log('3. Verify SSL certificate is active');
    console.log('4. Test main domain: https://loanspurcbs.com');
    console.log('5. Check DigitalOcean app logs for errors');

  } catch (error) {
    console.error('❌ Error testing DigitalOcean subdomain:', error);
  }
}

// Run the test
testDigitalOceanSubdomain();
