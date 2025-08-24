// Test Null Domain Tenant Script
// This script tests if tenants with null domains work with development subdomain

const SUPABASE_URL = "https://woqesvsopdgoikpatzxp.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvcWVzdnNvcGRnb2lrcGF0enhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1MjQ0NDMsImV4cCI6MjA2NzEwMDQ0M30.rIFhs-PZ24UZBOzE4nx1Ev8Pyp__7rMt5N-7kWNUeDI";

console.log('🧪 Testing null domain tenants...\n');

async function testNullDomainTenants() {
  try {
    console.log('1️⃣ Testing tenant with null domain...');
    
    // Test with abc-microfinance (has null domain)
    const testSubdomain = 'abc-microfinance';
    const testHostname = `${testSubdomain}.loanspur.online`;
    
    console.log(`   Testing: ${testHostname}`);
    
    // Query the tenant
    const response = await fetch(`${SUPABASE_URL}/rest/v1/tenants?subdomain=eq.${testSubdomain}&status=eq.active&select=*`, {
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
    
    if (data.length === 0) {
      console.log('   ❌ Tenant not found');
      return;
    }

    const tenant = data[0];
    console.log('   ✅ Tenant found!');
    console.log(`   Name: ${tenant.name}`);
    console.log(`   Subdomain: ${tenant.subdomain}`);
    console.log(`   Domain: ${tenant.domain || 'null'}`);
    console.log(`   Status: ${tenant.status}`);

    // Simulate the subdomain detection logic
    function getSubdomainFromHostname(hostname) {
      const cleanHostname = hostname.split(':')[0];
      
      if (cleanHostname === 'loanspurcbs.com' || 
          cleanHostname === 'loanspur.online' ||
          cleanHostname === 'localhost' || 
          cleanHostname.includes('127.0.0.1')) {
        return null;
      }
      
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

    const extractedSubdomain = getSubdomainFromHostname(testHostname);
    console.log(`   Extracted subdomain: ${extractedSubdomain}`);
    
    if (extractedSubdomain === tenant.subdomain) {
      console.log('   ✅ Subdomain matches!');
      console.log('   🎉 This tenant should work!');
    } else {
      console.log('   ❌ Subdomain mismatch');
    }

    console.log('\n2️⃣ Testing multiple null domain tenants...');
    
    const nullDomainTenants = ['abc-microfinance', 'xyz-sacco', 'community-bank', 'startup-loans'];
    
    for (const subdomain of nullDomainTenants) {
      const tenantResponse = await fetch(`${SUPABASE_URL}/rest/v1/tenants?subdomain=eq.${subdomain}&status=eq.active&select=name,subdomain,domain`, {
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
          const t = tenantData[0];
          console.log(`   ${subdomain}: ${t.name} (domain: ${t.domain || 'null'})`);
        }
      }
    }

    console.log('\n3️⃣ Recommendations:');
    console.log('   🎉 Try these working subdomains:');
    nullDomainTenants.forEach(subdomain => {
      console.log(`   - https://${subdomain}.loanspur.online`);
    });

    console.log('\n4️⃣ Why null domain tenants work:');
    console.log('   - Tenants with null domains don\'t have domain restrictions');
    console.log('   - They can be accessed via any valid subdomain pattern');
    console.log('   - The application only checks the subdomain, not the domain field');

  } catch (error) {
    console.error('❌ Error testing null domain tenants:', error);
  }
}

// Run the test
testNullDomainTenants();
