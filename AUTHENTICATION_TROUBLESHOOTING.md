# 🔐 Authentication Troubleshooting Guide

## 🚨 **Current Issues:**

### **1. CSP Error - Google Fonts Blocked:**
```
Refused to load the stylesheet 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap' because it violates the following Content Security Policy directive: "style-src 'self' 'unsafe-inline'".
```

**✅ FIXED:** Updated CSP in `netlify.toml` and `nginx.conf` to allow Google Fonts:
- Added `https://fonts.googleapis.com` to `style-src`
- Added `https://fonts.gstatic.com` to `font-src`

### **2. Supabase Authentication 400 Error:**
```
POST https://woqesvsopdgoikpatzxp.supabase.co/auth/v1/token?grant_type=password 400 (Bad Request)
```

## 🔍 **Authentication Error Analysis:**

### **Possible Causes of 400 Bad Request:**

1. **Invalid Credentials Format**
2. **User Doesn't Exist**
3. **Password Incorrect**
4. **Email Not Confirmed**
5. **Supabase Configuration Issue**

## 🛠️ **Step-by-Step Fixes:**

### **Step 1: Verify Supabase Configuration**

Check your environment variables in Netlify:

```bash
# Required Environment Variables for Netlify:
VITE_SUPABASE_URL = https://woqesvsopdgoikpatzxp.supabase.co
VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvcWVzdnNvcGRnb2lrcGF0enhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1MjQ0NDMsImV4cCI6MjA2NzEwMDQ0M30.rIFhs-PZ24UZBOzE4nx1Ev8Pyp__7rMt5N-7kWNUeDI
NODE_ENV = production
```

### **Step 2: Check User Existence**

The user `justmurenga@gmail.com` might not exist in the database. Let's verify:

1. **Check if user exists in auth.users table**
2. **Check if user has a profile in profiles table**
3. **Verify the password is correct**

### **Step 3: Create Test User (if needed)**

If the super admin user doesn't exist, create one:

```sql
-- Check if user exists
SELECT * FROM auth.users WHERE email = 'justmurenga@gmail.com';

-- Check if profile exists
SELECT * FROM profiles WHERE email = 'justmurenga@gmail.com';

-- If user doesn't exist, create one via Supabase Auth
-- This should be done through the application or Supabase dashboard
```

### **Step 4: Test Authentication Flow**

Use the browser console to test:

```javascript
// Test Supabase connection
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'justmurenga@gmail.com',
  password: 'password123'
});

console.log('Auth result:', { data, error });
```

## 🔧 **Immediate Fixes:**

### **Fix 1: Update CSP Headers**

✅ **Already Fixed** - Updated both `netlify.toml` and `nginx.conf`

### **Fix 2: Add Better Error Handling**

Let me update the authentication hook to provide better error messages:
```
