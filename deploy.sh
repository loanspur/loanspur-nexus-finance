#!/bin/bash

# Deployment script for LoanSpur CBS
# This script helps deploy the application to DigitalOcean App Platform

set -e

echo "🚀 Starting deployment process..."

# Check if doctl is installed
if ! command -v doctl &> /dev/null; then
    echo "❌ doctl is not installed. Please install it first:"
    echo "   macOS: brew install doctl"
    echo "   Linux: snap install doctl"
    echo "   Windows: Download from https://github.com/digitalocean/doctl/releases"
    exit 1
fi

# Check if authenticated
if ! doctl auth list &> /dev/null; then
    echo "❌ Not authenticated with DigitalOcean. Please run:"
    echo "   doctl auth init"
    exit 1
fi

echo "✅ DigitalOcean CLI is ready"

# Check if app exists
APP_ID=$(doctl apps list --format ID,Spec.Name --no-header | grep "microfinance-platform" | awk '{print $1}')

if [ -z "$APP_ID" ]; then
    echo "📝 Creating new app..."
    doctl apps create --spec .do/app.yaml
    echo "✅ App created successfully"
    
    # Get the new app ID
    APP_ID=$(doctl apps list --format ID,Spec.Name --no-header | grep "microfinance-platform" | awk '{print $1}')
    echo "📋 App ID: $APP_ID"
else
    echo "📝 Updating existing app (ID: $APP_ID)..."
    doctl apps update $APP_ID --spec .do/app.yaml
    echo "✅ App updated successfully"
fi

# Wait for deployment
echo "⏳ Waiting for deployment to complete..."
doctl apps list-deployments $APP_ID --format ID,Status,Created --no-header

echo "🔍 Checking deployment status..."
sleep 10

# Get app details
APP_URL=$(doctl apps get $APP_ID --format Spec.Services[0].Routes[0].URL --no-header)
echo "🌐 App URL: $APP_URL"

# Test the deployment
echo "🧪 Testing deployment..."
if curl -f -s "$APP_URL/health" > /dev/null; then
    echo "✅ Health check passed"
else
    echo "⚠️  Health check failed, but deployment might still be in progress"
fi

echo ""
echo "🎉 Deployment completed!"
echo "📱 Your app is available at: $APP_URL"
echo "🔐 Auth page: $APP_URL/auth"
echo ""
echo "📊 Monitor your deployment:"
echo "   doctl apps logs $APP_ID --follow"
echo ""
echo "🔧 If you encounter issues:"
echo "   1. Check the logs: doctl apps logs $APP_ID"
echo "   2. Verify DNS settings for loanspur.online"
echo "   3. Check SSL certificate status"
echo "   4. Ensure all environment variables are set correctly"
