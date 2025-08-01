#!/bin/sh
set -e

# Replace placeholder domain in nginx config with actual domain from environment
if [ -n "$DOMAIN_NAME" ]; then
    sed -i "s/yourdomain\.com/$DOMAIN_NAME/g" /etc/nginx/nginx.conf
fi

# Create SSL certificate directory if it doesn't exist
mkdir -p /etc/ssl/certs /etc/ssl/private

# If SSL certificates are provided via environment or volume, copy them
if [ -f "/ssl/wildcard.crt" ] && [ -f "/ssl/wildcard.key" ]; then
    cp /ssl/wildcard.crt /etc/ssl/certs/
    cp /ssl/wildcard.key /etc/ssl/private/
    chmod 644 /etc/ssl/certs/wildcard.crt
    chmod 600 /etc/ssl/private/wildcard.key
else
    # Generate self-signed certificate for development
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout /etc/ssl/private/wildcard.key \
        -out /etc/ssl/certs/wildcard.crt \
        -subj "/CN=*.${DOMAIN_NAME:-localhost}" \
        -addext "subjectAltName=DNS:*.${DOMAIN_NAME:-localhost},DNS:${DOMAIN_NAME:-localhost}"
fi

# Test nginx configuration
nginx -t

# Execute the main command
exec "$@"