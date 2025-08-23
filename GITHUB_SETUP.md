# GitHub Repository Setup for Deployment

## Required GitHub Secrets

To enable automated deployment through GitHub Actions, you need to set up the following secrets in your GitHub repository:

### 1. Go to Repository Settings
- Navigate to your GitHub repository: `https://github.com/your-username/loanspur-nexus-finance`
- Click on **Settings** tab
- In the left sidebar, click on **Secrets and variables** → **Actions**

### 2. Add the Following Secrets

#### DigitalOcean Access Token
- **Name**: `DIGITALOCEAN_ACCESS_TOKEN`
- **Value**: Your DigitalOcean API token
- **How to get it**:
  1. Go to [DigitalOcean API Tokens](https://cloud.digitalocean.com/account/api/tokens)
  2. Click "Generate New Token"
  3. Give it a name like "GitHub Actions Deployment"
  4. Select "Write" scope
  5. Copy the generated token

#### Supabase Environment Variables
- **Name**: `VITE_SUPABASE_URL`
- **Value**: `https://woqesvsopdgoikpatzxp.supabase.co`

- **Name**: `VITE_SUPABASE_ANON_KEY`
- **Value**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvcWVzdnNvcGRnb2lrcGF0enhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1MjQ0NDMsImV4cCI6MjA2NzEwMDQ0M30.rIFhs-PZ24UZBOzE4nx1Ev8Pyp__7rMt5N-7kWNUeDI`

### 3. Verify Your Repository Configuration

Make sure your `.do/app.yaml` file has the correct GitHub repository information:

```yaml
github:
  repo: your-username/loanspur-nexus-finance
  branch: dev_branch
  deploy_on_push: true
```

Replace `your-username` with your actual GitHub username.

## Deployment Process

Once the secrets are configured:

1. **Push to dev_branch**: Any push to `dev_branch` will trigger automatic deployment
2. **Monitor deployment**: Check the "Actions" tab in your GitHub repository to monitor deployment progress
3. **Access your app**: Once deployed, your app will be available at `https://loanspur.online`

## Troubleshooting

### If deployment fails:
1. Check the GitHub Actions logs for specific error messages
2. Verify all secrets are correctly set
3. Ensure your DigitalOcean account has the necessary permissions
4. Check if the app already exists in DigitalOcean App Platform

### If the app doesn't load:
1. Check the deployment status in DigitalOcean dashboard
2. Verify the domain configuration
3. Check the nginx configuration in your Dockerfile
4. Ensure all environment variables are properly set

## Manual Deployment (if needed)

If you need to deploy manually:

```bash
# Install doctl if not already installed
# macOS: brew install doctl
# Linux: snap install doctl

# Authenticate with DigitalOcean
doctl auth init

# Deploy the app
doctl apps create --spec .do/app.yaml --wait
```

## Next Steps

After setting up the secrets:

1. **Test the deployment**: Push a small change to `dev_branch` to trigger deployment
2. **Monitor the first deployment**: Check both GitHub Actions and DigitalOcean dashboard
3. **Verify the app**: Visit `https://loanspur.online` to ensure it's working
4. **Test authentication**: Try logging in with your super admin credentials
