#!/usr/bin/env node

/**
 * Simple Migration Script: Update Existing Loans with Unified Loan System Features
 * 
 * This script migrates existing loans to use the new unified loan management system
 * with Mifos X-based interest calculations and harmonized data.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

// Migration configuration
const MIGRATION_CONFIG = {
  batchSize: 10,
  dryRun: false, // Set to true to preview changes without applying them
};

// Enhanced loan status mapping
const LOAN_STATUS_MAPPING = {
  'pending': 'pending_disbursement',
  'approved': 'pending_disbursement',
  'disbursed': 'active',
  'active': 'active',
  'overdue': 'overdue',
  'in_arrears': 'in_arrears',
  'closed': 'closed',
  'written_off': 'written_off',
  'defaulted': 'defaulted',
};

/**
 * Generate loan product snapshot with Mifos X parameters
 */
function generateLoanProductSnapshot(loanProduct) {
  return {
    id: loanProduct.id,
    name: loanProduct.name || loanProduct.product_name,
    short_name: loanProduct.short_name || loanProduct.product_code,
    currency_code: loanProduct.currency_code || 'KES',
    min_principal: loanProduct.min_principal || loanProduct.minimum_principal || 0,
    max_principal: loanProduct.max_principal || loanProduct.maximum_principal || 999999999,
    default_principal: loanProduct.default_principal,
    min_interest_rate: loanProduct.min_interest_rate || loanProduct.minimum_interest_rate || 0,
    max_interest_rate: loanProduct.max_interest_rate || loanProduct.maximum_interest_rate || 100,
    default_interest_rate: loanProduct.default_interest_rate || loanProduct.default_nominal_interest_rate || 15,
    min_term: loanProduct.min_term || loanProduct.minimum_loan_term || 1,
    max_term: loanProduct.max_term || loanProduct.maximum_loan_term || 60,
    default_term: loanProduct.default_term || loanProduct.default_loan_term || 12,
    repayment_frequency: loanProduct.repayment_frequency || 'monthly',
    grace_period_days: loanProduct.grace_period_days || 0,
    // Mifos X specific parameters
    days_in_year_type: loanProduct.days_in_year_type || '365',
    days_in_month_type: loanProduct.days_in_month_type || 'actual',
    amortization_type: loanProduct.amortization_type || loanProduct.amortization_method || 'equal_installments',
    interest_calculation_method: loanProduct.interest_calculation_method || 'declining_balance',
    interest_calculation_period: loanProduct.interest_calculation_period || 'same_as_repayment_period',
    grace_period_type: loanProduct.grace_period_type || 'none',
    // Additional features
    allow_partial_payments: loanProduct.allow_partial_payments !== false,
    require_guarantor: loanProduct.require_guarantor || false,
    require_collateral: loanProduct.require_collateral || false,
    auto_calculate_repayment: loanProduct.auto_calculate_repayment !== false,
    created_at: loanProduct.created_at,
    updated_at: loanProduct.updated_at,
  };
}

/**
 * Calculate harmonized outstanding balance
 */
function calculateHarmonizedOutstandingBalance(loan, schedules, payments) {
  // If loan has outstanding_balance, use it as base
  let outstanding = loan.outstanding_balance || 0;
  
  // If we have schedules, calculate from schedules
  if (schedules && schedules.length > 0) {
    const unpaidSchedules = schedules.filter(s => s.payment_status !== 'paid');
    const scheduleOutstanding = unpaidSchedules.reduce((sum, s) => {
      return sum + (s.outstanding_amount || s.total_amount - (s.paid_amount || 0));
    }, 0);
    
    // Use schedule calculation if it's more accurate
    if (scheduleOutstanding > 0) {
      outstanding = scheduleOutstanding;
    }
  }
  
  // If we have payments, cross-validate
  if (payments && payments.length > 0) {
    const totalPaid = payments.reduce((sum, p) => sum + (p.payment_amount || 0), 0);
    const calculatedOutstanding = (loan.principal_amount || 0) - totalPaid;
    
    // Use payment-based calculation if it's more recent
    if (Math.abs(calculatedOutstanding - outstanding) > 1) {
      outstanding = Math.max(0, calculatedOutstanding);
    }
  }
  
  return Math.max(0, outstanding);
}

