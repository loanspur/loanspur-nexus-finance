#!/usr/bin/env node

/**
 * Migration Verification Script
 * 
 * This script verifies the status of loan migrations and validates
 * that the unified loan management system is working correctly.
 * 
 * Usage: node scripts/verify-migration.js
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

class MigrationVerifier {
  constructor() {
    this.stats = {
      total: 0,
      migrated: 0,
      pending: 0,
      failed: 0,
      inconsistent: 0,
      issues: []
    };
  }

  async verifyMigration() {
    console.log('🔍 Verifying loan migration status...\n');

    try {
      // Get migration statistics
      await this.getMigrationStats();
      
      // Check for data inconsistencies
      await this.checkDataConsistency();
      
      // Validate schedule calculations
      await this.validateSchedules();
      
      // Check payment allocations
      await this.checkPaymentAllocations();
      
      // Verify harmonized data
      await this.verifyHarmonizedData();
      
      this.printSummary();

    } catch (error) {
      console.error('❌ Verification failed:', error.message);
      process.exit(1);
    }
  }

  async getMigrationStats() {
    console.log('📊 Migration Statistics:');
    console.log('='.repeat(40));

    const { data: stats, error } = await supabase
      .from('loans')
      .select('migration_status')
      .not('migration_status', 'is', null);

    if (error) {
      throw new Error(`Failed to get migration stats: ${error.message}`);
    }

    this.stats.total = stats.length;
    
    const statusCounts = stats.reduce((acc, loan) => {
      acc[loan.migration_status] = (acc[loan.migration_status] || 0) + 1;
      return acc;
    }, {});

    this.stats.migrated = statusCounts.completed || 0;
    this.stats.pending = statusCounts.pending || 0;
    this.stats.failed = statusCounts.failed || 0;

    console.log(`Total loans: ${this.stats.total}`);
    console.log(`Migrated: ${this.stats.migrated}`);
    console.log(`Pending: ${this.stats.pending}`);
    console.log(`Failed: ${this.stats.failed}`);
    console.log('');
  }

  async checkDataConsistency() {
    console.log('🔍 Checking Data Consistency:');
    console.log('='.repeat(40));

    // Check for schedule inconsistencies
    const { data: inconsistent, error } = await supabase
      .from('loans')
      .select('loan_number, outstanding_balance, calculated_outstanding_balance, schedule_consistent')
      .eq('schedule_consistent', false);

    if (error) {
      throw new Error(`Failed to check consistency: ${error.message}`);
    }

    this.stats.inconsistent = inconsistent.length;

    if (inconsistent.length > 0) {
      console.log(`❌ Found ${inconsistent.length} loans with inconsistent schedules:`);
      inconsistent.forEach(loan => {
        const difference = Math.abs(loan.outstanding_balance - loan.calculated_outstanding_balance);
        console.log(`  - ${loan.loan_number}: Difference = ${difference.toFixed(2)}`);
        this.stats.issues.push({
          type: 'inconsistent_schedule',
          loanNumber: loan.loan_number,
          difference: difference
        });
      });
    } else {
      console.log('✅ All loan schedules are consistent');
    }

    // Check for loans without migration status
    const { data: unmigrated, error: unmigratedError } = await supabase
      .from('loans')
      .select('loan_number')
      .is('migration_status', null);

    if (unmigratedError) {
      throw new Error(`Failed to check unmigrated loans: ${unmigratedError.message}`);
    }

    if (unmigrated.length > 0) {
      console.log(`⚠️  Found ${unmigrated.length} loans without migration status`);
      this.stats.issues.push({
        type: 'no_migration_status',
        count: unmigrated.length
      });
    }

    console.log('');
  }

  async validateSchedules() {
    console.log('📅 Validating Loan Schedules:');
    console.log('='.repeat(40));

    // Check for loans without schedules
    const { data: loansWithoutSchedules, error } = await supabase
      .from('loans')
      .select(`
        loan_number,
        loan_schedules(id)
      `)
      .eq('status', 'active');

    if (error) {
      throw new Error(`Failed to validate schedules: ${error.message}`);
    }

    const missingSchedules = loansWithoutSchedules.filter(loan => 
      !loan.loan_schedules || loan.loan_schedules.length === 0
    );

    if (missingSchedules.length > 0) {
      console.log(`❌ Found ${missingSchedules.length} active loans without schedules:`);
      missingSchedules.forEach(loan => {
        console.log(`  - ${loan.loan_number}`);
        this.stats.issues.push({
          type: 'missing_schedules',
          loanNumber: loan.loan_number
        });
      });
    } else {
      console.log('✅ All active loans have schedules');
    }

    // Check for legacy calculation methods
    const { data: legacySchedules, error: legacyError } = await supabase
      .from('loan_schedules')
      .select('calculation_method')
      .eq('calculation_method', 'legacy');

    if (legacyError) {
      throw new Error(`Failed to check legacy schedules: ${legacyError.message}`);
    }

    if (legacySchedules.length > 0) {
      console.log(`⚠️  Found ${legacySchedules.length} schedules using legacy calculation method`);
      this.stats.issues.push({
        type: 'legacy_calculations',
        count: legacySchedules.length
      });
    } else {
      console.log('✅ All schedules use Mifos X calculations');
    }

    console.log('');
  }

  async checkPaymentAllocations() {
    console.log('💰 Checking Payment Allocations:');
    console.log('='.repeat(40));

    // Check for payments with incorrect allocations
    const { data: payments, error } = await supabase
      .from('loan_payments')
      .select(`
        id,
        loan_id,
        payment_amount,
        principal_amount,
        interest_amount,
        fee_amount,
        penalty_amount,
        loans(loan_number)
      `);

    if (error) {
      throw new Error(`Failed to check payments: ${error.message}`);
    }

    const incorrectAllocations = payments.filter(payment => {
      const total = (payment.principal_amount || 0) + 
                   (payment.interest_amount || 0) + 
                   (payment.fee_amount || 0) + 
                   (payment.penalty_amount || 0);
      return Math.abs(total - payment.payment_amount) > 0.01;
    });

    if (incorrectAllocations.length > 0) {
      console.log(`❌ Found ${incorrectAllocations.length} payments with incorrect allocations:`);
      incorrectAllocations.slice(0, 5).forEach(payment => {
        const total = (payment.principal_amount || 0) + 
                     (payment.interest_amount || 0) + 
                     (payment.fee_amount || 0) + 
                     (payment.penalty_amount || 0);
        const difference = Math.abs(total - payment.payment_amount);
        console.log(`  - Payment ${payment.id} (${payment.loans?.loan_number}): Difference = ${difference.toFixed(2)}`);
        this.stats.issues.push({
          type: 'incorrect_allocation',
          paymentId: payment.id,
          loanNumber: payment.loans?.loan_number,
          difference: difference
        });
      });
      
      if (incorrectAllocations.length > 5) {
        console.log(`  ... and ${incorrectAllocations.length - 5} more`);
      }
    } else {
      console.log('✅ All payment allocations are correct');
    }

    console.log('');
  }

  async verifyHarmonizedData() {
    console.log('🔄 Verifying Harmonized Data:');
    console.log('='.repeat(40));

    // Check for loans without harmonized data
    const { data: unharmonized, error } = await supabase
      .from('loans')
      .select('loan_number, harmonized_at')
      .is('harmonized_at', null)
      .eq('status', 'active');

    if (error) {
      throw new Error(`Failed to check harmonized data: ${error.message}`);
    }

    if (unharmonized.length > 0) {
      console.log(`⚠️  Found ${unharmonized.length} active loans without harmonized data`);
      this.stats.issues.push({
        type: 'unharmonized_data',
        count: unharmonized.length
      });
    } else {
      console.log('✅ All active loans have harmonized data');
    }

    // Check for loans in arrears
    const { data: arrears, error: arrearsError } = await supabase
      .from('loans')
      .select('loan_number, days_in_arrears')
      .gt('days_in_arrears', 0)
      .order('days_in_arrears', { ascending: false });

    if (arrearsError) {
      throw new Error(`Failed to check arrears: ${arrearsError.message}`);
    }

    if (arrears.length > 0) {
      console.log(`📅 Found ${arrears.length} loans in arrears:`);
      arrears.slice(0, 5).forEach(loan => {
        console.log(`  - ${loan.loan_number}: ${loan.days_in_arrears} days`);
      });
      
      if (arrears.length > 5) {
        console.log(`  ... and ${arrears.length - 5} more`);
      }
    } else {
      console.log('✅ No loans are currently in arrears');
    }

    console.log('');
  }

  printSummary() {
    console.log('📋 VERIFICATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total loans: ${this.stats.total}`);
    console.log(`Successfully migrated: ${this.stats.migrated}`);
    console.log(`Pending migration: ${this.stats.pending}`);
    console.log(`Failed migration: ${this.stats.failed}`);
    console.log(`Inconsistent schedules: ${this.stats.inconsistent}`);
    console.log(`Total issues found: ${this.stats.issues.length}`);
    console.log('');

    if (this.stats.issues.length > 0) {
      console.log('❌ ISSUES FOUND:');
      const issueTypes = this.stats.issues.reduce((acc, issue) => {
        acc[issue.type] = (acc[issue.type] || 0) + 1;
        return acc;
      }, {});

      Object.entries(issueTypes).forEach(([type, count]) => {
        console.log(`  - ${type}: ${count}`);
      });

      console.log('\n💡 RECOMMENDATIONS:');
      if (this.stats.pending > 0) {
        console.log('  • Run migration for pending loans');
      }
      if (this.stats.failed > 0) {
        console.log('  • Review and fix failed migrations');
      }
      if (this.stats.inconsistent > 0) {
        console.log('  • Re-run migration for inconsistent loans');
      }
      if (issueTypes.incorrect_allocation) {
        console.log('  • Review payment allocation strategies');
      }
    } else {
      console.log('✅ All verifications passed! Migration is complete and successful.');
    }

    console.log('='.repeat(60));
  }
}

// Main execution
async function main() {
  const verifier = new MigrationVerifier();
  
  try {
    await verifier.verifyMigration();
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { MigrationVerifier };
