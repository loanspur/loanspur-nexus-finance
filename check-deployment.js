// Quick deployment status checker
import https from 'https';
import http from 'http';

const urls = [
  // Netlify domain (loanspur.online)
  'https://loanspur.online',
  'https://loanspur.online/auth',
  'https://loanspur.online/health',
  'https://loanspur.online/super-admin',
  'https://loanspur.online/tenant',
  'https://loanspur.online/client',
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
    
    const netlifyWorking = results.find(r => r.url.includes('loanspur.online') && r.working);
    
    if (!netlifyWorking) {
      console.log('\n🔧 Netlify Deployment Issues Detected:');
      console.log('1. Netlify domain (loanspur.online) is not responding correctly');
      console.log('2. Check if the app is deployed to Netlify');
      console.log('3. Verify the _redirects file is configured correctly');
      console.log('4. Check Netlify build logs for errors');
    } else {
      console.log('\n✅ Netlify Deployment Status:');
      console.log('1. Main domain is working');
      
      const authWorking = results.find(r => r.url.includes('/auth') && r.working);
      if (!authWorking) {
        console.log('2. ⚠️  Auth route (/auth) still has issues - check _redirects file');
      } else {
        console.log('2. ✅ Auth route (/auth) is working correctly');
      }
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
