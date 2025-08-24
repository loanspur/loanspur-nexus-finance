// Update Tenant Domain Script
// This script properly updates the tenant domain to use the development domain

const SUPABASE_URL = "https://woqesvsopdgoikpatzxp.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvcWVzdnNvcGRnb2lrcGF0enhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1MjQ0NDMsImV4cCI6MjA2NzEwMDQ0M30.rIFhs-PZ24UZBOzE4nx1Ev8Pyp__7rMt5N-7kWNUeDI";

console.log('🔧 Updating tenant domain to development...\n');

async function updateTenantDomain() {
  try {
    console.log('1️⃣ Current tenant status...');
    
    // First, get the current tenant details
    const getResponse = await fetch(`${SUPABASE_URL}/rest/v1/tenants?subdomain=eq.umoja-magharibi&select=id,name,subdomain,domain,status`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (getResponse.ok) {
      const data = await getResponse.json();
      if (data.length > 0) {
        const tenant = data[0];
        console.log(`   Current domain: ${tenant.domain}`);
        console.log(`   Target domain: umoja-magharibi.loanspur.online`);
      }
    }

    console.log('\n2️⃣ Updating domain field...');
    
    // Update the domain field specifically
    const updateResponse = await fetch(`${SUPABASE_URL}/rest/v1/tenants?subdomain=eq.umoja-magharibi`, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        domain: 'umoja-magharibi.loanspur.online'
      })
    });

    console.log(`   Update response status: ${updateResponse.status}`);

    if (updateResponse.ok) {
      const updatedData = await updateResponse.json();
      if (updatedData.length > 0) {
        const updatedTenant = updatedData[0];
        console.log('   ✅ Domain updated successfully!');
        console.log(`   New domain: ${updatedTenant.domain}`);
      }
    } else {
      console.log('   ❌ Failed to update domain');
      const errorText = await updateResponse.text();
      console.log(`   Error: ${errorText}`);
    }

    console.log('\n3️⃣ Verifying the update...');
    
    // Verify the update
    const verifyResponse = await fetch(`${SUPABASE_URL}/rest/v1/tenants?subdomain=eq.umoja-magharibi&select=id,name,subdomain,domain,status`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (verifyResponse.ok) {
      const verifyData = await verifyResponse.json();
      if (verifyData.length > 0) {
        const tenant = verifyData[0];
        console.log('   ✅ Verification successful!');
        console.log(`   Tenant: ${tenant.name}`);
        console.log(`   Subdomain: ${tenant.subdomain}`);
        console.log(`   Domain: ${tenant.domain}`);
        console.log(`   Status: ${tenant.status}`);
        
        if (tenant.domain === 'umoja-magharibi.loanspur.online') {
          console.log('   🎉 Domain matches correctly!');
        } else {
          console.log('   ⚠️  Domain still doesn\'t match');
        }
      }
    }

    console.log('\n🎉 Domain update process completed!');
    console.log('\n📋 Next Steps:');
    console.log('   1. Try accessing: https://umoja-magharibi.loanspur.online');
    console.log('   2. The subdomain should now work correctly');
    console.log('   3. Test the tenant functionality');
    console.log('   4. If it still doesn\'t work, check browser console for errors');

  } catch (error) {
    console.error('❌ Error updating tenant domain:', error);
    console.log('\n🔧 Alternative solutions:');
    console.log('   1. Update the domain manually in Supabase dashboard');
    console.log('   2. Use a different tenant that has the correct domain');
    console.log('   3. Test with a different subdomain');
  }
}

// Run the update
updateTenantDomain();
