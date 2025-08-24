# 🏢 Multitenant Subdomain Setup Guide

## 🎯 **Architecture Overview:**

### **Development Environment:**
- **Main Domain**: `loanspur.online`
- **Tenant Subdomains**: `*.loanspur.online` (wildcard)
- **Example**: `tenant1.loanspur.online`, `acme.loanspur.online`

### **Production Environment:**
- **Main Domain**: `loanspurcbs.com`
- **Tenant Subdomains**: `*.loanspurcbs.com` (wildcard)
- **Example**: `tenant1.loanspurcbs.com`, `acme.loanspurcbs.com`

## 🔧 **Current Configuration:**

### **Netlify (Development - loanspur.online):**
- ✅ Main domain routing configured
- ✅ Wildcard subdomain routing configured
- ✅ React Router client-side routing enabled

### **DigitalOcean (Production - loanspurcbs.com):**
- ✅ Main domain routing configured
- ✅ Wildcard subdomain routing configured
- ✅ Nginx configuration for tenant subdomains

## 🚀 **Deployment Strategy:**

### **Development (Netlify):**
```
loanspur.online          → Main application
*.loanspur.online        → Tenant applications
```

### **Production (DigitalOcean):**
```
loanspurcbs.com          → Main application  
*.loanspurcbs.com        → Tenant applications
```

## 🔍 **How Tenant Subdomains Work:**

### **1. Subdomain Detection:**
Your application uses `getCurrentSubdomain()` to detect the tenant:

```typescript
// src/utils/tenant.ts
export const getCurrentSubdomain = () => {
  if (typeof window === 'undefined') return null;
  
  const hostname = window.location.hostname;
  
  // Check for development subdomains
  const devMatch = hostname.match(/^([^.]+)\.loanspur\.online$/);
  if (devMatch) return devMatch[1];
  
  // Check for production subdomains
  const prodMatch = hostname.match(/^([^.]+)\.loanspurcbs\.com$/);
  if (prodMatch) return prodMatch[1];
  
  return null;
};
```

### **2. Router Selection:**
Based on subdomain detection, the app chooses the appropriate router:

```typescript
// src/App.tsx
const AppRouter = () => {
  const subdomain = getCurrentSubdomain();
  const isSubdomainTenant = !!subdomain;

  return isSubdomainTenant ? <TenantRouter /> : <MainSiteRouter />;
};
```

### **3. Tenant Context:**
The `TenantProvider` loads tenant-specific data based on the subdomain.

## 🔧 **DNS Configuration Required:**

### **For Development (Netlify):**
```
Type: CNAME
Name: *
Value: [your-netlify-site].netlify.app
TTL: 3600
```

### **For Production (DigitalOcean):**
```
Type: CNAME  
Name: *
Value: [your-digitalocean-app].ondigitalocean.app
TTL: 3600
```

## 🧪 **Testing Tenant Subdomains:**

### **Development Testing:**
```bash
# Test main domain
curl https://loanspur.online

# Test tenant subdomains
curl https://tenant1.loanspur.online
curl https://acme.loanspur.online
curl https://test-company.loanspur.online
```

### **Production Testing:**
```bash
# Test main domain
curl https://loanspurcbs.com

# Test tenant subdomains
curl https://tenant1.loanspurcbs.com
curl https://acme.loanspurcbs.com
curl https://test-company.loanspurcbs.com
```

## 🔍 **Verification Checklist:**

### **Development Environment (Netlify):**
- ✅ `https://loanspur.online` - Main application loads
- ✅ `https://loanspur.online/auth` - Authentication works
- ✅ `https://tenant1.loanspur.online` - Tenant app loads
- ✅ `https://tenant1.loanspur.online/auth` - Tenant auth works
- ✅ `https://acme.loanspur.online` - Another tenant loads

### **Production Environment (DigitalOcean):**
- ✅ `https://loanspurcbs.com` - Main application loads
- ✅ `https://loanspurcbs.com/auth` - Authentication works
- ✅ `https://tenant1.loanspurcbs.com` - Tenant app loads
- ✅ `https://tenant1.loanspurcbs.com/auth` - Tenant auth works
- ✅ `https://acme.loanspurcbs.com` - Another tenant loads

## 🛠️ **Troubleshooting:**

### **If subdomains don't work:**

1. **Check DNS Configuration:**
   ```bash
   # Check if wildcard DNS is configured
   nslookup *.loanspur.online
   nslookup *.loanspurcbs.com
   ```

2. **Verify Netlify Configuration:**
   - Check that `_redirects` file includes subdomain handling
   - Ensure `netlify.toml` has subdomain redirects

3. **Check DigitalOcean Configuration:**
   - Verify nginx configuration handles subdomains
   - Check that SSL certificates include wildcard domains

### **If tenant data doesn't load:**

1. **Check Supabase Configuration:**
   - Verify RLS (Row Level Security) policies
   - Check tenant isolation in database

2. **Check Application Logs:**
   - Look for subdomain detection issues
   - Verify tenant context loading

## 📊 **Performance Considerations:**

### **Caching Strategy:**
- Main domain and subdomains can be cached separately
- Tenant-specific data should not be cached across tenants
- Static assets can be cached globally

### **Security:**
- Each tenant's data is isolated
- Cross-tenant access is prevented
- SSL certificates cover all subdomains

## 🎯 **Expected User Experience:**

### **For Main Domain Users:**
- Access `loanspur.online` or `loanspurcbs.com`
- See main application with registration/login
- Can register new tenant organizations

### **For Tenant Users:**
- Access `tenant-name.loanspur.online` or `tenant-name.loanspurcbs.com`
- Automatically logged into their tenant's system
- See only their organization's data
- Full access to tenant-specific features

## 📞 **Next Steps:**

1. **Configure DNS wildcards** for both domains
2. **Deploy to Netlify** for development
3. **Deploy to DigitalOcean** for production
4. **Test tenant subdomains** thoroughly
5. **Verify data isolation** between tenants
6. **Monitor performance** and security

---

**Note:** The wildcard subdomain setup allows unlimited tenant organizations to have their own branded subdomain while sharing the same application infrastructure.
