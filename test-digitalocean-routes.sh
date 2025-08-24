#!/bin/bash
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
echo "   4. Consider switching to static site configuration"