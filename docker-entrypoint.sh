#!/bin/sh
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
exec nginx -g "daemon off;"