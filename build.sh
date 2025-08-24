#!/bin/bash
# Build script for local testing

echo "🔨 Building Docker image..."

# Build the image
docker build -t loanspur-app .

echo "✅ Build completed!"
echo ""
echo "🚀 To run the container:"
echo "docker run -p 8080:8080 loanspur-app"
echo ""
echo "🌐 Access the app at: http://localhost:8080"