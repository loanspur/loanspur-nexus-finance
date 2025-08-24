// Subdomain Diagnostic Script
// This script helps diagnose subdomain issues

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Diagnosing Subdomain Issues...\n');

// Test subdomain detection logic
function testSubdomainDetection() {
  console.log('1️⃣ Testing subdomain detection logic...');
  
  const testCases = [
    'umoja-magharibi.loanspur.online',
    'loanspur.online',
    'test.loanspur.online',
    'www.loanspur.online',
    'localhost',
    '127.0.0.1'
  ];
  
  console.log('   Testing subdomain extraction:');
  
  testCases.forEach(hostname => {
    const subdomain = getSubdomainFromHostname(hostname);
    console.log(`   ${hostname} -> ${subdomain || 'null'}`);
  });
}

// Simulate the subdomain detection logic from tenant.ts
function getSubdomainFromHostname(hostname) {
  const cleanHostname = hostname.split(':')[0];
  
  // Check if it's a main domain or localhost
  if (cleanHostname === 'loanspurcbs.com' || 
      cleanHostname === 'loanspur.online' ||
      cleanHostname === 'localhost' || 
      cleanHostname.includes('127.0.0.1')) {
    return null;
  }
  
  // Extract subdomain from known base domains
  if (cleanHostname.endsWith('.loanspurcbs.com')) {
    const subdomain = cleanHostname.replace('.loanspurcbs.com', '');
    return subdomain === 'www' ? null : subdomain;
  }
  if (cleanHostname.endsWith('.loanspur.online')) {
    const subdomain = cleanHostname.replace('.loanspur.online', '');
    return subdomain === 'www' ? null : subdomain;
  }
  
  return null;
}

// Check Netlify configuration
function checkNetlifyConfig() {
  console.log('\n2️⃣ Checking Netlify configuration...');
  
  const netlifyPath = path.join(__dirname, 'netlify.toml');
  
  if (fs.existsSync(netlifyPath)) {
    const content = fs.readFileSync(netlifyPath, 'utf8');
    
    const hasSubdomainRedirect = content.includes('*.loanspur.online');
    const hasWildcardRedirect = content.includes('/*');
    
    console.log('   ✅ netlify.toml exists');
    console.log(`   Subdomain redirect: ${hasSubdomainRedirect ? '✅' : '❌'}`);
    console.log(`   Wildcard redirect: ${hasWildcardRedirect ? '✅' : '❌'}`);
    
    if (!hasSubdomainRedirect) {
      console.log('   ⚠️  Missing subdomain redirect configuration');
    }
  } else {
    console.log('   ❌ netlify.toml not found');
  }
}

// Check tenant detection logic
function checkTenantLogic() {
  console.log('\n3️⃣ Checking tenant detection logic...');
  
  const tenantPath = path.join(__dirname, 'src', 'utils', 'tenant.ts');
  
  if (fs.existsSync(tenantPath)) {
    const content = fs.readFileSync(tenantPath, 'utf8');
    
    const hasSubdomainFunction = content.includes('getSubdomainFromHostname');
    const hasTenantQuery = content.includes('getTenantBySubdomain');
    const hasConditionalLogging = content.includes('VITE_IS_DEVELOPMENT');
    
    console.log('   ✅ tenant.ts exists');
    console.log(`   Subdomain function: ${hasSubdomainFunction ? '✅' : '❌'}`);
    console.log(`   Tenant query function: ${hasTenantQuery ? '✅' : '❌'}`);
    console.log(`   Conditional logging: ${hasConditionalLogging ? '✅' : '❌'}`);
  } else {
    console.log('   ❌ tenant.ts not found');
  }
}

// Check environment variables
function checkEnvironmentVariables() {
  console.log('\n4️⃣ Checking environment variables...');
  
  const envPath = path.join(__dirname, '.env.local');
  
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    
    const hasDevelopmentFlag = content.includes('VITE_IS_DEVELOPMENT=true');
    const hasSupabaseUrl = content.includes('VITE_SUPABASE_URL');
    const hasSupabaseKey = content.includes('VITE_SUPABASE_ANON_KEY');
    
    console.log('   ✅ .env.local exists');
    console.log(`   Development flag: ${hasDevelopmentFlag ? '✅' : '❌'}`);
    console.log(`   Supabase URL: ${hasSupabaseUrl ? '✅' : '❌'}`);
    console.log(`   Supabase Key: ${hasSupabaseKey ? '✅' : '❌'}`);
  } else {
    console.log('   ❌ .env.local not found');
  }
}

// Generate troubleshooting steps
function generateTroubleshootingSteps() {
  console.log('\n5️⃣ Troubleshooting Steps:');
  
  console.log('\n   🔧 Immediate Actions:');
  console.log('   1. Check Netlify dashboard for build status');
  console.log('   2. Verify DNS settings for *.loanspur.online');
  console.log('   3. Check browser console for errors');
  console.log('   4. Test with different subdomain');
  
  console.log('\n   🔍 Debugging Steps:');
  console.log('   1. Open browser developer tools');
  console.log('   2. Check Network tab for failed requests');
  console.log('   3. Check Console tab for JavaScript errors');
  console.log('   4. Check Application tab for storage issues');
  
  console.log('\n   🌐 DNS Verification:');
  console.log('   1. Verify *.loanspur.online points to Netlify');
  console.log('   2. Check if subdomain resolves correctly');
  console.log('   3. Ensure no conflicting DNS records');
  
  console.log('\n   ⚙️  Configuration Checks:');
  console.log('   1. Verify Netlify environment variables');
  console.log('   2. Check Netlify build logs');
  console.log('   3. Ensure tenant exists in database');
  console.log('   4. Verify RLS policies allow access');
}

// Run all diagnostics
function runDiagnostics() {
  testSubdomainDetection();
  checkNetlifyConfig();
  checkTenantLogic();
  checkEnvironmentVariables();
  generateTroubleshootingSteps();
  
  console.log('\n📊 Diagnosis Summary:');
  console.log('   The subdomain issue could be caused by:');
  console.log('   1. DNS configuration problems');
  console.log('   2. Netlify redirect configuration');
  console.log('   3. Tenant not existing in database');
  console.log('   4. RLS policies blocking access');
  console.log('   5. Environment variable issues');
  
  console.log('\n🎯 Next Steps:');
  console.log('   1. Check Netlify dashboard for deployment status');
  console.log('   2. Verify the tenant "umoja-magharibi" exists in your database');
  console.log('   3. Test with a different subdomain');
  console.log('   4. Check browser console for specific errors');
}

// Run the diagnostics
runDiagnostics();
