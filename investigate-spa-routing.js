// Investigate SPA Routing Issues Step by Step
// This script helps diagnose why page refresh causes 404 errors on subdomain routes

import fs from 'fs';

console.log('🔍 Investigating SPA Routing Issues Step by Step\n');

// 1. Check current nginx configuration
function checkNginxConfig() {
  console.log('1️⃣ Checking nginx configuration...');
  
  try {
    const nginxConfig = fs.readFileSync('nginx-digitalocean.conf', 'utf8');
    
    // Check for try_files directive
    const hasTryFiles = nginxConfig.includes('try_files');
    const tryFilesLine = nginxConfig.match(/try_files[^;]+;/);
    
    console.log('   ✅ Nginx config found');
    console.log(`   Has try_files directive: ${hasTryFiles ? 'YES' : 'NO'}`);
    
    if (tryFilesLine) {
      console.log(`   try_files directive: ${tryFilesLine[0]}`);
    }
    
    // Check for specific route handling
    const hasSpecificRoutes = nginxConfig.includes('location ~ ^/(tenant|client|super-admin|auth)/');
    console.log(`   Has specific route handling: ${hasSpecificRoutes ? 'YES' : 'NO'}`);
    
    // Check for subdomain detection
    const hasSubdomainDetection = nginxConfig.includes('set $subdomain');
    console.log(`   Has subdomain detection: ${hasSubdomainDetection ? 'YES' : 'NO'}`);
    
    return {
      hasTryFiles,
      hasSpecificRoutes,
      hasSubdomainDetection,
      config: nginxConfig
    };
  } catch (error) {
    console.log('   ❌ Could not read nginx config:', error.message);
    return null;
  }
}

// 2. Check React Router configuration
function checkReactRouterConfig() {
  console.log('\n2️⃣ Checking React Router configuration...');
  
  try {
    // Check for BrowserRouter vs HashRouter
    const mainTsx = fs.readFileSync('src/main.tsx', 'utf8');
    const appTsx = fs.readFileSync('src/App.tsx', 'utf8');
    
    const usesBrowserRouter = mainTsx.includes('BrowserRouter') || appTsx.includes('BrowserRouter');
    const usesHashRouter = mainTsx.includes('HashRouter') || appTsx.includes('HashRouter');
    
    console.log(`   Uses BrowserRouter: ${usesBrowserRouter ? 'YES' : 'NO'}`);
    console.log(`   Uses HashRouter: ${usesHashRouter ? 'YES' : 'NO'}`);
    
    // Check for basename configuration
    const hasBasename = mainTsx.includes('basename') || appTsx.includes('basename');
    console.log(`   Has basename configuration: ${hasBasename ? 'YES' : 'NO'}`);
    
    // Check for route definitions
    const hasRoutes = appTsx.includes('<Routes>') || appTsx.includes('<Route');
    console.log(`   Has route definitions: ${hasRoutes ? 'YES' : 'NO'}`);
    
    return {
      usesBrowserRouter,
      usesHashRouter,
      hasBasename,
      hasRoutes
    };
  } catch (error) {
    console.log('   ❌ Could not read React Router config:', error.message);
    return null;
  }
}

// 3. Check DigitalOcean App Platform configuration
function checkDigitalOceanConfig() {
  console.log('\n3️⃣ Checking DigitalOcean App Platform configuration...');
  
  try {
    const appYaml = fs.readFileSync('.do/app.yaml', 'utf8');
    
    // Check for static site configuration
    const hasStaticConfig = appYaml.includes('static_site') || appYaml.includes('static');
    console.log(`   Has static site config: ${hasStaticConfig ? 'YES' : 'NO'}`);
    
    // Check for routes configuration
    const hasRoutes = appYaml.includes('routes:');
    console.log(`   Has routes config: ${hasRoutes ? 'YES' : 'NO'}`);
    
    // Check for environment variables
    const hasEnvVars = appYaml.includes('envs:');
    console.log(`   Has environment variables: ${hasEnvVars ? 'YES' : 'NO'}`);
    
    return {
      hasStaticConfig,
      hasRoutes,
      hasEnvVars,
      config: appYaml
    };
  } catch (error) {
    console.log('   ❌ Could not read DigitalOcean config:', error.message);
    return null;
  }
}

// 4. Check for static.json (DigitalOcean App Platform)
function checkStaticJson() {
  console.log('\n4️⃣ Checking static.json configuration...');
  
  try {
    const staticJson = JSON.parse(fs.readFileSync('static.json', 'utf8'));
    
    console.log('   ✅ static.json found');
    console.log(`   Root directory: ${staticJson.root || 'not specified'}`);
    console.log(`   Clean URLs: ${staticJson.clean_urls || false}`);
    console.log(`   HTTPS only: ${staticJson.https_only || false}`);
    
    // Check routes configuration
    if (staticJson.routes) {
      console.log('   Routes configuration:');
      Object.entries(staticJson.routes).forEach(([pattern, target]) => {
        console.log(`     ${pattern} -> ${target}`);
      });
    }
    
    return staticJson;
  } catch (error) {
    console.log('   ❌ Could not read static.json:', error.message);
    return null;
  }
}

