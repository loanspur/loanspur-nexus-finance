// Test Subdomain Access Script
// This script tests subdomain access and tenant detection

const SUPABASE_URL = "https://woqesvsopdgoikpatzxp.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvcWVzdnNvcGRnb2lrcGF0enhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1MjQ0NDMsImV4cCI6MjA2NzEwMDQ0M30.rIFhs-PZ24UZBOzE4nx1Ev8Pyp__7rMt5N-7kWNUeDI";

console.log('🧪 Testing subdomain access...\n');

// Simulate the subdomain detection logic
function getSubdomainFromHostname(hostname) {
  const cleanHostname = hostname.split(':')[0];
  
  // Check if it's a main domain or localhost
  if (cleanHostname === 'loanspurcbs.com' || 
      cleanHostname === 'loanspur.online' ||
      cleanHostname === 'localhost' || 
      cleanHostname.includes('127.0.0.1')) {
    return null;
  }
  
  // Extract subdomain from known base domains
  if (cleanHostname.endsWith('.loanspurcbs.com')) {
    const subdomain = cleanHostname.replace('.loanspurcbs.com', '');
    return subdomain === 'www' ? null : subdomain;
  }
  if (cleanHostname.endsWith('.loanspur.online')) {
    const subdomain = cleanHostname.replace('.loanspur.online', '');
    return subdomain === 'www' ? null : subdomain;
  }
  
  return null;
}

async function testSubdomainAccess() {
  try {
    console.log('1️⃣ Testing subdomain detection...');
    
    const testHostname = 'umoja-magharibi.loanspur.online';
    const subdomain = getSubdomainFromHostname(testHostname);
    
    console.log(`   Hostname: ${testHostname}`);
    console.log(`   Extracted subdomain: ${subdomain || 'null'}`);
    
    if (!subdomain) {
      console.log('   ❌ No subdomain detected - this is the issue!');
      return;
    }
    
    console.log('   ✅ Subdomain detected correctly');
    
    console.log('\n2️⃣ Testing tenant lookup...');
    
    // Query the tenant using the extracted subdomain
    const response = await fetch(`${SUPABASE_URL}/rest/v1/tenants?subdomain=eq.${subdomain}&status=eq.active&select=*`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    console.log(`   Query: subdomain=eq.${subdomain}&status=eq.active`);
    console.log(`   Response status: ${response.status}`);
    console.log(`   Results found: ${data.length}`);
    
    if (data.length === 0) {
      console.log('   ❌ No tenant found with this subdomain');
      console.log('\n🔧 Possible solutions:');
      console.log('   1. Check if the tenant subdomain is correct');
      console.log('   2. Verify the tenant status is "active"');
      console.log('   3. Check RLS policies');
    } else {
      const tenant = data[0];
      console.log('   ✅ Tenant found!');
      console.log(`   Tenant name: ${tenant.name}`);
      console.log(`   Tenant subdomain: ${tenant.subdomain}`);
      console.log(`   Tenant domain: ${tenant.domain}`);
      console.log(`   Tenant status: ${tenant.status}`);
      
      // Check if domain matches
      const expectedDomain = `${subdomain}.loanspur.online`;
      if (tenant.domain !== expectedDomain) {
        console.log(`   ⚠️  Domain mismatch!`);
        console.log(`   Expected: ${expectedDomain}`);
        console.log(`   Actual: ${tenant.domain}`);
        console.log('\n🔧 This is likely the issue!');
      } else {
        console.log('   ✅ Domain matches correctly');
      }
    }

    console.log('\n3️⃣ Testing alternative subdomains...');
    
    // Test with a different tenant that might work
    const alternativeTenants = ['abc-microfinance', 'xyz-sacco', 'community-bank'];
    
    for (const altSubdomain of alternativeTenants) {
      const altResponse = await fetch(`${SUPABASE_URL}/rest/v1/tenants?subdomain=eq.${altSubdomain}&status=eq.active&select=name,subdomain,domain`, {
        method: 'GET',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (altResponse.ok) {
        const altData = await altResponse.json();
        if (altData.length > 0) {
          const altTenant = altData[0];
          console.log(`   ${altSubdomain}: ${altTenant.domain}`);
        }
      }
    }

  } catch (error) {
    console.error('❌ Error testing subdomain access:', error);
  }
}

// Run the test
testSubdomainAccess();
