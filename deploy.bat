@echo off
echo �� Deploying LoanspurCBS...

echo 📦 Building application...
call npm run build
if errorlevel 1 (
    echo ❌ Build failed!
    exit /b 1
)

echo ✅ Build successful!

echo 🐳 Building Docker image...
docker build -t loanspur-app .
if errorlevel 1 (
    echo ❌ Docker build failed!
    exit /b 1
)

echo ✅ Docker build successful!

echo 🛑 Stopping existing container...
docker stop loanspur-app 2>nul
docker rm loanspur-app 2>nul

echo 🚀 Starting new container...
docker run -d --name loanspur-app -p 8080:8080 -e NODE_ENV=production --restart unless-stopped loanspur-app
if errorlevel 1 (
    echo ❌ Container start failed!
    exit /b 1
)

echo ✅ Container started successfully!

echo ⏳ Waiting for container to be ready...
timeout /t 5 /nobreak >nul

echo �� Testing deployment...
curl -f http://localhost:8080/health >nul 2>&1
if errorlevel 1 (
    echo ❌ Health check failed!
    echo 📋 Container logs:
    docker logs loanspur-app
    exit /b 1
)

echo ✅ Health check passed!
echo 🎉 Deployment successful!
echo 🌐 Application available at: http://localhost:8080
