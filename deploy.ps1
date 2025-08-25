Write-Host "�� Deploying LoanspurCBS..." -ForegroundColor Green

# Build the application
Write-Host "📦 Building application..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Build successful!" -ForegroundColor Green

# Build Docker image
Write-Host "🐳 Building Docker image..." -ForegroundColor Yellow
docker build -t loanspur-app .

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Docker build successful!" -ForegroundColor Green

# Stop existing container if running
Write-Host "🛑 Stopping existing container..." -ForegroundColor Yellow
docker stop loanspur-app 2>$null
docker rm loanspur-app 2>$null

# Start new container
Write-Host "🚀 Starting new container..." -ForegroundColor Yellow
docker run -d --name loanspur-app -p 8080:8080 -e NODE_ENV=production --restart unless-stopped loanspur-app

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Container start failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Container started successfully!" -ForegroundColor Green

# Wait for container to be ready
Write-Host "⏳ Waiting for container to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Test deployment
Write-Host "�� Testing deployment..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8080/health" -UseBasicParsing -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Health check passed!" -ForegroundColor Green
        Write-Host "🎉 Deployment successful!" -ForegroundColor Green
        Write-Host "🌐 Application available at: http://localhost:8080" -ForegroundColor Cyan
    } else {
        throw "Health check failed"
    }
} catch {
    Write-Host "❌ Health check failed!" -ForegroundColor Red
    Write-Host "�� Container logs:" -ForegroundColor Yellow
    docker logs loanspur-app
    exit 1
}
