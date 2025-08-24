// Fix DigitalOcean App Platform Routes for SPA
// This script fixes the routes configuration to handle React Router properly

import fs from 'fs';

console.log('🔧 Fixing DigitalOcean App Platform Routes for SPA\n');

// 1. Update the .do/app.yaml file
function updateAppYaml() {
  console.log('1️⃣ Updating .do/app.yaml with proper SPA routes...');
  
  const appYamlContent = `name: microfinance-platform
services:
- name: web
  source_dir: /
  github:
    repo: your-username/loanspur-nexus-finance
    branch: dev_branch
    deploy_on_push: true
    # Note: Replace 'your-username' with your actual GitHub username
  dockerfile_path: Dockerfile
  instance_count: 1
  instance_size_slug: basic-xxs
  http_port: 8080
  health_check:
    http_path: /
  routes:
  # CRITICAL: Catch-all route for SPA
  - path: /
  # CRITICAL: Handle all subdomain routes
  - path: /{path:.*}
  envs:
  - key: NODE_ENV
    value: production
  - key: VITE_SUPABASE_URL
    value: https://woqesvsopdgoikpatzxp.supabase.co
  - key: VITE_SUPABASE_ANON_KEY
    value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvcWVzdnNvcGRnb2lrcGF0enhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1MjQ0NDMsImV4cCI6MjA2NzEwMDQ0M30.rIFhs-PZ24UZBOzE4nx1Ev8Pyp__7rMt5N-7kWNUeDI
  - key: PORT
    value: "8080"
  - key: DOMAIN_NAME
    value: loanspurcbs.com
  - key: DEV_DOMAIN_NAME
    value: loanspur.online

domains:
- domain: loanspurcbs.com
  type: PRIMARY
  wildcard: true
- domain: loanspur.online
  type: SECONDARY
  wildcard: true

alerts:
- rule: DEPLOYMENT_FAILED
- rule: DOMAIN_FAILED

databases: []`;
  
  fs.writeFileSync('.do/app.yaml', appYamlContent);
  console.log('   ✅ Updated .do/app.yaml with catch-all routes');
}

// 2. Create an alternative static site configuration
function createStaticSiteConfig() {
  console.log('2️⃣ Creating alternative static site configuration...');
  
  const staticSiteYaml = `name: microfinance-platform-static
services:
- name: web
  source_dir: /
  github:
    repo: your-username/loanspur-nexus-finance
    branch: dev_branch
    deploy_on_push: true
  # CRITICAL: Use static site instead of container
  static_site:
    build_command: npm run build
    output_dir: dist
    index_document: index.html
    error_document: index.html
  routes:
  # CRITICAL: Catch-all route for SPA
  - path: /
  - path: /{path:.*}
  envs:
  - key: NODE_ENV
    value: production
  - key: VITE_SUPABASE_URL
    value: https://woqesvsopdgoikpatzxp.supabase.co
  - key: VITE_SUPABASE_ANON_KEY
    value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvcWVzdnNvcGRnb2lrcGF0enhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1MjQ0NDMsImV4cCI6MjA2NzEwMDQ0M30.rIFhs-PZ24UZBOzE4nx1Ev8Pyp__7rMt5N-7kWNUeDI

domains:
- domain: loanspurcbs.com
  type: PRIMARY
  wildcard: true
- domain: loanspur.online
  type: SECONDARY
  wildcard: true

alerts:
- rule: DEPLOYMENT_FAILED
- rule: DOMAIN_FAILED

databases: []`;
  
  fs.writeFileSync('.do/app-static.yaml', staticSiteYaml);
  console.log('   ✅ Created .do/app-static.yaml (static site alternative)');
}

// 3. Update static.json for better SPA support
function updateStaticJson() {
  console.log('3️⃣ Updating static.json for better SPA support...');
  
  const staticJson = {
    "root": "dist",
    "clean_urls": true,
    "routes": {
      "/**": "index.html"
    },
    "https_only": true,
    "error_page": "index.html",
    "headers": {
      "/**": {
        "X-Frame-Options": "DENY",
        "X-XSS-Protection": "1; mode=block",
        "X-Content-Type-Options": "nosniff",
        "Referrer-Policy": "strict-origin-when-cross-origin",
        "Strict-Transport-Security": "max-age=31536000; includeSubDomains"
      },
      "/static/**": {
        "Cache-Control": "public, max-age=31536000, immutable"
      }
    }
  };
  
  fs.writeFileSync('static.json', JSON.stringify(staticJson, null, 2));
  console.log('   ✅ Updated static.json with error_page configuration');
}

