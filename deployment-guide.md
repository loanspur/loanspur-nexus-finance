# DigitalOcean Deployment Guide

This guide covers deploying the microfinance platform to DigitalOcean with CI/CD, tenant subdomain management, and wildcard SSL.

## Prerequisites

1. **DigitalOcean Account**: Create an account at digitalocean.com
2. **Domain Name**: You'll need a domain for wildcard SSL (e.g., yourdomain.com)
3. **GitHub Repository**: Code should be in a GitHub repository
4. **DigitalOcean CLI**: Install `doctl` locally for management

## Setup Steps

### 1. DigitalOcean Configuration

1. **Create DigitalOcean Access Token**:
   - Go to DigitalOcean Control Panel → API
   - Generate a new personal access token
   - Save this token securely

2. **Install and Configure doctl**:
   ```bash
   # Install doctl (macOS)
   brew install doctl
   
   # Install doctl (Linux)
   snap install doctl
   
   # Authenticate
   doctl auth init
   ```

3. **Create Container Registry**:
   ```bash
   doctl registry create microfinance-platform
   ```

### 2. DNS Configuration

1. **Point your domain to DigitalOcean nameservers**:
   - ns1.digitalocean.com
   - ns2.digitalocean.com
   - ns3.digitalocean.com

2. **Create DNS records in DigitalOcean**:
   ```bash
   # Create A record for main domain
   doctl compute domain records create yourdomain.com --type A --name @ --data YOUR_APP_IP
   
   # Create wildcard A record for subdomains
   doctl compute domain records create yourdomain.com --type A --name "*" --data YOUR_APP_IP
   ```

### 3. SSL Certificate Setup

**Option A: DigitalOcean Managed Certificates (Recommended)**
```bash
# Create managed certificate for wildcard domain
doctl compute certificate create \
  --name wildcard-yourdomain-com \
  --type lets_encrypt \
  --dns-names "yourdomain.com,*.yourdomain.com"
```

**Option B: Custom SSL Certificate**
- Upload your wildcard SSL certificate files
- Update the certificate ID in `.do/app.yaml`

### 4. GitHub Actions Setup

1. **Add secrets to your GitHub repository**:
   - Go to Repository → Settings → Secrets and variables → Actions
   - Add the following secrets:
     - `DIGITALOCEAN_ACCESS_TOKEN`: Your DO access token
     - `DIGITALOCEAN_APP_ID`: App ID (created after first deployment)
     - `SLACK_WEBHOOK`: (Optional) For deployment notifications

2. **Update configuration files**:
   - Edit `.do/app.yaml` and replace `yourdomain.com` with your actual domain
   - Update `nginx.conf` domain references
   - Modify `docker-entrypoint.sh` if needed

### 5. Initial Deployment

1. **Create the app manually first**:
   ```bash
   # Update app.yaml with your repository details
   doctl apps create --spec .do/app.yaml
   ```

2. **Get your app ID**:
   ```bash
   doctl apps list
   ```

3. **Add the app ID to GitHub secrets** as `DIGITALOCEAN_APP_ID`

### 6. Environment Variables

Update `.do/app.yaml` with your environment variables:
- Supabase URLs and keys
- Custom domain name
- Any other required environment variables

### 7. Tenant Subdomain Management

The system automatically handles tenant subdomains through:

1. **Nginx Configuration**: Routes subdomain requests appropriately
2. **Frontend Context**: `TenantContext` extracts subdomain information
3. **Database Integration**: Maps subdomains to tenant records

### 8. Monitoring and Logging

1. **App Platform Metrics**: Available in DigitalOcean control panel
2. **Application Logs**: 
   ```bash
   doctl apps logs YOUR_APP_ID --follow
   ```
3. **Health Checks**: Configured at `/health` endpoint

## CI/CD Workflow

The GitHub Actions workflow automatically:
1. Runs tests and linting on every push
2. Builds and pushes Docker images to DO Container Registry
3. Deploys to DigitalOcean App Platform
4. Runs security scans
5. Sends deployment notifications

## Local Development

```bash
# Run with Docker Compose
docker-compose up --build

# Run locally with Node.js
npm install
npm run dev
```

## Troubleshooting

### Common Issues

1. **SSL Certificate Issues**:
   - Ensure DNS is properly configured
   - Wait for certificate validation (can take up to 24 hours)
   - Check certificate status: `doctl compute certificate list`

2. **Subdomain Routing Issues**:
   - Verify wildcard DNS record
   - Check nginx configuration syntax
   - Review app logs for routing errors

3. **Environment Variables**:
   - Ensure all required env vars are set in app.yaml
   - Check Supabase connection strings
   - Verify domain configuration

4. **Build Failures**:
   - Check GitHub Actions logs
   - Verify Docker image builds locally
   - Ensure all dependencies are properly listed

### Useful Commands

```bash
# View app details
doctl apps get YOUR_APP_ID

# List deployments
doctl apps list-deployments YOUR_APP_ID

# View app logs
doctl apps logs YOUR_APP_ID --follow

# Update app configuration
doctl apps update YOUR_APP_ID --spec .do/app.yaml

# Check certificate status
doctl compute certificate list

# View DNS records
doctl compute domain records list yourdomain.com
```

## Security Considerations

1. **SSL/TLS**: Always use HTTPS with proper certificates
2. **Security Headers**: Configured in nginx.conf
3. **Rate Limiting**: Implemented for API endpoints
4. **Container Security**: Regular vulnerability scanning
5. **Access Control**: Proper IAM and API token management

## Scaling

- **Horizontal Scaling**: Increase instance count in app.yaml
- **Vertical Scaling**: Change instance size in app.yaml
- **Database Scaling**: Configure read replicas in Supabase
- **CDN**: Consider adding DigitalOcean Spaces CDN

## Backup and Recovery

1. **Database Backups**: Managed by Supabase
2. **Application State**: Stateless design for easy recovery
3. **Container Images**: Stored in DO Container Registry
4. **Configuration**: Version controlled in Git

## Cost Optimization

1. **Right-size instances**: Start with basic-xxs and scale up
2. **Container Registry**: Clean up old images regularly
3. **Monitoring**: Use DO monitoring to track resource usage
4. **Auto-scaling**: Configure based on traffic patterns

For support, refer to DigitalOcean documentation or create a support ticket.