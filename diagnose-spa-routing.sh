#!/bin/bash
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
echo "   4. Test in incognito/private mode"