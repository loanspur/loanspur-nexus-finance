// Quick deployment status checker
import https from 'https';
import http from 'http';

const urls = [
  // Production domain
  'https://loanspurcbs.com',
  'https://loanspurcbs.com/auth',
  'https://loanspurcbs.com/health',
  // Development domain
  'https://loanspur.online',
  'https://loanspur.online/auth',
  'https://loanspur.online/health',
  // Database
  'https://woqesvsopdgoikpatzxp.supabase.co/rest/v1/'
];

async function checkUrl(url) {
  return new Promise((resolve) => {
    const protocol = url.startsWith('https:') ? https : http;
    
    const req = protocol.get(url, (res) => {
      resolve({
        url,
        status: res.statusCode,
        statusText: res.statusMessage,
        headers: res.headers,
        working: res.statusCode >= 200 && res.statusCode < 400
      });
    });
    
    req.on('error', (error) => {
      resolve({
        url,
        error: error.message,
        working: false
      });
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      resolve({
        url,
        error: 'Timeout',
        working: false
      });
    });
  });
}

async function checkDeployment() {
  console.log('🔍 Checking deployment status...\n');
  
  const results = await Promise.all(urls.map(checkUrl));
  
  results.forEach(result => {
    if (result.working) {
      console.log(`✅ ${result.url} - ${result.status} ${result.statusText}`);
    } else {
      console.log(`❌ ${result.url} - ${result.error || `${result.status} ${result.statusText}`}`);
    }
  });
  
  console.log('\n📋 Summary:');
  const working = results.filter(r => r.working).length;
  const total = results.length;
  
  if (working === total) {
    console.log('🎉 All endpoints are working!');
  } else {
    console.log(`⚠️  ${working}/${total} endpoints are working`);
    
    const prodWorking = results.find(r => r.url.includes('loanspurcbs.com') && r.working);
    const devWorking = results.find(r => r.url.includes('loanspur.online') && r.working);
    
    if (!prodWorking && !devWorking) {
      console.log('\n🔧 Deployment Issues Detected:');
      console.log('1. Both production and development domains are not responding');
      console.log('2. Check if the app is deployed to DigitalOcean');
      console.log('3. Verify the GitHub Actions workflow completed successfully');
      console.log('4. Check the DigitalOcean App Platform dashboard');
    } else if (!prodWorking) {
      console.log('\n⚠️  Production Domain Issues:');
      console.log('1. Production domain (loanspurcbs.com) is not responding');
      console.log('2. Development domain is working correctly');
    } else if (!devWorking) {
      console.log('\n⚠️  Development Domain Issues:');
      console.log('1. Development domain (loanspur.online) is not responding');
      console.log('2. Production domain is working correctly');
    }
    
    if (!results.find(r => r.url.includes('supabase.co') && r.working)) {
      console.log('\n🔧 Database Issues Detected:');
      console.log('1. Supabase connection is failing');
      console.log('2. Check if the Supabase project is active');
      console.log('3. Verify the API keys are correct');
    }
  }
}

checkDeployment().catch(console.error);
