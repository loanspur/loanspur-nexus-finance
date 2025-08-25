@echo off
echo ========================================
echo Testing LoanspurCBS v2.0 Deployment
echo ========================================

echo.
echo 1. Building the application...
call npm run build

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Build failed!
    pause
    exit /b 1
)

echo ✅ Build successful!

echo.
echo 2. Checking dist folder...
if not exist "dist\index.html" (
    echo ❌ dist/index.html not found!
    pause
    exit /b 1
)

echo ✅ dist/index.html found!

echo.
echo 3. Starting local server...
echo Starting server on http://localhost:4173
echo.
echo Test URLs:
echo - Main domain: http://localhost:4173
echo - Subdomain: http://tenant1.localhost:4173 (if you have localhost subdomain setup)
echo.
echo Press Ctrl+C to stop the server
echo.

call npm run preview

pause
