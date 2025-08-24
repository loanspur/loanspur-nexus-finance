// Check Tenant Script
// This script checks if a tenant exists in the database

const SUPABASE_URL = "https://woqesvsopdgoikpatzxp.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvcWVzdnNvcGRnb2lrcGF0enhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1MjQ0NDMsImV4cCI6MjA2NzEwMDQ0M30.rIFhs-PZ24UZBOzE4nx1Ev8Pyp__7rMt5N-7kWNUeDI";

console.log('🔍 Checking tenant in database...\n');

async function checkTenant() {
  try {
    console.log('1️⃣ Checking tenant: umoja-magharibi');
    
    // Query the tenants table
    const response = await fetch(`${SUPABASE_URL}/rest/v1/tenants?subdomain=eq.umoja-magharibi&status=eq.active&select=*`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'count=exact'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const count = response.headers.get('content-range')?.split('/')[1] || data.length;

    console.log('2️⃣ Database response:');
    console.log(`   Status: ${response.status}`);
    console.log(`   Count: ${count}`);
    console.log(`   Data:`, data);

    if (data.length === 0) {
      console.log('\n❌ Tenant "umoja-magharibi" not found or not active');
      console.log('\n🔧 Solutions:');
      console.log('   1. Create the tenant in your database');
      console.log('   2. Check if the tenant status is "active"');
      console.log('   3. Verify the subdomain spelling');
    } else {
      console.log('\n✅ Tenant found!');
      console.log('   Tenant details:', data[0]);
    }

    // Also check all tenants for reference
    console.log('\n3️⃣ Checking all active tenants:');
    const allTenantsResponse = await fetch(`${SUPABASE_URL}/rest/v1/tenants?status=eq.active&select=id,name,subdomain,status`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (allTenantsResponse.ok) {
      const allTenants = await allTenantsResponse.json();
      console.log(`   Total active tenants: ${allTenants.length}`);
      allTenants.forEach(tenant => {
        console.log(`   - ${tenant.subdomain} (${tenant.name})`);
      });
    }

  } catch (error) {
    console.error('❌ Error checking tenant:', error);
    console.log('\n🔧 Possible issues:');
    console.log('   1. RLS policies blocking access');
    console.log('   2. Database connection issues');
    console.log('   3. Invalid API key');
  }
}

// Run the check
checkTenant();
