#!/usr/bin/env node

/**
 * Simple execution script for loan migration
 * This script provides an easy way to run the loan migration with different options
 */

const { execSync } = require('child_process');
const { existsSync } = require('fs');
const path = require('path');

console.log('🔄 Loan System Migration Tool');
console.log('=============================\n');

// Check if the main migration script exists
const migrationScriptPath = path.join(process.cwd(), 'scripts', 'migrate-existing-loans.js');
if (!existsSync(migrationScriptPath)) {
  console.error('❌ Migration script not found:', migrationScriptPath);
  process.exit(1);
}

// Get command from arguments
const command = process.argv[2] || 'help';

switch (command) {
  case 'validate':
    console.log('🔍 Validating migration prerequisites...\n');
    try {
      execSync('node scripts/migrate-existing-loans.js validate', { stdio: 'inherit' });
      console.log('\n✅ Validation completed successfully!');
    } catch (error) {
      console.error('\n❌ Validation failed!');
      process.exit(1);
    }
    break;

  case 'dry-run':
    console.log('🔍 Running migration in dry-run mode (no changes will be made)...\n');
    try {
      execSync('node scripts/migrate-existing-loans.js dry-run', { stdio: 'inherit' });
      console.log('\n✅ Dry-run completed successfully!');
    } catch (error) {
      console.error('\n❌ Dry-run failed!');
      process.exit(1);
    }
    break;

  case 'migrate':
    console.log('🚀 Running full migration...\n');
    console.log('⚠️  This will update all existing loans in the database.');
    console.log('⚠️  Make sure you have a backup before proceeding.\n');
    
    // Ask for confirmation
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    rl.question('Do you want to continue? (yes/no): ', (answer) => {
      rl.close();
      
      if (answer.toLowerCase() !== 'yes') {
        console.log('❌ Migration cancelled by user.');
        process.exit(0);
      }
      
      try {
        execSync('node scripts/migrate-existing-loans.js migrate', { stdio: 'inherit' });
        console.log('\n✅ Migration completed successfully!');
      } catch (error) {
        console.error('\n❌ Migration failed!');
        process.exit(1);
      }
    });
    break;

  case 'help':
  default:
    console.log('Usage:');
    console.log('  node scripts/run-loan-migration.js validate  - Validate prerequisites');
    console.log('  node scripts/run-loan-migration.js dry-run   - Preview changes');
    console.log('  node scripts/run-loan-migration.js migrate   - Run full migration');
    console.log('  node scripts/run-loan-migration.js help      - Show this help');
    console.log('\nExamples:');
    console.log('  node scripts/run-loan-migration.js validate');
    console.log('  node scripts/run-loan-migration.js dry-run');
    console.log('  node scripts/run-loan-migration.js migrate');
    console.log('\nWhat each command does:');
    console.log('  validate  - Check if database has required columns and loan data');
    console.log('  dry-run   - Show what changes would be made without applying them');
    console.log('  migrate   - Actually update all existing loans with new features');
    break;
}
