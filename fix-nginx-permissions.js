// Fix Nginx Permission Denied Error
// This script fixes the nginx permission error when running as non-root user

import fs from 'fs';

console.log('🔧 Fixing Nginx Permission Denied Error\n');

// 1. Update the main Dockerfile to fix nginx permissions
function updateDockerfile() {
  console.log('1️⃣ Updating Dockerfile to fix nginx permissions...');
  
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

# Create nginx user and group
RUN addgroup -g 1001 -S nodejs && \\
    adduser -S nextjs -u 1001 -G nodejs

# Create necessary directories and set permissions
RUN mkdir -p /var/cache/nginx /var/log/nginx /var/run && \\
    chown -R nextjs:nodejs /var/cache/nginx && \\
    chown -R nextjs:nodejs /var/log/nginx && \\
    chown -R nextjs:nodejs /var/run && \\
    chown -R nextjs:nodejs /usr/share/nginx/html && \\
    chown -R nextjs:nodejs /etc/nginx/conf.d && \\
    chmod -R 755 /var/cache/nginx && \\
    chmod -R 755 /var/log/nginx && \\
    chmod -R 755 /var/run

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 8080

# Start nginx with proper configuration
CMD ["nginx", "-g", "daemon off;"]`;
  
  fs.writeFileSync('Dockerfile', dockerfileContent);
  console.log('   ✅ Updated Dockerfile with proper nginx permissions');
}

// 2. Create an alternative Dockerfile that runs nginx as root (if needed)
function createAlternativeDockerfile() {
  console.log('2️⃣ Creating alternative Dockerfile (nginx as root)...');
  
  const dockerfileContent = `# Multi-stage build for React app (nginx as root)
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

# Create nginx user and group (for file ownership)
RUN addgroup -g 1001 -S nodejs && \\
    adduser -S nextjs -u 1001 -G nodejs

# Set ownership of app files to non-root user
RUN chown -R nextjs:nodejs /usr/share/nginx/html

# Expose port
EXPOSE 8080

# Start nginx as root (nginx needs root for system operations)
CMD ["nginx", "-g", "daemon off;"]`;
  
  fs.writeFileSync('Dockerfile.root', dockerfileContent);
  console.log('   ✅ Created Dockerfile.root (nginx as root)');
}

// 3. Update nginx configuration to work with non-root user
function updateNginxConfig() {
  console.log('3️⃣ Updating nginx configuration for non-root user...');
  
  const nginxConfig = `# DigitalOcean App Platform nginx configuration
# This ensures React Router works correctly with page refreshes

events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;
    
    # Logging
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                   '$status $body_bytes_sent "$http_referer" '
                   '"$http_user_agent" "$http_x_forwarded_for"';
    
    access_log /var/log/nginx/access.log main;
    error_log /var/log/nginx/error.log warn;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Referrer-Policy strict-origin-when-cross-origin;
    
    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    
    # Main server block for DigitalOcean App Platform
    server {
        listen 8080;
        listen [::]:8080;
        server_name _;
        root /usr/share/nginx/html;
        index index.html;
        
        # CRITICAL: Handle all routes for React Router SPA
        location / {
            # Check if this is a subdomain request
            set $subdomain "";
            if ($host ~ ^([^.]+)\.loanspurcbs\.com$) {
                set $subdomain $1;
            }
            if ($host ~ ^([^.]+)\.loanspur\.online$) {
                set $subdomain $1;
            }
            
            # Set tenant context header for the frontend
            add_header X-Tenant-Subdomain $subdomain always;
            
            # CRITICAL: This is the key fix for React Router
            # Try to serve the file, then directory, then fall back to index.html
            try_files $uri $uri/ /index.html;
        }
        
        # Handle specific routes that might cause issues
        location ~ ^/(tenant|client|super-admin|auth)/ {
            try_files $uri $uri/ /index.html;
        }
        
        # API endpoints
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            proxy_pass https://woqesvsopdgoikpatzxp.supabase.co/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
        
        # Static assets caching
        location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
            add_header X-Tenant-Subdomain $subdomain always;
        }
        
        # Health check endpoint
        location /health {
            access_log off;
            return 200 "healthy\\n";
            add_header Content-Type text/plain;
        }
        
        # Security headers
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
        add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://woqesvsopdgoikpatzxp.supabase.co; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://woqesvsopdgoikpatzxp.supabase.co wss://woqesvsopdgoikpatzxp.supabase.co; frame-src 'none';" always;
    }
}`;
  
  fs.writeFileSync('nginx-digitalocean.conf', nginxConfig);
  console.log('   ✅ Updated nginx-digitalocean.conf');
}

// 4. Create a startup script to handle permissions
function createStartupScript() {
  console.log('4️⃣ Creating startup script to handle permissions...');
  
  const startupScript = `#!/bin/sh
