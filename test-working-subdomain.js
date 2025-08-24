// Test Working Subdomain Script
// This script tests if any other tenants work with the development domain

const SUPABASE_URL = "https://woqesvsopdgoikpatzxp.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvcWVzdnNvcGRnb2lrcGF0enhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1MjQ0NDMsImV4cCI6MjA2NzEwMDQ0M30.rIFhs-PZ24UZBOzE4nx1Ev8Pyp__7rMt5N-7kWNUeDI";

console.log('🧪 Testing alternative subdomains...\n');

async function testAlternativeSubdomains() {
  try {
    console.log('1️⃣ Getting all active tenants...');
    
    const response = await fetch(`${SUPABASE_URL}/rest/v1/tenants?status=eq.active&select=id,name,subdomain,domain,status`, {
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

    const tenants = await response.json();
    console.log(`   Found ${tenants.length} active tenants`);

    console.log('\n2️⃣ Analyzing tenant domains...');
    
    const developmentTenants = [];
    const productionTenants = [];
    const nullDomainTenants = [];

    tenants.forEach(tenant => {
      if (tenant.domain && tenant.domain.includes('.loanspur.online')) {
        developmentTenants.push(tenant);
      } else if (tenant.domain && tenant.domain.includes('.loanspur.com')) {
        productionTenants.push(tenant);
      } else {
        nullDomainTenants.push(tenant);
      }
    });

    console.log(`   Development tenants (.loanspur.online): ${developmentTenants.length}`);
    developmentTenants.forEach(tenant => {
      console.log(`   ✅ ${tenant.subdomain} -> ${tenant.domain}`);
    });

    console.log(`\n   Production tenants (.loanspur.com): ${productionTenants.length}`);
    productionTenants.forEach(tenant => {
      console.log(`   ⚠️  ${tenant.subdomain} -> ${tenant.domain}`);
    });

    console.log(`\n   Null domain tenants: ${nullDomainTenants.length}`);
    nullDomainTenants.forEach(tenant => {
      console.log(`   ❓ ${tenant.subdomain} -> ${tenant.domain || 'null'}`);
    });

    console.log('\n3️⃣ Recommendations:');
    
    if (developmentTenants.length > 0) {
      console.log('   🎉 You can test with these working subdomains:');
      developmentTenants.forEach(tenant => {
        console.log(`   - https://${tenant.subdomain}.loanspur.online`);
      });
    } else {
      console.log('   ⚠️  No tenants configured for development domain');
      console.log('   🔧 You need to update tenant domains manually');
    }

    if (nullDomainTenants.length > 0) {
      console.log('\n   💡 These tenants have null domains (might work):');
      nullDomainTenants.forEach(tenant => {
        console.log(`   - ${tenant.subdomain} (${tenant.name})`);
      });
    }

    console.log('\n4️⃣ Quick Fix Options:');
    console.log('   Option 1: Update umoja-magharibi domain manually in Supabase');
    console.log('   Option 2: Test with a different tenant');
    console.log('   Option 3: Create a new tenant for testing');

  } catch (error) {
    console.error('❌ Error testing alternative subdomains:', error);
  }
}

// Run the test
testAlternativeSubdomains();
