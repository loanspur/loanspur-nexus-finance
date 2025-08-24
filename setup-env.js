// Environment Setup Script
// This script helps configure the .env.local file with the correct values

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔧 Setting up environment variables...\n');

// Your current Supabase configuration
const SUPABASE_URL = "https://woqesvsopdgoikpatzxp.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvcWVzdnNvcGRnb2lrcGF0enhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1MjQ0NDMsImV4cCI6MjA2NzEwMDQ0M30.rIFhs-PZ24UZBOzE4nx1Ev8Pyp__7rMt5N-7kWNUeDI";

// Create the environment file content
const envContent = `# Environment Variables for Core Banking System
# This file contains sensitive configuration - NEVER commit to version control

# Supabase Configuration
VITE_SUPABASE_URL=${SUPABASE_URL}
VITE_SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}

# Development Testing (optional - for development only)
# Only use these for local development, never in production
VITE_DEV_TEST_EMAIL=test@example.com
VITE_DEV_TEST_PASSWORD=testpassword123

# Feature Flags
VITE_ENABLE_SAVINGS=true
VITE_ENABLE_GROUPS=true
VITE_ENABLE_ADVANCED_REPORTING=false
VITE_ENABLE_MIFOS_INTEGRATION=true

# Monitoring (optional)
VITE_SENTRY_DSN=your_sentry_dsn_here
VITE_ANALYTICS_ID=your_analytics_id_here

# Email Configuration
VITE_RESEND_API_KEY=your_resend_api_key_here
VITE_RESEND_EMAIL_FROM=noreply@loanspur.online

# Security
VITE_ENABLE_DEBUG_LOGGING=true
VITE_ENABLE_PERFORMANCE_MONITORING=true

# Development Mode (set to true for development, false for production)
VITE_IS_DEVELOPMENT=true

# Additional Configuration
VITE_APP_NAME=LoanSpur Core Banking
VITE_APP_VERSION=2.0.0
`;

// Write the environment file
const envPath = path.join(__dirname, '.env.local');
fs.writeFileSync(envPath, envContent);

console.log('✅ Environment file (.env.local) has been configured with:');
console.log(`   📍 Supabase URL: ${SUPABASE_URL}`);
console.log(`   🔑 Supabase Anon Key: ${SUPABASE_ANON_KEY.substring(0, 20)}...`);
console.log('   🚀 Development mode enabled');
console.log('   🔧 Debug logging enabled for development');
console.log('\n📋 Next steps:');
console.log('1. Update VITE_RESEND_API_KEY with your Resend.com API key');
console.log('2. Update VITE_RESEND_EMAIL_FROM with your verified domain');
console.log('3. Test the application with: npm run dev');
console.log('4. Check that authentication works correctly');
console.log('\n⚠️  IMPORTANT: Never commit .env.local to version control!');
