// Check DigitalOcean App Platform status
import https from 'https';
import http from 'http';

const DIGITALOCEAN_APP_URLS = [
  'https://microfinance-platform-xyz123.ondigitalocean.app', // Replace with your actual app URL
  'https://loanspurcbs.com',
  'https://loanspur.online'
];

async function checkDigitalOceanApp() {
  console.log('🔍 Checking DigitalOcean App Platform Status...\n');
  
  for (const url of DIGITALOCEAN_APP_URLS) {
    try {
      const response = await fetch(url, {
        method: 'HEAD',
        mode: 'no-cors',
      });
      console.log(`✅ ${url} - App is accessible`);
    } catch (error) {
      console.log(`❌ ${url} - ${error.message}`);
    }
  }
  
  console.log('\n📋 DNS Configuration Required:');
  console.log('1. Get your DigitalOcean App Platform URL from the dashboard');
  console.log('2. Update DNS records to point to DigitalOcean instead of Netlify');
  console.log('3. Wait for DNS propagation (can take up to 48 hours)');
}

checkDigitalOceanApp().catch(console.error);
