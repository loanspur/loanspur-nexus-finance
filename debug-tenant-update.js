// Debug Tenant Update
// This script debugs why the tenant domain update is not working

const SUPABASE_URL = 'https://woqesvsopdgoikpatzxp.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvcWVzdnNvcGRnb2lrcGF0enhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1MjQ0NDMsImV4cCI6MjA2NzEwMDQ0M30.rIFhs-PZ24UZBOzE4nx1Ev8Pyp__7rMt5N-7kWNUeDI';

async function debugTenantUpdate() {
  console.log('🔍 Debugging tenant update issue...\n');

  try {
    // 1. Check current tenant state
    console.log('1️⃣ Checking current tenant state...');
    
    const fetchResponse = await fetch(`${SUPABASE_URL}/rest/v1/tenants?subdomain=eq.umoja-magharibi&select=*`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Fetch response status:', fetchResponse.status);
    console.log('Fetch response headers:', Object.fromEntries(fetchResponse.headers.entries()));

    if (!fetchResponse.ok) {
      console.error('❌ Error fetching tenant:', fetchResponse.status);
      const errorText = await fetchResponse.text();
      console.error('Error details:', errorText);
      return;
    }

    const tenants = await fetchResponse.json();
    console.log('Fetched tenants:', tenants);

    if (tenants.length === 0) {
      console.error('❌ Tenant not found');
      return;
    }

    const currentTenant = tenants[0];
    console.log('Current tenant:', currentTenant);

    // 2. Try to update with different approach
    console.log('\n2️⃣ Trying update with different approach...');
    
    const updateData = {
      domain: 'umoja-magharibi.loanspurcbs.com',
      updated_at: new Date().toISOString()
    };

    console.log('Update data:', updateData);

    const updateResponse = await fetch(`${SUPABASE_URL}/rest/v1/tenants?id=eq.${currentTenant.id}`, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(updateData)
    });

    console.log('Update response status:', updateResponse.status);
    console.log('Update response headers:', Object.fromEntries(updateResponse.headers.entries()));

    if (!updateResponse.ok) {
      console.error('❌ Error updating tenant:', updateResponse.status);
      const errorText = await updateResponse.text();
      console.error('Update error details:', errorText);
      return;
    }

    const updateResult = await updateResponse.json();
    console.log('Update result:', updateResult);

    // 3. Check if update was applied
    console.log('\n3️⃣ Checking if update was applied...');
    
    const checkResponse = await fetch(`${SUPABASE_URL}/rest/v1/tenants?subdomain=eq.umoja-magharibi&select=*`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!checkResponse.ok) {
      console.error('❌ Error checking tenant:', checkResponse.status);
      return;
    }

    const checkTenants = await checkResponse.json();
    console.log('Check result:', checkTenants);

    if (checkTenants.length > 0) {
      const checkTenant = checkTenants[0];
      console.log('Final tenant state:', checkTenant);
      
      if (checkTenant.domain === 'umoja-magharibi.loanspurcbs.com') {
        console.log('✅ Domain successfully updated!');
      } else {
        console.log('❌ Domain not updated. Current domain:', checkTenant.domain);
      }
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the debug
debugTenantUpdate();
