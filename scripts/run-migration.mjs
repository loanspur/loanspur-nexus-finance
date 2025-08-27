#!/usr/bin/env node

/**
 * Simple execution script for loan migration
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔄 Loan System Migration Tool');
console.log('=============================\n');

// Check if the main migration script exists
const migrationScriptPath = join(__dirname, 'migrate-loans.mjs');
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
      execSync('node scripts/migrate-loans.mjs validate', { stdio: 'inherit' });
      console.log('\n✅ Validation completed successfully!');
    } catch (error) {
      console.error('\n❌ Validation failed!');
      process.exit(1);
    }
    break;

  case 'dry-run':
    console.log('🔍 Running migration in dry-run mode (no changes will be made)...\n');
    try {
      execSync('node scripts/migrate-loans.mjs dry-run', { stdio: 'inherit' });
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
    const readline = await import('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const answer = await new Promise((resolve) => {
      rl.question('Do you want to continue? (yes/no): ', resolve);
    });
    rl.close();
    
    if (answer.toLowerCase() !== 'yes') {
      console.log('❌ Migration cancelled by user.');
      process.exit(0);
    }
    
    try {
      execSync('node scripts/migrate-loans.mjs migrate', { stdio: 'inherit' });
      console.log('\n✅ Migration completed successfully!');
    } catch (error) {
      console.error('\n❌ Migration failed!');
      process.exit(1);
    }
    break;

  case 'help':
  default:
    console.log('Usage:');
    console.log('  node scripts/run-migration.mjs validate  - Validate prerequisites');
    console.log('  node scripts/run-migration.mjs dry-run   - Preview changes');
    console.log('  node scripts/run-migration.mjs migrate   - Run full migration');
    console.log('  node scripts/run-migration.mjs help      - Show this help');
    console.log('\nExamples:');
    console.log('  node scripts/run-migration.mjs validate');
    console.log('  node scripts/run-migration.mjs dry-run');
    console.log('  node scripts/run-migration.mjs migrate');
    console.log('\nWhat each command does:');
    console.log('  validate  - Check if database has required columns and loan data');
    console.log('  dry-run   - Show what changes would be made without applying them');
    console.log('  migrate   - Actually update all existing loans with new features');
    break;
}
