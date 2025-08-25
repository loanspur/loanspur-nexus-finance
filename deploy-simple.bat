@echo off
echo �� Deploying LoanspurCBS (Simple Mode)...

echo 📦 Building application...
call npm run build
if errorlevel 1 (
    echo ❌ Build failed!
    exit /b 1
)

echo ✅ Build successful!

echo 🚀 Starting development server...
echo 🌐 Application will be available at: http://localhost:8080
echo 📋 Press Ctrl+C to stop the server

call npm run preview
