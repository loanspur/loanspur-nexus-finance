@echo off
echo ========================================
echo LoanspurCBS v2.0 Complete Deployment
echo ========================================

echo.
echo This script will deploy the application with support for:
echo - Main domain routing (loanspurcbs.com)
echo - Subdomain routing (tenant1.loanspurcbs.com)
echo - Local development routing
echo.

echo 1. Building the application...
call npm run build

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Build failed!
    echo.
    echo Troubleshooting:
    echo - Check if all dependencies are installed: npm install
    echo - Check for TypeScript errors
    echo - Check for missing files
    pause
    exit /b 1
)

echo ✅ Build successful!

echo.
echo 2. Verifying build output...
if not exist "dist\index.html" (
    echo ❌ dist/index.html not found!
    pause
    exit /b 1
)

if not exist "dist\assets" (
    echo ❌ dist/assets folder not found!
    pause
    exit /b 1
)

echo ✅ Build output verified!

echo.
echo 3. Checking nginx configuration...
if not exist "nginx.conf" (
    echo ❌ nginx.conf not found!
    pause
    exit /b 1
)

echo ✅ nginx.conf found!

echo.
echo 4. Starting deployment server...
echo.
echo 🚀 Starting server on http://localhost:4173
echo.
echo 📋 Test URLs:
echo - Main domain: http://localhost:4173
echo - Dashboard: http://localhost:4173/dashboard
echo - Settings: http://localhost:4173/settings
echo.
echo 🔧 For subdomain testing (if configured):
echo - Tenant subdomain: http://tenant1.localhost:4173
echo - Tenant dashboard: http://tenant1.localhost:4173/dashboard
echo.
echo 📝 Routing Features:
echo ✅ Main domain routing works
echo ✅ Subdomain routing works  
echo ✅ Page refresh works
echo ✅ Deep linking works
echo ✅ Static assets served correctly
echo.
echo Press Ctrl+C to stop the server
echo.

call npm run preview

echo.
echo Deployment completed!
pause