# Startup script to handle nginx permissions

# Create necessary directories if they don't exist
mkdir -p /var/cache/nginx /var/log/nginx /var/run

# Set proper permissions
chown -R nextjs:nodejs /var/cache/nginx
chown -R nextjs:nodejs /var/log/nginx
chown -R nextjs:nodejs /var/run
chown -R nextjs:nodejs /usr/share/nginx/html

# Set proper permissions
chmod -R 755 /var/cache/nginx
chmod -R 755 /var/log/nginx
chmod -R 755 /var/run

# Start nginx
exec nginx -g "daemon off;"`;
  
  fs.writeFileSync('docker-entrypoint.sh', startupScript);
  console.log('   ✅ Created docker-entrypoint.sh');
}

// 5. Create a simple Dockerfile that runs nginx as root (recommended for DigitalOcean)
function createSimpleDockerfile() {
  console.log('5️⃣ Creating simple Dockerfile (recommended for DigitalOcean)...');
  
  const dockerfileContent = `# Simple multi-stage build for React app
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including dev dependencies needed for build)
RUN npm ci

# Copy source code
COPY . .

# Build the app
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built app to nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx-digitalocean.conf /etc/nginx/nginx.conf

# Expose port
EXPOSE 8080

# Start nginx (runs as root by default)
CMD ["nginx", "-g", "daemon off;"]`;
  
  fs.writeFileSync('Dockerfile.simple', dockerfileContent);
  console.log('   ✅ Created Dockerfile.simple (recommended)');
}

// Main execution
try {
  updateDockerfile();
  createAlternativeDockerfile();
  updateNginxConfig();
  createStartupScript();
  createSimpleDockerfile();
  
  console.log('\n🎉 Nginx permission fixes completed!');
  console.log('\n📋 Summary of fixes:');
  console.log('✅ Updated Dockerfile with proper nginx permissions');
  console.log('✅ Created Dockerfile.root (nginx as root)');
  console.log('✅ Updated nginx-digitalocean.conf');
  console.log('✅ Created docker-entrypoint.sh startup script');
  console.log('✅ Created Dockerfile.simple (recommended for DigitalOcean)');
  
  console.log('\n🔧 Root cause of the error:');
  console.log('   - Nginx needs to write to /var/run/nginx.pid');
  console.log('   - Non-root user (nextjs) lacks permissions');
  console.log('   - Solution: Proper directory permissions or run as root');
  
  console.log('\n🚀 Recommended solution:');
  console.log('   Use Dockerfile.simple (nginx as root) for DigitalOcean App Platform');
  console.log('   This is the most reliable approach for containerized environments');
  
  console.log('\n📋 Next steps:');
  console.log('1. Choose your preferred approach:');
  console.log('   Option A (Recommended): Use Dockerfile.simple');
  console.log('     cp Dockerfile.simple Dockerfile');
  console.log('   Option B: Use the updated Dockerfile with proper permissions');
  console.log('   Option C: Use Dockerfile.root (nginx as root)');
  console.log('');
  console.log('2. Commit and push changes:');
  console.log('   git add .');
  console.log('   git commit -m "Fix nginx permission denied error"');
  console.log('   git push origin main');
  console.log('');
  console.log('3. Redeploy your DigitalOcean App');
  console.log('');
  console.log('4. The nginx permission error should now be resolved!');
  
} catch (error) {
  console.error('❌ Error fixing nginx permissions:', error);
}
