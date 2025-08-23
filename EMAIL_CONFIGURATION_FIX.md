# 🔧 Email Configuration Fix Guide (Resend.com)

## 🚨 **Issue Identified: Invalid Resend API Key**

### **Test Results:**
- ✅ **Supabase Edge Functions**: Working
- ❌ **Test Email Function**: `"API key is invalid"`
- ✅ **Password Reset Function**: Working (status 200)
- ❌ **OTP Email Function**: `"API key is invalid"`
- ✅ **Database Tables**: Accessible

## 🔍 **Root Cause Analysis:**

The **RESEND_API_KEY** environment variable in Supabase is either:
1. **Missing** - Not set in Supabase environment
2. **Invalid/Expired** - API key has been revoked or expired
3. **Wrong Format** - Incorrect API key format

## 🛠️ **Step-by-Step Fix:**

### **Step 1: Get a Valid Resend API Key**

1. **Go to [resend.com](https://resend.com)**
2. **Sign in to your account**
3. **Go to API Keys section**
4. **Create a new API key** (or copy existing one)
5. **API key format**: `re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### **Step 2: Set Up Resend Domain**

1. **In Resend Dashboard:**
   - Go to **Domains** section
   - Add your domain (e.g., `loanspur.online` or `loanspurcbs.com`)
   - Follow DNS verification steps
   - Or use Resend's default domain: `resend.dev`

### **Step 3: Update Supabase Environment Variables**

**In Supabase Dashboard:**

1. **Go to Settings → Environment Variables**
2. **Add/Update these variables:**

```bash
# Required for all email functions
RESEND_API_KEY = re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Required for email sending
RESEND_EMAIL_FROM = noreply@resend.dev
# OR if you have a custom domain:
RESEND_EMAIL_FROM = noreply@loanspur.online
```

### **Step 4: Verify Environment Variables**

**Check if variables are set correctly:**

```bash
# In Supabase Edge Functions, these should be accessible:
Deno.env.get('RESEND_API_KEY')     # Should return your API key
Deno.env.get('RESEND_EMAIL_FROM')  # Should return your email address
```

### **Step 5: Test Email Configuration**

After updating the environment variables:

1. **Deploy the updated functions** (if needed)
2. **Run the test script again:**
   ```bash
   node test-email-configuration.js
   ```

## 🔧 **Alternative Solutions:**

### **Option 1: Use Resend's Default Domain**
If you don't have a custom domain verified:

```bash
RESEND_EMAIL_FROM = noreply@resend.dev
```

### **Option 2: Create a New API Key**
If current key is invalid:

1. **Delete old API key** in Resend dashboard
2. **Create new API key**
3. **Update Supabase environment variable**

### **Option 3: Check API Key Permissions**
Ensure your Resend API key has:
- ✅ **Email sending permissions**
- ✅ **Domain access** (if using custom domain)
- ✅ **Not rate limited**

## 🧪 **Testing After Fix:**

### **Test 1: Simple Email Test**
```javascript
// Test in browser console
const response = await fetch('https://woqesvsopdgoikpatzxp.supabase.co/functions/v1/send-test-email', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_ANON_KEY'
  },
  body: JSON.stringify({
    testEmail: 'your-email@gmail.com',
    fromName: 'LoanSpur Test'
  })
});

const result = await response.json();
console.log(result);
```

### **Test 2: Password Reset Test**
```javascript
// Test password reset email
const response = await fetch('https://woqesvsopdgoikpatzxp.supabase.co/functions/v1/send-password-reset-otp', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_ANON_KEY'
  },
  body: JSON.stringify({
    email: 'your-email@gmail.com'
  })
});

const result = await response.json();
console.log(result);
```

## 📋 **Checklist for Email Fix:**

- [ ] **Valid Resend API key** obtained
- [ ] **Domain verified** in Resend (or using resend.dev)
- [ ] **Environment variables** set in Supabase
- [ ] **Edge functions** deployed with new variables
- [ ] **Test emails** sent successfully
- [ ] **Password reset emails** working
- [ ] **OTP emails** working
- [ ] **User invitation emails** working

## 🚀 **Expected Results After Fix:**

- ✅ **Test Email Function**: Status 200, email sent
- ✅ **Password Reset Function**: Status 200, email sent
- ✅ **OTP Email Function**: Status 200, email sent
- ✅ **User Invitation Function**: Status 200, email sent
- ✅ **Welcome Email Function**: Status 200, email sent

## 🔍 **Troubleshooting:**

### **If still getting "API key is invalid":**

1. **Check API key format**: Should start with `re_`
2. **Verify key in Resend dashboard**: Ensure it's active
3. **Check Supabase environment**: Variables are set correctly
4. **Redeploy Edge Functions**: After updating environment variables

### **If emails not delivered:**

1. **Check spam folder**
2. **Verify sender domain** in Resend
3. **Check Resend dashboard** for delivery status
4. **Review email content** for spam triggers

---

**Note**: The password reset function is working (status 200), which suggests the basic Resend integration is functional, but the API key might be partially invalid or have limited permissions.
