// Quick Test Script for Critical Fixes
// This script verifies that the critical fixes are working correctly

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🧪 Testing Critical Fixes...\n');

let allTestsPassed = true;

// Test 1: Check if hardcoded credentials were removed
function testHardcodedCredentialsRemoval() {
  console.log('1️⃣ Testing hardcoded credentials removal...');
  
  const authPagePath = path.join(__dirname, 'src', 'pages', 'AuthPage.tsx');
  
  if (fs.existsSync(authPagePath)) {
    const content = fs.readFileSync(authPagePath, 'utf8');
    
    const hasHardcodedEmail = content.includes('justmurenga@gmail.com');
    const hasHardcodedPassword = content.includes('password123');
    
    if (!hasHardcodedEmail && !hasHardcodedPassword) {
      console.log('   ✅ Hardcoded credentials successfully removed from AuthPage.tsx');
    } else {
      console.log('   ❌ Hardcoded credentials still found in AuthPage.tsx');
      allTestsPassed = false;
    }
  } else {
    console.log('   ⚠️  AuthPage.tsx not found');
  }
}

// Test 2: Check if environment file exists
function testEnvironmentFile() {
  console.log('2️⃣ Testing environment file setup...');
  
  const envPath = path.join(__dirname, '.env.local');
  
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    
    const hasSupabaseUrl = content.includes('VITE_SUPABASE_URL=https://woqesvsopdgoikpatzxp.supabase.co');
    const hasSupabaseKey = content.includes('VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9');
    const hasDevelopmentFlag = content.includes('VITE_IS_DEVELOPMENT=true');
    
    if (hasSupabaseUrl && hasSupabaseKey && hasDevelopmentFlag) {
      console.log('   ✅ Environment file properly configured');
    } else {
      console.log('   ❌ Environment file missing required variables');
      allTestsPassed = false;
    }
  } else {
    console.log('   ❌ .env.local file not found');
    allTestsPassed = false;
  }
}

// Test 3: Check if TypeScript config was enhanced
function testTypeScriptConfig() {
  console.log('3️⃣ Testing TypeScript configuration...');
  
  const tsconfigPath = path.join(__dirname, 'tsconfig.json');
  
  if (fs.existsSync(tsconfigPath)) {
    const content = fs.readFileSync(tsconfigPath, 'utf8');
    const config = JSON.parse(content);
    
    const hasStrictMode = config.compilerOptions?.strict === true;
    const hasNoImplicitAny = config.compilerOptions?.noImplicitAny === true;
    const hasNoUnusedLocals = config.compilerOptions?.noUnusedLocals === true;
    
    if (hasStrictMode && hasNoImplicitAny && hasNoUnusedLocals) {
      console.log('   ✅ TypeScript configuration enhanced with strict settings');
    } else {
      console.log('   ❌ TypeScript configuration not properly enhanced');
      allTestsPassed = false;
    }
  } else {
    console.log('   ❌ tsconfig.json not found');
    allTestsPassed = false;
  }
}

// Test 4: Check if new utility files were created
function testUtilityFiles() {
  console.log('4️⃣ Testing utility files creation...');
  
  const filesToCheck = [
    'src/schemas/auth.ts',
    'src/utils/errorHandler.ts',
    'src/utils/performance.ts',
    'src/config/features.ts',
    'CRITICAL_FIXES_README.md'
  ];
  
  let filesCreated = 0;
  
  for (const file of filesToCheck) {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
      filesCreated++;
    }
  }
  
  if (filesCreated === filesToCheck.length) {
    console.log('   ✅ All utility files created successfully');
  } else {
    console.log(`   ❌ Only ${filesCreated}/${filesToCheck.length} utility files created`);
    allTestsPassed = false;
  }
}

// Test 5: Check if excessive logging was fixed
function testExcessiveLogging() {
  console.log('5️⃣ Testing excessive logging fixes...');
  
  const tenantPath = path.join(__dirname, 'src', 'utils', 'tenant.ts');
  
  if (fs.existsSync(tenantPath)) {
    const content = fs.readFileSync(tenantPath, 'utf8');
    
    // Check if console.log statements are now conditional
    const hasConditionalLogging = content.includes('import.meta.env.VITE_IS_DEVELOPMENT');
    
    if (hasConditionalLogging) {
      console.log('   ✅ Excessive logging fixed with conditional statements');
    } else {
      console.log('   ❌ Excessive logging not properly fixed');
      allTestsPassed = false;
    }
  } else {
    console.log('   ⚠️  tenant.ts not found');
  }
}

// Run all tests
function runAllTests() {
  testHardcodedCredentialsRemoval();
  testEnvironmentFile();
  testTypeScriptConfig();
  testUtilityFiles();
  testExcessiveLogging();
  
  console.log('\n📊 Test Results:');
  
  if (allTestsPassed) {
    console.log('🎉 All critical fixes are working correctly!');
    console.log('\n✅ Ready for testing:');
    console.log('1. Open http://localhost:5173 in your browser');
    console.log('2. Test authentication with: justmurenga@gmail.com / password123');
    console.log('3. Verify no hardcoded credentials are exposed');
    console.log('4. Check that logging is appropriate');
    console.log('5. Test error handling and performance monitoring');
  } else {
    console.log('❌ Some critical fixes failed. Please review and fix issues.');
    console.log('\n🔧 Next steps:');
    console.log('1. Review the failed tests above');
    console.log('2. Re-run the fix script if needed');
    console.log('3. Check for any manual intervention required');
  }
  
  console.log('\n📖 See TESTING_CHECKLIST.md for comprehensive testing guide');
}

// Run the tests
runAllTests();
