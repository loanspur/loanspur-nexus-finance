#!/usr/bin/env node

/**
 * Migration Script: Update Existing Loan Accounts to Unified System
 * 
 * This script migrates all existing loan accounts to adopt the new features:
 * - Mifos X-based interest calculations
 * - Unified loan management system
 * - Proper schedule generation
 * - Harmonized loan data
 * - Repayment strategy allocation
 * 
 * Usage: node scripts/migrate-existing-loans.js [--dry-run] [--force]
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

// Import the unified calculation functions
const {
  generateMifosLoanSchedule,
  validateMifosLoanParams,
  convertMifosScheduleToDatabase,
  harmonizeLoanCalculations,
  allocateRepayment
} = require('../src/lib/mifos-interest-calculation.ts');

class LoanMigrationManager {
  constructor() {
    this.stats = {
      total: 0,
      processed: 0,
      success: 0,
      failed: 0,
      skipped: 0,
      errors: []
    };
    this.dryRun = process.argv.includes('--dry-run');
    this.force = process.argv.includes('--force');
  }

  async migrateAllLoans() {
    console.log('🚀 Starting loan migration to unified system...');
    console.log(`Mode: ${this.dryRun ? 'DRY RUN' : 'LIVE'}`);
    console.log(`Force: ${this.force ? 'YES' : 'NO'}`);
    console.log('');

    try {
      // Get all active loans
      const { data: loans, error } = await supabase
        .from('loans')
        .select(`
          *,
          loan_products!inner(
            *,
            loan_portfolio_account_id,
            interest_income_account_id,
            fee_income_account_id,
            penalty_income_account_id,
            fund_source_account_id,
            accounting_type,
            repayment_strategy,
            repayment_frequency,
            interest_calculation_method,
            default_nominal_interest_rate,
            days_in_year_type,
            days_in_month_type,
            amortization_type
          ),
          loan_applications!inner(
            selected_charges,
            disbursement_date,
            first_payment_date
          )
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: true });

      if (error) {
        throw new Error(`Failed to fetch loans: ${error.message}`);
      }

      this.stats.total = loans.length;
      console.log(`📊 Found ${this.stats.total} active loans to migrate`);

      if (this.stats.total === 0) {
        console.log('✅ No loans to migrate');
        return;
      }

      // Process loans in batches
      const batchSize = 10;
      for (let i = 0; i < loans.length; i += batchSize) {
        const batch = loans.slice(i, i + batchSize);
        console.log(`\n🔄 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(loans.length / batchSize)}`);
        
        await Promise.all(batch.map(loan => this.migrateLoan(loan)));
        
        // Add delay between batches to avoid overwhelming the database
        if (i + batchSize < loans.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      this.printSummary();

    } catch (error) {
      console.error('❌ Migration failed:', error.message);
      process.exit(1);
    }
  }

  async migrateLoan(loan) {
    this.stats.processed++;
    
    try {
      console.log(`  📋 Processing loan ${loan.loan_number} (${loan.id})`);

      // Skip if already migrated (check for unified system indicators)
      if (!this.force && await this.isAlreadyMigrated(loan)) {
        console.log(`    ⏭️  Already migrated, skipping`);
        this.stats.skipped++;
        return;
      }

      // Validate loan data
      const validation = this.validateLoanForMigration(loan);
      if (!validation.valid) {
        console.log(`    ❌ Validation failed: ${validation.errors.join(', ')}`);
        this.stats.failed++;
        this.stats.errors.push({
          loanId: loan.id,
          loanNumber: loan.loan_number,
          error: validation.errors.join(', ')
        });
        return;
      }

      // Generate new Mifos X-based schedule
      const newSchedule = await this.generateNewSchedule(loan);
      if (!newSchedule) {
        console.log(`    ❌ Failed to generate new schedule`);
        this.stats.failed++;
        return;
      }

      // Update loan with new unified system data
      await this.updateLoanData(loan, newSchedule);

      // Harmonize loan calculations
      await this.harmonizeLoanData(loan);

      console.log(`    ✅ Successfully migrated`);
      this.stats.success++;

    } catch (error) {
      console.log(`    ❌ Migration failed: ${error.message}`);
      this.stats.failed++;
      this.stats.errors.push({
        loanId: loan.id,
        loanNumber: loan.loan_number,
        error: error.message
      });
    }
  }

  async isAlreadyMigrated(loan) {
    // Check if loan has unified system indicators
    const { data: schedules } = await supabase
      .from('loan_schedules')
      .select('id, created_at')
      .eq('loan_id', loan.id)
      .limit(1);

    if (!schedules || schedules.length === 0) {
      return false; // No schedules, needs migration
    }

    // Check if schedules were created after the unified system deployment
    const unifiedSystemDeploymentDate = new Date('2024-08-25T00:00:00Z');
    const latestScheduleDate = new Date(schedules[0].created_at);
    
    return latestScheduleDate > unifiedSystemDeploymentDate;
  }

  validateLoanForMigration(loan) {
    const errors = [];

    // Check required fields
    if (!loan.principal_amount || loan.principal_amount <= 0) {
      errors.push('Invalid principal amount');
    }

    if (!loan.interest_rate || loan.interest_rate < 0) {
      errors.push('Invalid interest rate');
    }

    if (!loan.term_months || loan.term_months <= 0) {
      errors.push('Invalid term');
    }

    if (!loan.loan_products) {
      errors.push('Missing loan product');
    }

    if (!loan.loan_applications) {
      errors.push('Missing loan application');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  async generateNewSchedule(loan) {
    try {
      const product = loan.loan_products;
      const application = loan.loan_applications;

      // Prepare Mifos X parameters
      const mifosParams = {
        principal: loan.principal_amount,
        annualInterestRate: loan.interest_rate,
        termInPeriods: loan.term_months,
        repaymentFrequency: this.mapRepaymentFrequency(product.repayment_frequency),
        interestType: this.mapInterestType(product.interest_calculation_method),
        amortizationType: this.mapAmortizationType(product.amortization_type),
        daysInYearType: product.days_in_year_type || '365',
        daysInMonthType: product.days_in_month_type || 'actual',
        disbursementDate: new Date(application.disbursement_date || loan.created_at),
        firstPaymentDate: application.first_payment_date ? new Date(application.first_payment_date) : undefined,
        gracePeriodDays: loan.grace_period_days || 0,
        gracePeriodType: loan.grace_period_type || 'none'
      };

      // Validate parameters
      const validation = validateMifosLoanParams(mifosParams);
      if (!validation.valid) {
        throw new Error(`Invalid loan parameters: ${validation.errors.join(', ')}`);
      }

      // Generate new schedule using Mifos X standards
      const mifosSchedule = generateMifosLoanSchedule(mifosParams);
      
      // Convert to database format
      const dbSchedule = convertMifosScheduleToDatabase(mifosSchedule.schedule, loan.id);

      return {
        mifosSchedule,
        dbSchedule,
        mifosParams
      };

    } catch (error) {
      console.error(`    Error generating schedule: ${error.message}`);
      return null;
    }
  }

  async updateLoanData(loan, newSchedule) {
    if (this.dryRun) {
      console.log(`    🔍 DRY RUN: Would update loan ${loan.loan_number}`);
      return;
    }

    try {
      // Update loan with new calculated values
      const { error: loanUpdateError } = await supabase
        .from('loans')
        .update({
          outstanding_balance: newSchedule.mifosSchedule.totalPrincipal,
          total_interest: newSchedule.mifosSchedule.totalInterest,
          total_amount: newSchedule.mifosSchedule.totalAmount,
          periodic_payment: newSchedule.mifosSchedule.periodicPayment,
          updated_at: new Date().toISOString(),
          migration_status: 'completed',
          migration_date: new Date().toISOString()
        })
        .eq('id', loan.id);

      if (loanUpdateError) {
        throw new Error(`Failed to update loan: ${loanUpdateError.message}`);
      }

      // Replace existing schedules with new ones
      await this.replaceLoanSchedules(loan.id, newSchedule.dbSchedule);

      // Update any existing payments to use new allocation strategy
      await this.updateExistingPayments(loan);

    } catch (error) {
      throw new Error(`Failed to update loan data: ${error.message}`);
    }
  }

  async replaceLoanSchedules(loanId, newSchedules) {
    // Delete existing schedules
    const { error: deleteError } = await supabase
      .from('loan_schedules')
      .delete()
      .eq('loan_id', loanId);

    if (deleteError) {
      throw new Error(`Failed to delete existing schedules: ${deleteError.message}`);
    }

    // Insert new schedules
    const { error: insertError } = await supabase
      .from('loan_schedules')
      .insert(newSchedules);

    if (insertError) {
      throw new Error(`Failed to insert new schedules: ${insertError.message}`);
    }
  }

  async updateExistingPayments(loan) {
    // Get existing payments for this loan
    const { data: payments } = await supabase
      .from('loan_payments')
      .select('*')
      .eq('loan_id', loan.id)
      .order('payment_date', { ascending: true });

    if (!payments || payments.length === 0) {
      return;
    }

    console.log(`    💰 Updating ${payments.length} existing payments`);

    // Update each payment with proper allocation strategy
    for (const payment of payments) {
      await this.updatePaymentAllocation(loan, payment);
    }
  }

  async updatePaymentAllocation(loan, payment) {
    try {
      const product = loan.loan_products;
      
      // Get current loan balances at the time of payment
      const { data: schedules } = await supabase
        .from('loan_schedules')
        .select('*')
        .eq('loan_id', loan.id)
        .lte('due_date', payment.payment_date)
        .order('due_date', { ascending: true });

      if (!schedules || schedules.length === 0) {
        return;
      }

      // Calculate outstanding balances
      const outstandingPrincipal = schedules.reduce((sum, s) => 
        sum + (Number(s.outstanding_amount) || 0), 0);

      const loanBalances = {
        outstandingPrincipal,
        unpaidInterest: 0, // Would need historical calculation
        unpaidFees: 0,
        unpaidPenalties: 0
      };

      // Apply repayment strategy
      const strategy = (product.repayment_strategy || 'penalties_fees_interest_principal');
      const allocation = allocateRepayment(payment.payment_amount, loanBalances, strategy);

      // Update payment with new allocation
      if (!this.dryRun) {
        const { error } = await supabase
          .from('loan_payments')
          .update({
            principal_amount: allocation.principal,
            interest_amount: allocation.interest,
            fee_amount: allocation.fees,
            penalty_amount: allocation.penalties,
            updated_at: new Date().toISOString()
          })
          .eq('id', payment.id);

        if (error) {
          console.error(`    Warning: Failed to update payment ${payment.id}: ${error.message}`);
        }
      }

    } catch (error) {
      console.error(`    Warning: Failed to update payment allocation: ${error.message}`);
    }
  }

  async harmonizeLoanData(loan) {
    try {
      // Get updated loan data with schedules
      const { data: updatedLoan } = await supabase
        .from('loans')
        .select(`
          *,
          loan_schedules(*)
        `)
        .eq('id', loan.id)
        .single();

      if (updatedLoan) {
        // Run harmonization
        const harmonizedData = harmonizeLoanCalculations(updatedLoan);

        // Update loan with harmonized data
        if (!this.dryRun) {
          await supabase
            .from('loans')
            .update({
              calculated_outstanding_balance: harmonizedData.calculatedOutstanding,
              corrected_interest_rate: harmonizedData.correctedInterestRate,
              days_in_arrears: harmonizedData.daysInArrears,
              schedule_consistent: harmonizedData.scheduleConsistent,
              total_scheduled_amount: harmonizedData.totalScheduledAmount,
              total_paid_amount: harmonizedData.totalPaidAmount,
              last_payment_date: harmonizedData.lastPaymentDate,
              next_payment_date: harmonizedData.nextPaymentDate,
              harmonized_at: new Date().toISOString()
            })
            .eq('id', loan.id);
        }
      }

    } catch (error) {
      console.error(`    Warning: Failed to harmonize loan data: ${error.message}`);
    }
  }

  mapRepaymentFrequency(frequency) {
    const mapping = {
      'daily': 'daily',
      'weekly': 'weekly',
      'monthly': 'monthly',
      'quarterly': 'monthly', // Map to monthly for now
      'yearly': 'monthly'     // Map to monthly for now
    };
    return mapping[frequency] || 'monthly';
  }

  mapInterestType(interestType) {
    const mapping = {
      'reducing_balance': 'declining_balance',
      'flat_rate': 'flat_rate',
      'declining_balance': 'declining_balance'
    };
    return mapping[interestType] || 'declining_balance';
  }

  mapAmortizationType(amortizationType) {
    const mapping = {
      'equal_installments': 'equal_installments',
      'equal_principal': 'equal_principal'
    };
    return mapping[amortizationType] || 'equal_installments';
  }

  printSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 MIGRATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total loans found: ${this.stats.total}`);
    console.log(`Processed: ${this.stats.processed}`);
    console.log(`Successful: ${this.stats.success}`);
    console.log(`Failed: ${this.stats.failed}`);
    console.log(`Skipped: ${this.stats.skipped}`);
    console.log('');

    if (this.stats.errors.length > 0) {
      console.log('❌ ERRORS:');
      this.stats.errors.forEach(error => {
        console.log(`  - ${error.loanNumber} (${error.loanId}): ${error.error}`);
      });
    }

    if (this.dryRun) {
      console.log('\n🔍 This was a DRY RUN. No changes were made to the database.');
      console.log('Run without --dry-run to apply changes.');
    } else {
      console.log('\n✅ Migration completed!');
    }

    console.log('='.repeat(60));
  }
}

// Main execution
async function main() {
  const migrationManager = new LoanMigrationManager();
  
  try {
    await migrationManager.migrateAllLoans();
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { LoanMigrationManager };