// 5. Check for .htaccess file
function checkHtaccess() {
  console.log('\n5️⃣ Checking .htaccess configuration...');
  
  try {
    const htaccess = fs.readFileSync('public/.htaccess', 'utf8');
    
    const hasRewriteRules = htaccess.includes('RewriteRule');
    const hasRewriteEngine = htaccess.includes('RewriteEngine On');
    
    console.log(`   Has RewriteEngine: ${hasRewriteEngine ? 'YES' : 'NO'}`);
    console.log(`   Has RewriteRules: ${hasRewriteRules ? 'YES' : 'NO'}`);
    
    if (hasRewriteRules) {
      const rewriteRule = htaccess.match(/RewriteRule[^#\n]+/);
      if (rewriteRule) {
        console.log(`   RewriteRule: ${rewriteRule[0]}`);
      }
    }
    
    return {
      hasRewriteEngine,
      hasRewriteRules,
      content: htaccess
    };
  } catch (error) {
    console.log('   ❌ Could not read .htaccess:', error.message);
    return null;
  }
}

// 6. Generate test scenarios
function generateTestScenarios() {
  console.log('\n6️⃣ Generating test scenarios...');
  
  const testUrls = [
    'https://loanspurcbs.com',
    'https://loanspurcbs.com/',
    'https://loanspurcbs.com/tenant',
    'https://loanspurcbs.com/client',
    'https://loanspurcbs.com/auth',
    'https://umoja-magharibi.loanspurcbs.com',
    'https://umoja-magharibi.loanspurcbs.com/',
    'https://umoja-magharibi.loanspurcbs.com/tenant',
    'https://umoja-magharibi.loanspurcbs.com/client',
    'https://umoja-magharibi.loanspurcbs.com/auth'
  ];
  
  console.log('   Test URLs to check:');
  testUrls.forEach((url, index) => {
    console.log(`     ${index + 1}. ${url}`);
  });
  
  return testUrls;
}

// 7. Create diagnostic script
function createDiagnosticScript() {
  console.log('\n7️⃣ Creating diagnostic script...');
  
  const diagnosticScript = `#!/bin/bash
# SPA Routing Diagnostic Script

echo "🔍 SPA Routing Diagnostic Tool"
echo "================================"
echo ""

# Test 1: Check if main domain works
echo "1️⃣ Testing main domain..."
curl -I https://loanspurcbs.com 2>/dev/null | head -1
echo ""

# Test 2: Check if subdomain works
echo "2️⃣ Testing subdomain..."
curl -I https://umoja-magharibi.loanspurcbs.com 2>/dev/null | head -1
echo ""

# Test 3: Check specific routes
echo "3️⃣ Testing specific routes..."
echo "   /tenant route:"
curl -I https://umoja-magharibi.loanspurcbs.com/tenant 2>/dev/null | head -1
echo "   /client route:"
curl -I https://umoja-magharibi.loanspurcbs.com/client 2>/dev/null | head -1
echo "   /auth route:"
curl -I https://umoja-magharibi.loanspurcbs.com/auth 2>/dev/null | head -1
echo ""

# Test 4: Check if index.html is served for routes
echo "4️⃣ Testing if index.html is served for routes..."
echo "   /tenant route content type:"
curl -I https://umoja-magharibi.loanspurcbs.com/tenant 2>/dev/null | grep -i "content-type"
echo ""

# Test 5: Check headers
echo "5️⃣ Checking response headers..."
echo "   Main domain headers:"
curl -I https://loanspurcbs.com 2>/dev/null | grep -E "(HTTP|Server|X-|Content-Type)"
echo "   Subdomain headers:"
curl -I https://umoja-magharibi.loanspurcbs.com 2>/dev/null | grep -E "(HTTP|Server|X-|Content-Type)"
echo ""

echo "✅ Diagnostic complete!"
echo ""
echo "📋 Expected Results:"
echo "   - All URLs should return 200 OK"
echo "   - Routes should return Content-Type: text/html"
echo "   - X-Tenant-Subdomain header should be present on subdomains"
echo ""
echo "🔧 If you see 404 errors:"
echo "   1. Check nginx configuration"
echo "   2. Verify DigitalOcean App Platform settings"
echo "   3. Check browser developer tools Network tab"
echo "   4. Test in incognito/private mode"`;
  
  fs.writeFileSync('diagnose-spa-routing.sh', diagnosticScript);
  console.log('   ✅ Created diagnose-spa-routing.sh');
}

// 8. Create browser test instructions
function createBrowserTestInstructions() {
  console.log('\n8️⃣ Creating browser test instructions...');
  
  const browserTest = `# Browser Testing Instructions

## 🔍 Step-by-Step Browser Testing

### Test 1: Main Domain Navigation
1. Open https://loanspurcbs.com
2. Navigate to different routes using the app's navigation
3. Test browser back/forward buttons
4. Test page refresh on each route

### Test 2: Subdomain Navigation
1. Open https://umoja-magharibi.loanspurcbs.com
2. Navigate to different routes using the app's navigation
3. Test browser back/forward buttons
4. Test page refresh on each route

### Test 3: Direct URL Access
1. Open a new incognito/private window
2. Try accessing these URLs directly:
   - https://umoja-magharibi.loanspurcbs.com/tenant
   - https://umoja-magharibi.loanspurcbs.com/client
   - https://umoja-magharibi.loanspurcbs.com/auth

### Test 4: Developer Tools Analysis
1. Open browser Developer Tools (F12)
2. Go to Network tab
3. Navigate to a route and refresh the page
4. Check:
   - HTTP status codes
   - Response headers
   - Request/Response timing
   - Any failed requests

### Test 5: Different Browsers
Test the same scenarios in:
- Chrome
- Firefox
- Safari
- Edge

## 🐛 Common Issues and Solutions

### Issue 1: 404 on refresh but works on navigation
**Cause**: Server not configured to serve index.html for all routes
**Solution**: Check nginx try_files directive

### Issue 2: Works in one browser but not another
**Cause**: Browser-specific caching or behavior
**Solution**: Clear browser cache, test in incognito mode

### Issue 3: Works on main domain but not subdomain
**Cause**: Subdomain routing configuration issue
**Solution**: Check nginx subdomain detection

### Issue 4: Intermittent issues
**Cause**: CDN caching or load balancer configuration
**Solution**: Check DigitalOcean App Platform settings

## 📊 Expected Behavior

✅ **Should Work:**
- Direct URL access to any route
- Page refresh on any route
- Browser back/forward navigation
- Bookmarking any URL

❌ **Should NOT Happen:**
- 404 errors on page refresh
- Different behavior between browsers
- Routes working only through navigation`;
  
  fs.writeFileSync('browser-testing-guide.md', browserTest);
  console.log('   ✅ Created browser-testing-guide.md');
}

// Main execution
try {
  const nginxConfig = checkNginxConfig();
  const routerConfig = checkReactRouterConfig();
  const doConfig = checkDigitalOceanConfig();
  const staticConfig = checkStaticJson();
  const htaccessConfig = checkHtaccess();
  const testUrls = generateTestScenarios();
  createDiagnosticScript();
  createBrowserTestInstructions();
  
  console.log('\n🎉 Investigation completed!');
  console.log('\n📋 Summary of findings:');
  
  if (nginxConfig) {
    console.log('✅ Nginx configuration looks good');
    if (!nginxConfig.hasTryFiles) {
      console.log('⚠️  Missing try_files directive in nginx');
    }
  }
  
  if (routerConfig) {
    if (routerConfig.usesBrowserRouter) {
      console.log('✅ Using BrowserRouter (correct for SPA)');
    } else if (routerConfig.usesHashRouter) {
      console.log('⚠️  Using HashRouter (may cause issues)');
    }
  }
  
  if (staticConfig) {
    console.log('✅ static.json configuration present');
  }
  
  console.log('\n🔍 Potential Root Causes:');
  console.log('1. **Server Configuration**: nginx not serving index.html for all routes');
  console.log('2. **DigitalOcean App Platform**: Static site vs container configuration');
  console.log('3. **Browser Caching**: Old cached responses');
  console.log('4. **CDN/Load Balancer**: Caching 404 responses');
  console.log('5. **Route Configuration**: React Router basename or route setup');
  
  console.log('\n🚀 Next Steps:');
  console.log('1. Run the diagnostic script: ./diagnose-spa-routing.sh');
  console.log('2. Follow the browser testing guide: browser-testing-guide.md');
  console.log('3. Check browser developer tools Network tab');
  console.log('4. Test in incognito/private mode');
  console.log('5. Compare behavior across different browsers');
  
  console.log('\n💡 Most Likely Cause:');
  console.log('   The issue is probably NOT a browser problem, but rather:');
  console.log('   - DigitalOcean App Platform static site configuration');
  console.log('   - nginx configuration not being applied correctly');
  console.log('   - CDN caching of 404 responses');
  
} catch (error) {
  console.error('❌ Error during investigation:', error);
}
