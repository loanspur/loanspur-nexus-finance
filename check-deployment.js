// Quick deployment status checker
import https from 'https';
import http from 'http';

const urls = [
  // Netlify domain (loanspur.online) - Development
  'https://loanspur.online',
  'https://loanspur.online/auth',
  'https://loanspur.online/health',
  'https://loanspur.online/super-admin',
  'https://loanspur.online/tenant',
  'https://loanspur.online/client',
  
  // Tenant subdomains - Development
  'https://tenant1.loanspur.online',
  'https://tenant1.loanspur.online/auth',
  'https://acme.loanspur.online',
  'https://acme.loanspur.online/auth',
  
  // Production domain (loanspurcbs.com)
  'https://loanspurcbs.com',
  'https://loanspurcbs.com/auth',
  'https://loanspurcbs.com/health',
  
  // Tenant subdomains - Production
  'https://tenant1.loanspurcbs.com',
  'https://tenant1.loanspurcbs.com/auth',
  'https://acme.loanspurcbs.com',
  'https://acme.loanspurcbs.com/auth',
  
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
    
    const netlifyWorking = results.find(r => r.url.includes('loanspur.online') && !r.url.includes('tenant1') && !r.url.includes('acme') && r.working);
    const netlifySubdomainsWorking = results.find(r => (r.url.includes('tenant1.loanspur.online') || r.url.includes('acme.loanspur.online')) && r.working);
    const productionWorking = results.find(r => r.url.includes('loanspurcbs.com') && !r.url.includes('tenant1') && !r.url.includes('acme') && r.working);
    const productionSubdomainsWorking = results.find(r => (r.url.includes('tenant1.loanspurcbs.com') || r.url.includes('acme.loanspurcbs.com')) && r.working);
    
    console.log('\n📊 Deployment Status Summary:');
    
    if (netlifyWorking) {
      console.log('✅ Development (Netlify): Main domain working');
      
      const authWorking = results.find(r => r.url.includes('loanspur.online/auth') && r.working);
      if (authWorking) {
        console.log('✅ Development (Netlify): Auth route working');
      } else {
        console.log('⚠️  Development (Netlify): Auth route has issues');
      }
      
      if (netlifySubdomainsWorking) {
        console.log('✅ Development (Netlify): Tenant subdomains working');
      } else {
        console.log('⚠️  Development (Netlify): Tenant subdomains have issues');
      }
    } else {
      console.log('❌ Development (Netlify): Main domain not working');
    }
    
    if (productionWorking) {
      console.log('✅ Production (DigitalOcean): Main domain working');
      
      const authWorking = results.find(r => r.url.includes('loanspurcbs.com/auth') && r.working);
      if (authWorking) {
        console.log('✅ Production (DigitalOcean): Auth route working');
      } else {
        console.log('⚠️  Production (DigitalOcean): Auth route has issues');
      }
      
      if (productionSubdomainsWorking) {
        console.log('✅ Production (DigitalOcean): Tenant subdomains working');
      } else {
        console.log('⚠️  Production (DigitalOcean): Tenant subdomains have issues');
      }
    } else {
      console.log('❌ Production (DigitalOcean): Main domain not working');
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
