// Fix Tenant Domain Script
// This script updates the tenant domain to use the development domain

const SUPABASE_URL = "https://woqesvsopdgoikpatzxp.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvcWVzdnNvcGRnb2lrcGF0enhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1MjQ0NDMsImV4cCI6MjA2NzEwMDQ0M30.rIFhs-PZ24UZBOzE4nx1Ev8Pyp__7rMt5N-7kWNUeDI";

console.log('🔧 Fixing tenant domain...\n');

async function fixTenantDomain() {
  try {
    console.log('1️⃣ Updating tenant domain for development...');
    
    // Update the tenant domain to use development domain
    const response = await fetch(`${SUPABASE_URL}/rest/v1/tenants?id=eq.1f819953-8f72-4696-88a3-e30aae532d07`, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        domain: 'umoja-magharibi.loanspur.online'
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    console.log('2️⃣ Domain update response:');
    console.log(`   Status: ${response.status}`);
    console.log('   ✅ Domain updated successfully!');

    // Verify the update
    console.log('\n3️⃣ Verifying the update...');
    const verifyResponse = await fetch(`${SUPABASE_URL}/rest/v1/tenants?subdomain=eq.umoja-magharibi&select=id,name,subdomain,domain,status`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (verifyResponse.ok) {
      const data = await verifyResponse.json();
      if (data.length > 0) {
        const tenant = data[0];
        console.log('   ✅ Verification successful!');
        console.log(`   Tenant: ${tenant.name}`);
        console.log(`   Subdomain: ${tenant.subdomain}`);
        console.log(`   Domain: ${tenant.domain}`);
        console.log(`   Status: ${tenant.status}`);
      }
    }

    console.log('\n🎉 Domain fix completed!');
    console.log('\n📋 Next Steps:');
    console.log('   1. Try accessing: https://umoja-magharibi.loanspur.online');
    console.log('   2. The subdomain should now work correctly');
    console.log('   3. Test the tenant functionality');

  } catch (error) {
    console.error('❌ Error updating tenant domain:', error);
    console.log('\n🔧 Alternative solutions:');
    console.log('   1. Update the domain manually in Supabase dashboard');
    console.log('   2. Use a different tenant that has the correct domain');
    console.log('   3. Test with a different subdomain');
  }
}

// Run the fix
fixTenantDomain();