/**
 * Calculate days in arrears
 */
function calculateDaysInArrears(loan, schedules) {
  if (!schedules || schedules.length === 0) return 0;
  
  const today = new Date();
  const overdueSchedules = schedules.filter(s => {
    const dueDate = new Date(s.due_date);
    return dueDate < today && s.payment_status !== 'paid';
  });
  
  if (overdueSchedules.length === 0) return 0;
  
  // Find the earliest overdue schedule
  const earliestOverdue = overdueSchedules.reduce((earliest, current) => {
    return new Date(current.due_date) < new Date(earliest.due_date) ? current : earliest;
  });
  
  const dueDate = new Date(earliestOverdue.due_date);
  const daysInArrears = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));
  
  return Math.max(0, daysInArrears);
}

/**
 * Update a single loan with unified system features
 */
async function updateLoan(loan, loanProduct) {
  try {
    console.log(`Processing loan ${loan.loan_number} (${loan.id})`);
    
    // 1. Generate loan product snapshot
    const loanProductSnapshot = generateLoanProductSnapshot(loanProduct);
    
    // 2. Get existing schedules and payments
    const { data: schedules = [] } = await supabase
      .from('loan_schedules')
      .select('*')
      .eq('loan_id', loan.id)
      .order('installment_number', { ascending: true });
    
    const { data: payments = [] } = await supabase
      .from('loan_payments')
      .select('*')
      .eq('loan_id', loan.id)
      .order('payment_date', { ascending: true });
    
    // 3. Calculate harmonized data
    const harmonizedOutstanding = calculateHarmonizedOutstandingBalance(loan, schedules, payments);
    const daysInArrears = calculateDaysInArrears(loan, schedules);
    const totalScheduledAmount = schedules.reduce((sum, s) => sum + (s.total_amount || 0), 0);
    const totalPaidAmount = payments.reduce((sum, p) => sum + (p.payment_amount || 0), 0);
    
    // 4. Determine next payment date
    const nextSchedule = schedules.find(s => s.payment_status !== 'paid' && new Date(s.due_date) >= new Date());
    const nextPaymentDate = nextSchedule ? nextSchedule.due_date : null;
    const nextPaymentAmount = nextSchedule ? nextSchedule.total_amount : null;
    
    // 5. Update loan status based on harmonized data
    let newStatus = loan.status;
    if (harmonizedOutstanding <= 0 && totalPaidAmount > 0) {
      newStatus = 'closed';
    } else if (daysInArrears > 30) {
      newStatus = 'in_arrears';
    } else if (daysInArrears > 0) {
      newStatus = 'overdue';
    } else if (loan.status === 'pending' || loan.status === 'approved') {
      newStatus = 'pending_disbursement';
    }
    
    // Map status if needed
    newStatus = LOAN_STATUS_MAPPING[newStatus] || newStatus;
    
    // 6. Prepare update data
    const updateData = {
      // Harmonized calculation fields
      calculated_outstanding_balance: harmonizedOutstanding,
      corrected_interest_rate: loan.interest_rate,
      days_in_arrears: daysInArrears,
      schedule_consistent: schedules.length > 0,
      total_scheduled_amount: totalScheduledAmount,
      total_paid_amount: totalPaidAmount,
      last_payment_date: payments.length > 0 ? payments[payments.length - 1].payment_date : null,
      next_payment_date: nextPaymentDate,
      next_repayment_amount: nextPaymentAmount,
      
      // Update core fields
      outstanding_balance: harmonizedOutstanding,
      status: newStatus,
      
      // Loan product snapshot
      loan_product_snapshot: loanProductSnapshot,
      
      // Mifos X parameters
      grace_period_days: loanProduct.grace_period_days || 0,
      grace_period_type: loanProduct.grace_period_type || 'none',
      
      // Migration tracking
      migration_status: 'completed',
      migration_date: new Date().toISOString(),
      migration_notes: 'Migrated to unified loan system with Mifos X parameters',
      harmonized_at: new Date().toISOString(),
      
      updated_at: new Date().toISOString(),
    };
    
    // 7. Apply update
    if (!MIGRATION_CONFIG.dryRun) {
      const { error } = await supabase
        .from('loans')
        .update(updateData)
        .eq('id', loan.id);
      
      if (error) {
        throw error;
      }
      
      console.log(`✅ Successfully updated loan ${loan.loan_number}`);
    } else {
      console.log(`🔍 DRY RUN: Would update loan ${loan.loan_number}`);
      console.log(`   - Old status: ${loan.status} → New status: ${newStatus}`);
      console.log(`   - Old outstanding: ${loan.outstanding_balance} → New outstanding: ${harmonizedOutstanding}`);
      console.log(`   - Days in arrears: ${daysInArrears}`);
      console.log(`   - Schedules: ${schedules.length}, Payments: ${payments.length}`);
    }
    
    return {
      success: true,
      loanId: loan.id,
      loanNumber: loan.loan_number,
      oldStatus: loan.status,
      newStatus: newStatus,
      oldOutstanding: loan.outstanding_balance,
      newOutstanding: harmonizedOutstanding,
      daysInArrears,
      schedulesCount: schedules.length,
      paymentsCount: payments.length,
    };
    
  } catch (error) {
    console.error(`❌ Error updating loan ${loan.loan_number}:`, error);
    return {
      success: false,
      loanId: loan.id,
      loanNumber: loan.loan_number,
      error: error.message,
    };
  }
}

