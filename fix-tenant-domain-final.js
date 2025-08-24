// Fix Tenant Domain - Final Solution
// This script fixes the tenant domain from loanspur.com to loanspurcbs.com

const SUPABASE_URL = 'https://woqesvsopdgoikpatzxp.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvcWVzdnNvcGRnb2lrcGF0enhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1MjQ0NDMsImV4cCI6MjA2NzEwMDQ0M30.rIFhs-PZ24UZBOzE4nx1Ev8Pyp__7rMt5N-7kWNUeDI';

console.log('🔧 Fixing Tenant Domain - Final Solution\n');

async function fixTenantDomain() {
  try {
    console.log('1️⃣ Checking current tenant configuration...');
    
    // First, let's see what tenants we have
    const listResponse = await fetch(`${SUPABASE_URL}/rest/v1/tenants?select=id,name,subdomain,domain,status&order=name.asc`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!listResponse.ok) {
      console.error('❌ Error fetching tenants:', listResponse.status);
      return;
    }

    const tenants = await listResponse.json();
    console.log(`   Found ${tenants.length} tenants in database`);
    
    // Find tenants with wrong domain
    const tenantsToFix = tenants.filter(tenant => 
      tenant.domain && tenant.domain.includes('loanspur.com') && tenant.status === 'active'
    );
    
    console.log(`   Found ${tenantsToFix.length} tenants with wrong domain (loanspur.com)`);
    
    if (tenantsToFix.length === 0) {
      console.log('   ✅ No tenants need fixing!');
      return;
    }

    console.log('\n2️⃣ Fixing tenant domains...');
    
    for (const tenant of tenantsToFix) {
      console.log(`   Processing: ${tenant.name} (${tenant.subdomain})`);
      console.log(`   Current domain: ${tenant.domain}`);
      
      // Create the correct domain
      const correctDomain = `${tenant.subdomain}.loanspurcbs.com`;
      console.log(`   Correct domain: ${correctDomain}`);
      
      // Update the tenant
      const updateResponse = await fetch(`${SUPABASE_URL}/rest/v1/tenants?id=eq.${tenant.id}`, {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          domain: correctDomain,
          updated_at: new Date().toISOString()
        })
      });

      console.log(`   Update response status: ${updateResponse.status}`);
      
      if (!updateResponse.ok) {
        console.error(`   ❌ Failed to update ${tenant.name}:`, updateResponse.status);
        const errorText = await updateResponse.text();
        console.error(`   Error details: ${errorText}`);
        continue;
      }

      const updateResult = await updateResponse.json();
      console.log(`   ✅ Successfully updated ${tenant.name}`);
      console.log(`   New domain: ${updateResult[0]?.domain || 'unknown'}`);
    }

    console.log('\n3️⃣ Verifying the fixes...');
    
    // Verify the changes
    const verifyResponse = await fetch(`${SUPABASE_URL}/rest/v1/tenants?select=id,name,subdomain,domain,status&order=name.asc`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!verifyResponse.ok) {
      console.error('❌ Error verifying tenants:', verifyResponse.status);
      return;
    }

    const updatedTenants = await verifyResponse.json();
    
    // Check for any remaining wrong domains
    const stillWrong = updatedTenants.filter(tenant => 
      tenant.domain && tenant.domain.includes('loanspur.com') && tenant.status === 'active'
    );
    
    if (stillWrong.length > 0) {
      console.log(`   ⚠️  ${stillWrong.length} tenants still have wrong domain:`);
      stillWrong.forEach(tenant => {
        console.log(`      - ${tenant.name}: ${tenant.domain}`);
      });
    } else {
      console.log('   ✅ All tenant domains are now correct!');
    }

    // Show the specific tenant we're testing
    const umojaTenant = updatedTenants.find(t => t.subdomain === 'umoja-magharibi');
    if (umojaTenant) {
      console.log('\n4️⃣ Umoja Magharibi tenant status:');
      console.log(`   Name: ${umojaTenant.name}`);
      console.log(`   Subdomain: ${umojaTenant.subdomain}`);
      console.log(`   Domain: ${umojaTenant.domain}`);
      console.log(`   Status: ${umojaTenant.status}`);
      
      if (umojaTenant.domain === 'umoja-magharibi.loanspurcbs.com') {
        console.log('   ✅ Umoja Magharibi domain is correct!');
      } else {
        console.log('   ❌ Umoja Magharibi domain is still wrong!');
      }
    }

    console.log('\n🎉 Domain fix completed!');
    console.log('\n📋 Next steps:');
    console.log('1. Test the subdomain: https://umoja-magharibi.loanspurcbs.com');
    console.log('2. Verify the tenant loads correctly');
    console.log('3. Check that all tenant features work properly');
    console.log('4. The 404 error should now be resolved');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the fix
fixTenantDomain();
