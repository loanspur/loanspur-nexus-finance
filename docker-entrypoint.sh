#!/bin/sh
set -e

# Configure nginx for both production and development domains
PROD_DOMAIN=${DOMAIN_NAME:-loanspurcbs.com}
DEV_DOMAIN=${DEV_DOMAIN_NAME:-loanspur.online}

echo "Configuring nginx for:"
echo "  Production: $PROD_DOMAIN"
echo "  Development: $DEV_DOMAIN"

# The nginx config is already set up for both domains
# No need to replace placeholders since we're using explicit domain names

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