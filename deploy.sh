#!/bin/bash

echo " Deploying LoanspurCBS..."

# Build the application
echo "📦 Building application..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo "✅ Build successful!"

# Build Docker image
echo "🐳 Building Docker image..."
docker build -t loanspur-app .

if [ $? -ne 0 ]; then
    echo "❌ Docker build failed!"
    exit 1
fi

echo "✅ Docker build successful!"

# Stop existing container if running
echo "🛑 Stopping existing container..."
docker stop loanspur-app 2>/dev/null || true
docker rm loanspur-app 2>/dev/null || true

# Start new container
echo "🚀 Starting new container..."
docker run -d \
  --name loanspur-app \
  -p 8080:8080 \
  -e NODE_ENV=production \
  --restart unless-stopped \
  loanspur-app

if [ $? -ne 0 ]; then
    echo "❌ Container start failed!"
    exit 1
fi

echo "✅ Container started successfully!"

# Wait for container to be ready
echo "⏳ Waiting for container to be ready..."
sleep 5

# Test deployment
echo " Testing deployment..."
if curl -f http://localhost:8080/health > /dev/null 2>&1; then
    echo "✅ Health check passed!"
    echo "🎉 Deployment successful!"
    echo "🌐 Application available at: http://localhost:8080"
else
    echo "❌ Health check failed!"
    echo "📋 Container logs:"
    docker logs loanspur-app
    exit 1
fi
