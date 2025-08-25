#!/bin/bash

echo "🚀 Starting deployment test..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Build the Docker image
echo "📦 Building Docker image..."
docker build -t loanspur-app .

if [ $? -ne 0 ]; then
    echo "❌ Docker build failed!"
    exit 1
fi

echo "✅ Docker build successful!"

# Run the container
echo "�� Starting container..."
docker run -d --name loanspur-test -p 8080:8080 loanspur-app

if [ $? -ne 0 ]; then
    echo "❌ Container start failed!"
    exit 1
fi

echo "✅ Container started successfully!"

# Wait for container to be ready
echo "⏳ Waiting for container to be ready..."
sleep 10

# Test the application
echo "🧪 Testing application..."

# Test health endpoint
if curl -f http://localhost:8080/health > /dev/null 2>&1; then
    echo "✅ Health check passed!"
else
    echo "❌ Health check failed!"
fi

# Test main page
if curl -f http://localhost:8080/ > /dev/null 2>&1; then
    echo "✅ Main page accessible!"
else
    echo "❌ Main page not accessible!"
fi

# Test SPA routing (should return index.html)
if curl -s http://localhost:8080/tenant/dashboard | grep -q "index.html\|root"; then
    echo "✅ SPA routing working!"
else
    echo "❌ SPA routing failed!"
fi

echo "🎉 Deployment test completed!"

# Clean up
echo "🧹 Cleaning up..."
docker stop loanspur-test
docker rm loanspur-test

echo "✅ Test container cleaned up!"