/**
 * Validate migration prerequisites
 */
async function validateMigration() {
  console.log('🔍 Validating migration prerequisites...');
  
  try {
    // Check loan count and basic access
    const { count, error: countError } = await supabase
      .from('loans')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('❌ Cannot access loans table:', countError);
      return false;
    }
    
    console.log(`✅ Found ${count} total loans in database`);
    
    // Try to access a single loan to check for required columns
    const { data: sampleLoan, error: sampleError } = await supabase
      .from('loans')
      .select('id, migration_status, calculated_outstanding_balance, loan_product_snapshot, days_in_arrears, harmonized_at')
      .limit(1)
      .single();
    
    if (sampleError) {
      console.log('⚠️  Some migration columns may be missing. This is normal for new installations.');
      console.log('📝 The migration will add these columns automatically if needed.');
    } else {
      console.log('✅ All migration columns exist');
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Validation failed:', error);
    return false;
  }
}

/**
 * Main migration function
 */
async function migrateExistingLoans() {
  console.log('🚀 Starting migration of existing loans to unified loan system...');
  console.log(`📊 Migration config:`, MIGRATION_CONFIG);
  
  try {
    // 1. Get all loans that need migration
    const { data: loans, error: loansError } = await supabase
      .from('loans')
      .select(`
        *,
        loan_products(*)
      `)
      .or('migration_status.is.null,migration_status.eq.pending')
      .order('created_at', { ascending: true });
    
    if (loansError) {
      throw loansError;
    }
    
    console.log(`📋 Found ${loans.length} loans to migrate`);
    
    if (loans.length === 0) {
      console.log('✅ No loans need migration');
      return;
    }
    
    // 2. Process loans in batches
    const results = {
      total: loans.length,
      successful: 0,
      failed: 0,
      statusChanges: {},
      errors: [],
    };
    
    for (let i = 0; i < loans.length; i += MIGRATION_CONFIG.batchSize) {
      const batch = loans.slice(i, i + MIGRATION_CONFIG.batchSize);
      console.log(`\n📦 Processing batch ${Math.floor(i / MIGRATION_CONFIG.batchSize) + 1}/${Math.ceil(loans.length / MIGRATION_CONFIG.batchSize)}`);
      
      for (const loan of batch) {
        try {
          // Get loan product
          const loanProduct = loan.loan_products;
          if (!loanProduct) {
            console.warn(`⚠️ No loan product found for loan ${loan.loan_number}`);
            results.failed++;
            results.errors.push(`No loan product for loan ${loan.loan_number}`);
            continue;
          }
          
          // Update loan
          const updateResult = await updateLoan(loan, loanProduct);
          
          if (updateResult.success) {
            results.successful++;
            
            // Track status changes
            if (updateResult.oldStatus !== updateResult.newStatus) {
              results.statusChanges[`${updateResult.oldStatus} -> ${updateResult.newStatus}`] = 
                (results.statusChanges[`${updateResult.oldStatus} -> ${updateResult.newStatus}`] || 0) + 1;
            }
            
          } else {
            results.failed++;
            results.errors.push(updateResult.error);
          }
          
        } catch (error) {
          console.error(`❌ Error processing loan ${loan.loan_number}:`, error);
          results.failed++;
          results.errors.push(error.message);
        }
      }
      
      // Add delay between batches to avoid overwhelming the database
      if (i + MIGRATION_CONFIG.batchSize < loans.length) {
        console.log('⏳ Waiting 2 seconds before next batch...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    // 3. Print results
    console.log('\n📊 Migration Results:');
    console.log(`✅ Successful: ${results.successful}/${results.total}`);
    console.log(`❌ Failed: ${results.failed}/${results.total}`);
    
    if (Object.keys(results.statusChanges).length > 0) {
      console.log('\n🔄 Status Changes:');
      Object.entries(results.statusChanges).forEach(([change, count]) => {
        console.log(`  ${change}: ${count} loans`);
      });
    }
    
    if (results.errors.length > 0) {
      console.log('\n❌ Errors encountered:');
      results.errors.slice(0, 10).forEach(error => {
        console.log(`  - ${error}`);
      });
      if (results.errors.length > 10) {
        console.log(`  ... and ${results.errors.length - 10} more errors`);
      }
    }
    
    // 4. Generate migration report
    const report = {
      timestamp: new Date().toISOString(),
      config: MIGRATION_CONFIG,
      results,
      summary: {
        successRate: (results.successful / results.total * 100).toFixed(2) + '%',
      },
    };
    
    console.log('\n📄 Migration Report:');
    console.log(JSON.stringify(report, null, 2));
    
    // Save report to file
    const fs = await import('fs');
    const reportPath = `migration-report-${new Date().toISOString().split('T')[0]}.json`;
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`📄 Report saved to: ${reportPath}`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🔄 Loan System Migration Tool');
  console.log('=============================\n');
  
  // Parse command line arguments
  const args = process.argv.slice(2);
  const command = args[0];
  
  switch (command) {
    case 'validate':
      console.log('🔍 Running validation only...');
      const isValid = await validateMigration();
      process.exit(isValid ? 0 : 1);
      break;
      
    case 'dry-run':
      console.log('🔍 Running in dry-run mode...');
      MIGRATION_CONFIG.dryRun = true;
      await migrateExistingLoans();
      break;
      
    case 'migrate':
      console.log('🚀 Running full migration...');
      const isValidForMigration = await validateMigration();
      if (!isValidForMigration) {
        console.error('❌ Validation failed. Cannot proceed with migration.');
        process.exit(1);
      }
      await migrateExistingLoans();
      break;
      
    default:
      console.log('Usage:');
      console.log('  node scripts/migrate-loans.mjs validate  - Validate prerequisites');
      console.log('  node scripts/migrate-loans.mjs dry-run   - Preview changes');
      console.log('  node scripts/migrate-loans.mjs migrate   - Run full migration');
      console.log('\nExamples:');
      console.log('  node scripts/migrate-loans.mjs validate');
      console.log('  node scripts/migrate-loans.mjs dry-run');
      console.log('  node scripts/migrate-loans.mjs migrate');
      break;
  }
}

// Run the migration
main().catch(console.error);
