# 🚀 LoanSpur CBS Deployment Guide

## Current Issues & Solutions

### ❌ **Issues Identified:**
1. **Auth Route 404**: `/auth` route returns 404 Not Found on both domains
2. **Health Check 404**: `/health` endpoint not found on both domains
3. **Supabase API 401**: Database connection unauthorized
4. **Dual Domain Setup**: Need to support both production and development domains

### ✅ **Root Cause:**
- Nginx configuration not properly handling client-side routing
- Domain configuration mismatch between nginx and docker-entrypoint
- Missing environment variables in deployment
- Need to configure both `loanspurcbs.com` (production) and `loanspur.online` (development)

## 🔧 **Fixes Applied:**

### 1. **Dual Domain Nginx Configuration**
- ✅ Updated nginx.conf to support both `loanspurcbs.com` (production) and `loanspur.online` (development)
- ✅ Fixed docker-entrypoint.sh to handle both domains
- ✅ Added DOMAIN_NAME and DEV_DOMAIN_NAME environment variables

### 2. **GitHub Actions Workflow**
- ✅ Created automated deployment workflow
- ✅ Configured for `dev_branch` deployment
- ✅ Added proper environment variable handling

### 3. **Environment Variables**
- ✅ Added DOMAIN_NAME (production) and DEV_DOMAIN_NAME (development) to DigitalOcean app config
- ✅ Configured Supabase environment variables
- ✅ Set up both domains in DigitalOcean App Platform

## 🚀 **Deployment Steps:**

### **Step 1: Set Up GitHub Secrets**

Go to your GitHub repository → Settings → Secrets and variables → Actions

Add these secrets:
```
DIGITALOCEAN_ACCESS_TOKEN = [Your DigitalOcean API Token]
VITE_SUPABASE_URL = https://woqesvsopdgoikpatzxp.supabase.co
VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvcWVzdnNvcGRnb2lrcGF0enhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1MjQ0NDMsImV4cCI6MjA2NzEwMDQ0M30.rIFhs-PZ24UZBOzE4nx1Ev8Pyp__7rMt5N-7kWNUeDI
```

### **Step 2: Update Repository Configuration**

In `.do/app.yaml`, replace `your-username` with your actual GitHub username:
```yaml
github:
  repo: your-actual-username/loanspur-nexus-finance
  branch: dev_branch
  deploy_on_push: true
```

### **Step 3: Deploy**

1. **Commit and push the changes:**
   ```bash
   git add .
   git commit -m "Fix deployment configuration and routing issues"
   git push origin dev_branch
   ```

2. **Monitor deployment:**
   - Check GitHub Actions tab for deployment progress
   - Monitor DigitalOcean App Platform dashboard

3. **Verify deployment:**
   ```bash
   node check-deployment.js
   ```

## 🔍 **Verification Checklist:**

After deployment, verify these endpoints work:

### **Production Domain (loanspurcbs.com):**
- ✅ `https://loanspurcbs.com` - Main domain (should return 200)
- ✅ `https://loanspurcbs.com/auth` - Auth page (should return 200)
- ✅ `https://loanspurcbs.com/health` - Health check (should return 200)

### **Development Domain (loanspur.online):**
- ✅ `https://loanspur.online` - Main domain (should return 200)
- ✅ `https://loanspur.online/auth` - Auth page (should return 200)
- ✅ `https://loanspur.online/health` - Health check (should return 200)

### **Database:**
- ✅ Supabase API connection (should return 200)

## 🛠️ **Troubleshooting:**

### If deployment fails:
1. Check GitHub Actions logs for specific errors
2. Verify all secrets are correctly set
3. Ensure DigitalOcean account has necessary permissions

### If routes still return 404:
1. Check nginx logs in DigitalOcean dashboard
2. Verify the build process completed successfully
3. Ensure all environment variables are set

### If Supabase connection fails:
1. Check if Supabase project is active
2. Verify API keys are correct
3. Check RLS (Row Level Security) policies

## 📞 **Support:**

If you continue to experience issues:

1. **Check deployment logs** in DigitalOcean App Platform
2. **Review GitHub Actions** for build/deployment errors
3. **Test locally** with `npm run dev` to ensure app works
4. **Verify Supabase** project status and API keys

## 🎯 **Expected Results:**

After successful deployment:
- ✅ All routes should work (no more 404 errors)
- ✅ Authentication should function properly
- ✅ Super admin login should work
- ✅ Password reset emails should be sent
- ✅ Database connection should be stable

---

**Next Steps:** After deployment is successful, test the super admin login and password reset functionality using the dev tools we created.
