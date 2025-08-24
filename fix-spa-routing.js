// Fix SPA Routing Issues
// This script fixes the 404 error on page refresh for React Router

import fs from 'fs';
import path from 'path';

console.log('🔧 Fixing SPA Routing Issues\n');

// 1. Create a proper nginx.conf for DigitalOcean App Platform
function createDigitalOceanNginxConfig() {
  console.log('1️⃣ Creating DigitalOcean App Platform nginx configuration...');
  
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
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
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
  console.log('   ✅ Created nginx-digitalocean.conf');
}

// 2. Update Dockerfile to use the correct nginx config
function updateDockerfile() {
  console.log('2️⃣ Updating Dockerfile for proper nginx configuration...');
  
  const dockerfileContent = `# Multi-stage build for React app
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

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

// 3. Create a static.json for DigitalOcean App Platform
function createStaticJson() {
  console.log('3️⃣ Creating static.json for DigitalOcean App Platform...');
  
  const staticJson = {
    "root": "dist",
    "clean_urls": true,
    "routes": {
      "/**": "index.html"
    },
    "https_only": true,
    "headers": {
      "/**": {
        "X-Frame-Options": "DENY",
        "X-XSS-Protection": "1; mode=block",
        "X-Content-Type-Options": "nosniff",
        "Referrer-Policy": "strict-origin-when-cross-origin",
        "Strict-Transport-Security": "max-age=31536000; includeSubDomains"
      },
      "/static/**": {
        "Cache-Control": "public, max-age=31536000, immutable"
      }
    }
  };
  
  fs.writeFileSync('static.json', JSON.stringify(staticJson, null, 2));
  console.log('   ✅ Created static.json');
}

// 4. Create a .htaccess file as backup
function createHtaccess() {
  console.log('4️⃣ Creating .htaccess file as backup...');
  
  const htaccessContent = `# React Router SPA Configuration
# This ensures all routes are handled by index.html

RewriteEngine On

# Handle React Router routes
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]

# Security headers
Header always set X-Frame-Options DENY
Header always set X-XSS-Protection "1; mode=block"
Header always set X-Content-Type-Options nosniff
Header always set Referrer-Policy "strict-origin-when-cross-origin"

# Cache static assets
<FilesMatch "\\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$">
    Header set Cache-Control "public, max-age=31536000, immutable"
</FilesMatch>`;
  
  fs.writeFileSync('public/.htaccess', htaccessContent);
  console.log('   ✅ Created public/.htaccess');
}

// 5. Update the main nginx.conf
function updateMainNginxConfig() {
  console.log('5️⃣ Updating main nginx.conf...');
  
  const nginxConfig = `events {
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
    
    # SSL configuration for wildcard certificate
    ssl_certificate /etc/ssl/certs/wildcard.crt;
    ssl_certificate_key /etc/ssl/private/wildcard.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Main server block for the application
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
        
        # API endpoints with rate limiting
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
    
    # HTTPS redirect server block for production
    server {
        listen 80;
        listen [::]:80;
        server_name *.loanspurcbs.com loanspurcbs.com;
        return 301 https://$server_name$request_uri;
    }
    
    # HTTPS redirect server block for development
    server {
        listen 80;
        listen [::]:80;
        server_name *.loanspur.online loanspur.online;
        return 301 https://$server_name$request_uri;
    }
    
    # HTTPS server block for production (wildcard SSL)
    server {
        listen 443 ssl http2;
        listen [::]:443 ssl http2;
        server_name *.loanspurcbs.com loanspurcbs.com;
        
        root /usr/share/nginx/html;
        index index.html;
        
        # CRITICAL: Handle tenant subdomains with SSL
        location / {
            set $subdomain "";
            if ($host ~ ^([^.]+)\.loanspurcbs\.com$) {
                set $subdomain $1;
            }
            
            add_header X-Tenant-Subdomain $subdomain always;
            add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
            
            # CRITICAL: This is the key fix for React Router
            try_files $uri $uri/ /index.html;
        }
        
        # Handle specific routes that might cause issues
        location ~ ^/(tenant|client|super-admin|auth)/ {
            try_files $uri $uri/ /index.html;
        }
    }
    
    # HTTPS server block for development (wildcard SSL)
    server {
        listen 443 ssl http2;
        listen [::]:443 ssl http2;
        server_name *.loanspur.online loanspur.online;
        
        root /usr/share/nginx/html;
        index index.html;
        
        # CRITICAL: Handle tenant subdomains with SSL
        location / {
            set $subdomain "";
            if ($host ~ ^([^.]+)\.loanspur\.online$) {
                set $subdomain $1;
            }
            
            add_header X-Tenant-Subdomain $subdomain always;
            add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
            
            # CRITICAL: This is the key fix for React Router
            try_files $uri $uri/ /index.html;
        }
        
        # Handle specific routes that might cause issues
        location ~ ^/(tenant|client|super-admin|auth)/ {
            try_files $uri $uri/ /index.html;
        }
        
        # API proxy with SSL
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            proxy_pass https://woqesvsopdgoikpatzxp.supabase.co/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto https;
            proxy_ssl_verify off;
        }
    }
}`;
  
  fs.writeFileSync('nginx.conf', nginxConfig);
  console.log('   ✅ Updated nginx.conf');
}

// Main execution
try {
  createDigitalOceanNginxConfig();
  updateDockerfile();
  createStaticJson();
  createHtaccess();
  updateMainNginxConfig();
  
  console.log('\n🎉 SPA Routing fixes completed!');
  console.log('\n📋 Summary of fixes:');
  console.log('✅ Created nginx-digitalocean.conf for DigitalOcean App Platform');
  console.log('✅ Updated Dockerfile to use proper nginx configuration');
  console.log('✅ Created static.json for DigitalOcean App Platform');
  console.log('✅ Created .htaccess file as backup');
  console.log('✅ Updated main nginx.conf with proper React Router handling');
  
  console.log('\n🔧 Key fixes applied:');
  console.log('1. Added explicit try_files $uri $uri/ /index.html; for all routes');
  console.log('2. Added specific location blocks for /tenant, /client, /super-admin, /auth');
  console.log('3. Ensured proper nginx configuration for DigitalOcean App Platform');
  console.log('4. Added backup configurations for different hosting scenarios');
  
  console.log('\n🚀 Next steps:');
  console.log('1. Commit and push these changes to your repository');
  console.log('2. Redeploy your DigitalOcean App');
  console.log('3. Test page refresh on subdomains:');
  console.log('   - https://umoja-magharibi.loanspurcbs.com/tenant');
  console.log('   - https://umoja-magharibi.loanspurcbs.com/client');
  console.log('   - https://umoja-magharibi.loanspurcbs.com/auth');
  console.log('4. The 404 error on page refresh should now be resolved');
  
} catch (error) {
  console.error('❌ Error fixing SPA routing issues:', error);
}