// 4. Create a test script for DigitalOcean routes
function createTestScript() {
  console.log('4️⃣ Creating test script for DigitalOcean routes...');
  
  const testScript = `#!/bin/bash
# Test DigitalOcean App Platform Routes

echo "🔍 Testing DigitalOcean App Platform Routes"
echo "=========================================="
echo ""

# Test 1: Main domain
echo "1️⃣ Testing main domain routes..."
echo "   Root:"
curl -I https://loanspurcbs.com 2>/dev/null | head -1
echo "   /tenant:"
curl -I https://loanspurcbs.com/tenant 2>/dev/null | head -1
echo "   /client:"
curl -I https://loanspurcbs.com/client 2>/dev/null | head -1
echo ""

# Test 2: Subdomain
echo "2️⃣ Testing subdomain routes..."
echo "   Root:"
curl -I https://umoja-magharibi.loanspurcbs.com 2>/dev/null | head -1
echo "   /tenant:"
curl -I https://umoja-magharibi.loanspurcbs.com/tenant 2>/dev/null | head -1
echo "   /client:"
curl -I https://umoja-magharibi.loanspurcbs.com/client 2>/dev/null | head -1
echo ""

# Test 3: Check response headers
echo "3️⃣ Checking response headers..."
echo "   Main domain /tenant headers:"
curl -I https://loanspurcbs.com/tenant 2>/dev/null | grep -E "(HTTP|Content-Type|Server)"
echo "   Subdomain /tenant headers:"
curl -I https://umoja-magharibi.loanspurcbs.com/tenant 2>/dev/null | grep -E "(HTTP|Content-Type|Server)"
echo ""

echo "✅ Route testing complete!"
echo ""
echo "📋 Expected Results:"
echo "   - All URLs should return 200 OK"
echo "   - Content-Type should be text/html"
echo "   - No 404 errors on any route"
echo ""
echo "🔧 If you still see 404 errors:"
echo "   1. Check DigitalOcean App Platform logs"
echo "   2. Verify the catch-all route is deployed"
echo "   3. Clear CDN cache if applicable"
echo "   4. Consider switching to static site configuration"`;
  
  fs.writeFileSync('test-digitalocean-routes.sh', testScript);
  console.log('   ✅ Created test-digitalocean-routes.sh');
}

// 5. Create deployment instructions
function createDeploymentInstructions() {
  console.log('5️⃣ Creating deployment instructions...');
  
  const instructions = `# DigitalOcean App Platform SPA Deployment Guide

## 🔧 Current Issue
The 404 errors on page refresh are caused by DigitalOcean App Platform not properly handling SPA routes.

## 🚀 Solution Options

### Option 1: Update Container Routes (Recommended)
1. The .do/app.yaml has been updated with catch-all routes
2. Deploy the updated configuration
3. Test the routes

### Option 2: Switch to Static Site (Alternative)
If the container approach still has issues:
1. Use .do/app-static.yaml instead
2. This uses DigitalOcean's built-in static site hosting
3. Better SPA support out of the box

## 📋 Deployment Steps

### Step 1: Commit and Push Changes
\`\`\`bash
git add .
git commit -m "Fix DigitalOcean App Platform routes for SPA"
git push origin main
\`\`\`

### Step 2: Monitor Deployment
1. Go to DigitalOcean App Platform dashboard
2. Check deployment logs
3. Verify the app is running

### Step 3: Test Routes
Run the test script:
\`\`\`bash
./test-digitalocean-routes.sh
\`\`\`

### Step 4: Browser Testing
1. Test in incognito/private mode
2. Clear browser cache
3. Test direct URL access
4. Test page refresh on all routes

## 🔍 Troubleshooting

### If routes still don't work:
1. **Check DigitalOcean logs**: Look for routing errors
2. **Verify catch-all route**: Ensure /{path:.*} is deployed
3. **Clear CDN cache**: DigitalOcean might cache 404 responses
4. **Switch to static site**: Use app-static.yaml configuration

### If static site works better:
1. Use the static site configuration
2. Remove Dockerfile dependency
3. Let DigitalOcean handle SPA routing

## 📊 Expected Results

✅ **After fix:**
- Direct URL access works
- Page refresh works
- Browser back/forward works
- Bookmarking works
- No 404 errors

❌ **Before fix:**
- 404 errors on page refresh
- Routes only work through navigation
- Inconsistent behavior`;
  
  fs.writeFileSync('digitalocean-deployment-guide.md', instructions);
  console.log('   ✅ Created digitalocean-deployment-guide.md');
}

// Main execution
try {
  updateAppYaml();
  createStaticSiteConfig();
  updateStaticJson();
  createTestScript();
  createDeploymentInstructions();
  
  console.log('\n🎉 DigitalOcean routes fix completed!');
  console.log('\n📋 Summary of changes:');
  console.log('✅ Updated .do/app.yaml with catch-all routes');
  console.log('✅ Created .do/app-static.yaml (static site alternative)');
  console.log('✅ Updated static.json with error_page configuration');
  console.log('✅ Created test-digitalocean-routes.sh');
  console.log('✅ Created digitalocean-deployment-guide.md');
  
  console.log('\n🔧 Root cause identified:');
  console.log('   - DigitalOcean App Platform missing catch-all routes');
  console.log('   - Load balancer not forwarding all routes to your container');
  console.log('   - CDN might be caching 404 responses');
  
  console.log('\n🚀 Solution applied:');
  console.log('   - Added catch-all route: /{path:.*}');
  console.log('   - This ensures all routes are forwarded to your nginx');
  console.log('   - nginx will then serve index.html for all routes');
  
  console.log('\n📋 Next steps:');
  console.log('1. Commit and push these changes');
  console.log('2. Monitor DigitalOcean App Platform deployment');
  console.log('3. Test the routes using test-digitalocean-routes.sh');
  console.log('4. If issues persist, consider switching to static site config');
  
  console.log('\n💡 Why this fixes the issue:');
  console.log('   - DigitalOcean now forwards ALL routes to your container');
  console.log('   - Your nginx try_files directive can handle the routing');
  console.log('   - No more 404 errors on page refresh');
  
} catch (error) {
  console.error('❌ Error fixing DigitalOcean routes:', error);
}
