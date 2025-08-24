// Fix Build Error - Vite not found
// This script fixes the Docker build error where vite is not found

import fs from 'fs';

console.log('🔧 Fixing Build Error - Vite not found\n');

// 1. Update the main Dockerfile
function updateDockerfile() {
  console.log('1️⃣ Updating Dockerfile to include dev dependencies...');
  
  const dockerfileContent = `# Multi-stage build for React app
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including dev dependencies needed for build)
RUN npm ci

# Copy source code
COPY . .

# Build the app (this requires vite which is in devDependencies)
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built app to nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx-digitalocean.conf /etc/nginx/nginx.conf

# Create nginx user if it doesn't exist
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Change ownership of the app directory
RUN chown -R nextjs:nodejs /usr/share/nginx/html
RUN chown -R nextjs:nodejs /var/cache/nginx
RUN chown -R nextjs:nodejs /var/log/nginx
RUN chown -R nextjs:nodejs /etc/nginx/conf.d

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 8080

# Start nginx
CMD ["nginx", "-g", "daemon off;"]`;
  
  fs.writeFileSync('Dockerfile', dockerfileContent);
  console.log('   ✅ Updated Dockerfile');
}

// 2. Create a .dockerignore file to optimize build
function createDockerignore() {
  console.log('2️⃣ Creating .dockerignore file...');
  
  const dockerignoreContent = `# Dependencies
node_modules
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Build outputs
dist
build

# Environment files
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# IDE files
.vscode
.idea
*.swp
*.swo

# OS files
.DS_Store
Thumbs.db

# Git
.git
.gitignore

# Logs
logs
*.log

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage

# nyc test coverage
.nyc_output

# Dependency directories
jspm_packages/

# Optional npm cache directory
.npm

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# dotenv environment variables file
.env

# parcel-bundler cache (https://parceljs.org/)
.cache
.parcel-cache

# next.js build output
.next

# nuxt.js build output
.nuxt

# vuepress build output
.vuepress/dist

# Serverless directories
.serverless

# FuseBox cache
.fusebox/

# DynamoDB Local files
.dynamodb/

# TernJS port file
.tern-port

# Stores VSCode versions used for testing VSCode extensions
.vscode-test

# Temporary folders
tmp/
temp/

# Scripts
*.js
!vite.config.ts
!tailwind.config.ts
!postcss.config.js
!eslint.config.js
!tsconfig*.json

# Documentation
*.md
!README.md

# Test files
**/*.test.*
**/*.spec.*
test/
tests/

# Development tools
.github/
.do/
public/_redirects
netlify.toml
static.json
public/.htaccess`;
  
  fs.writeFileSync('.dockerignore', dockerignoreContent);
  console.log('   ✅ Created .dockerignore');
}

// 3. Create a build script for local testing
function createBuildScript() {
  console.log('3️⃣ Creating build script for local testing...');
  
  const buildScript = `#!/bin/bash
# Build script for local testing

echo "🔨 Building Docker image..."

# Build the image
docker build -t loanspur-app .

echo "✅ Build completed!"
echo ""
echo "🚀 To run the container:"
echo "docker run -p 8080:8080 loanspur-app"
echo ""
echo "🌐 Access the app at: http://localhost:8080"`;
  
  fs.writeFileSync('build.sh', buildScript);
  console.log('   ✅ Created build.sh');
}

// 4. Create a package.json script for Docker build
function updatePackageScripts() {
  console.log('4️⃣ Checking package.json for build scripts...');
  
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    // Add Docker build script if it doesn't exist
    if (!packageJson.scripts['docker:build']) {
      packageJson.scripts['docker:build'] = 'docker build -t loanspur-app .';
      packageJson.scripts['docker:run'] = 'docker run -p 8080:8080 loanspur-app';
      packageJson.scripts['docker:build:run'] = 'npm run docker:build && npm run docker:run';
      
      fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
      console.log('   ✅ Added Docker scripts to package.json');
    } else {
      console.log('   ℹ️  Docker scripts already exist in package.json');
    }
  } catch (error) {
    console.log('   ⚠️  Could not update package.json:', error.message);
  }
}

// Main execution
try {
  updateDockerfile();
  createDockerignore();
  createBuildScript();
  updatePackageScripts();
  
  console.log('\n🎉 Build error fixes completed!');
  console.log('\n📋 Summary of fixes:');
  console.log('✅ Updated Dockerfile to install ALL dependencies (including dev dependencies)');
  console.log('✅ Created .dockerignore for optimized builds');
  console.log('✅ Created build.sh script for local testing');
  console.log('✅ Added Docker scripts to package.json');
  
  console.log('\n🔧 Root cause of the error:');
  console.log('   - Vite is in devDependencies but build process needs it');
  console.log('   - npm ci --only=production excludes dev dependencies');
  console.log('   - Solution: Install all dependencies during build stage');
  
  console.log('\n🚀 Next steps:');
  console.log('1. Commit and push these changes:');
  console.log('   git add .');
  console.log('   git commit -m "Fix Docker build error - include dev dependencies"');
  console.log('   git push origin main');
  console.log('');
  console.log('2. Redeploy your DigitalOcean App');
  console.log('');
  console.log('3. The build should now succeed!');
  console.log('');
  console.log('4. Optional: Test locally with:');
  console.log('   npm run docker:build');
  console.log('   npm run docker:run');
  
} catch (error) {
  console.error('❌ Error fixing build issues:', error);
}
