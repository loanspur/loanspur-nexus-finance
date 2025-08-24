// Test Main Domain Script
// This script tests the main domain to verify the application is working

console.log('🧪 Testing main domain...\n');

async function testMainDomain() {
  try {
    console.log('1️⃣ Testing main domain: https://loanspur.online');
    
    const response = await fetch('https://loanspur.online', {
      method: 'GET',
      redirect: 'manual'
    });
    
    console.log(`   Status: ${response.status} ${response.statusText}`);
    console.log(`   Headers:`, Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      console.log('   ✅ Main domain is accessible');
      
      // Try to get the HTML content
      const htmlResponse = await fetch('https://loanspur.online');
      const html = await htmlResponse.text();
      
      console.log(`   Content length: ${html.length} characters`);
      
      // Check for key indicators
      const hasReact = html.includes('react') || html.includes('React');
      const hasSupabase = html.includes('supabase');
      const hasLoanspur = html.includes('loanspur');
      
      console.log(`   Contains React: ${hasReact ? '✅' : '❌'}`);
      console.log(`   Contains Supabase: ${hasSupabase ? '✅' : '❌'}`);
      console.log(`   Contains Loanspur: ${hasLoanspur ? '✅' : '❌'}`);
      
      if (html.length > 1000) {
        console.log('   ✅ Application appears to be deployed correctly');
      } else {
        console.log('   ⚠️  Content seems too short - might be an error page');
      }
    } else {
      console.log('   ❌ Main domain is not accessible');
    }

    console.log('\n2️⃣ Testing Netlify-specific URLs...');
    
    // Test Netlify's default URLs
    const netlifyUrls = [
      'https://loanspur.online.netlify.app',
      'https://loanspur-nexus-finance.netlify.app'
    ];
    
    for (const url of netlifyUrls) {
      try {
        const netlifyResponse = await fetch(url, {
          method: 'HEAD',
          redirect: 'manual'
        });
        console.log(`   ${url}: ${netlifyResponse.status} ${netlifyResponse.statusText}`);
      } catch (error) {
        console.log(`   ${url}: ❌ Error - ${error.message}`);
      }
    }

    console.log('\n3️⃣ DNS Analysis:');
    console.log('   The issue is that subdomains are not resolving to Netlify');
    console.log('   This means the DNS wildcard (*.loanspur.online) is not configured');
    console.log('   or not pointing to the correct Netlify site');

    console.log('\n4️⃣ Solutions:');
    console.log('   🔧 Solution 1: Configure DNS wildcard in your domain provider');
    console.log('   🔧 Solution 2: Add subdomain in Netlify dashboard');
    console.log('   🔧 Solution 3: Use Netlify\'s default subdomain for testing');
    console.log('   🔧 Solution 4: Test with local development server');

    console.log('\n5️⃣ Quick Test Options:');
    console.log('   Option A: Test with main domain + path (e.g., /tenant/abc-microfinance)');
    console.log('   Option B: Use local development server');
    console.log('   Option C: Configure DNS properly');
    console.log('   Option D: Use Netlify\'s preview URLs');

  } catch (error) {
    console.error('❌ Error testing main domain:', error);
  }
}

// Run the test
testMainDomain();
