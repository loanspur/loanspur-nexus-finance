// Fix Tenant Domain for DigitalOcean
// This script fixes the tenant domain to work with DigitalOcean deployment

const SUPABASE_URL = 'https://woqesvsopdgoikpatzxp.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvcWVzdnNvcGRnb2lrcGF0enhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1MjQ0NDMsImV4cCI6MjA2NzEwMDQ0M30.rIFhs-PZ24UZBOzE4nx1Ev8Pyp__7rMt5N-7kWNUeDI';

async function fixTenantDomainForDigitalOcean() {
  console.log('🔧 Fixing Tenant Domain for DigitalOcean Deployment\n');

  try {
    // 1. Get current tenant configuration
    console.log('1️⃣ Getting current tenant configuration...');
    
    const fetchResponse = await fetch(`${SUPABASE_URL}/rest/v1/tenants?subdomain=eq.umoja-magharibi&select=*`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!fetchResponse.ok) {
      console.error('❌ Error fetching tenant:', fetchResponse.status);
      return;
    }

    const tenants = await fetchResponse.json();
    if (tenants.length === 0) {
      console.error('❌ Tenant not found');
      return;
    }

    const currentTenant = tenants[0];
    console.log('Current tenant configuration:');
    console.log('  Name:', currentTenant.name);
    console.log('  Subdomain:', currentTenant.subdomain);
    console.log('  Domain:', currentTenant.domain);
    console.log('  Status:', currentTenant.status);

    // 2. Update domain to match DigitalOcean deployment
    console.log('\n2️⃣ Updating domain for DigitalOcean deployment...');
    
    const updateResponse = await fetch(`${SUPABASE_URL}/rest/v1/tenants?id=eq.${currentTenant.id}`, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        domain: 'umoja-magharibi.loanspurcbs.com',
        updated_at: new Date().toISOString()
      })
    });

    console.log('Update response status:', updateResponse.status);
    
    if (!updateResponse.ok) {
      console.error('❌ Error updating tenant:', updateResponse.status);
      const errorText = await updateResponse.text();
      console.error('Error details:', errorText);
      return;
    }

    const updateResult = await updateResponse.json();
    console.log('Update result:', updateResult);

    // 3. Verify the update
    console.log('\n3️⃣ Verifying the update...');
    
    const verifyResponse = await fetch(`${SUPABASE_URL}/rest/v1/tenants?subdomain=eq.umoja-magharibi&select=*`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!verifyResponse.ok) {
      console.error('❌ Error verifying tenant:', verifyResponse.status);
      return;
    }

    const verifyTenants = await verifyResponse.json();
    if (verifyTenants.length > 0) {
      const verifyTenant = verifyTenants[0];
      console.log('✅ Verification successful!');
      console.log('  Name:', verifyTenant.name);
      console.log('  Subdomain:', verifyTenant.subdomain);
      console.log('  Domain:', verifyTenant.domain);
      console.log('  Status:', verifyTenant.status);
      
      if (verifyTenant.domain === 'umoja-magharibi.loanspurcbs.com') {
        console.log('✅ Domain correctly updated for DigitalOcean!');
      } else {
        console.log('❌ Domain not updated correctly');
        console.log('  Expected: umoja-magharibi.loanspurcbs.com');
        console.log('  Actual:', verifyTenant.domain);
      }
    } else {
      console.log('❌ Verification failed - tenant not found');
    }

    // 4. Test URLs
    console.log('\n4️⃣ Testing URLs after update...');
    console.log('   ✅ https://umoja-magharibi.loanspurcbs.com');
    console.log('   ✅ https://umoja-magharibi.loanspurcbs.com/tenant');
    console.log('   ✅ https://umoja-magharibi.loanspurcbs.com/auth');

    console.log('\n🎉 Domain fix completed for DigitalOcean!');
    console.log('\n📋 Next Steps:');
    console.log('1. Test the subdomain: https://umoja-magharibi.loanspurcbs.com');
    console.log('2. Verify the tenant loads correctly');
    console.log('3. Check that all tenant features work properly');
    console.log('4. If still getting 404, check DigitalOcean app deployment');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the fix
fixTenantDomainForDigitalOcean();
