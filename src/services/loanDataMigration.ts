import { supabase } from '@/integrations/supabase/client';
import { useLoanTransactionManager } from '@/hooks/useLoanTransactionManager';

interface LoanMigrationData {
  id: string;
  loan_number: string;
  status: string;
  principal_amount: number;
  outstanding_balance: number;
  disbursement_date?: string;
  client_id: string;
  loan_product_id: string;
  tenant_id: string;
}

interface PaymentMigrationData {
  id: string;
  loan_id: string;
  payment_amount: number;
  payment_date: string;
  payment_method: string;
  principal_amount?: number;
  interest_amount?: number;
  fee_amount?: number;
  penalty_amount?: number;
}

export class LoanDataMigrationService {
  
  /**
   * Sync existing loans with unified transaction management system
   */
  static async syncExistingLoans(tenantId: string): Promise<{
    migrated: number;
    errors: string[];
    summary: {
      loansProcessed: number;
      paymentsProcessed: number;
      schedulesSynced: number;
      journalEntriesCreated: number;
    };
  }> {
    const errors: string[] = [];
    let migrated = 0;
    const summary = {
      loansProcessed: 0,
      paymentsProcessed: 0,
      schedulesSynced: 0,
      journalEntriesCreated: 0
    };

    try {
      // 1. Get all existing loans for the tenant
      const { data: existingLoans, error: loansError } = await supabase
        .from('loans')
        .select(`
          *,
          loan_products!loans_loan_product_id_fkey(
            name,
            accounting_type,
            loan_portfolio_account_id,
            fund_source_account_id,
            interest_income_account_id,
            fee_income_account_id
          ),
          clients!loans_client_id_fkey(office_id)
        `)
        .eq('tenant_id', tenantId)
        .neq('status', 'closed');

      if (loansError) {
        errors.push(`Failed to fetch loans: ${loansError.message}`);
        return { migrated, errors, summary };
      }

      // 2. Process each loan
      for (const loan of existingLoans || []) {
        try {
          summary.loansProcessed++;

          // 3. Get existing transactions for this loan
          const { data: existingTransactions, error: transError } = await supabase
            .from('transactions')
            .select('*')
            .eq('loan_id', loan.id)
            .order('transaction_date', { ascending: true });

          if (transError) {
            errors.push(`Failed to fetch transactions for loan ${loan.loan_number}: ${transError.message}`);
            continue;
          }

          // 4. Get existing loan payments
          const { data: existingPayments, error: paymentsError } = await supabase
            .from('loan_payments')
            .select('*')
            .eq('loan_id', loan.id)
            .order('payment_date', { ascending: true });

          if (paymentsError) {
            errors.push(`Failed to fetch payments for loan ${loan.loan_number}: ${paymentsError.message}`);
            continue;
          }

          // 5. Sync loan schedules and recalculate outstanding balances
          await this.syncLoanSchedules(loan.id, existingPayments || []);
          summary.schedulesSynced++;

          // 6. Create missing journal entries for accounting
          if (loan.loan_products?.accounting_type !== 'none') {
            await this.createMissingJournalEntries(loan, existingPayments || []);
            summary.journalEntriesCreated++;
          }

          // 7. Sync transaction records to ensure consistency
          await this.syncTransactionRecords(loan, existingPayments || []);
          summary.paymentsProcessed += (existingPayments || []).length;

          // 8. Update loan status and balances
          await this.updateLoanStatusAndBalance(loan.id);

          migrated++;
        } catch (error: any) {
          errors.push(`Error processing loan ${loan.loan_number}: ${error.message}`);
        }
      }

      return { migrated, errors, summary };
    } catch (error: any) {
      errors.push(`Migration failed: ${error.message}`);
      return { migrated, errors, summary };
    }
  }

  /**
   * Sync loan schedules with actual payments
   */
  private static async syncLoanSchedules(loanId: string, payments: PaymentMigrationData[]) {
    // Get current schedules
    const { data: schedules, error } = await supabase
      .from('loan_schedules')
      .select('*')
      .eq('loan_id', loanId)
      .order('installment_number', { ascending: true });

    if (error || !schedules) return;

    // Calculate cumulative payments and update schedules
    let totalPaid = 0;
    
    for (const payment of payments) {
      totalPaid += payment.payment_amount;
    }

    // Update schedule payment status based on actual payments
    let remainingPayment = totalPaid;
    
    for (const schedule of schedules) {
      const scheduleAmount = Number(schedule.total_amount);
      const paidForThisSchedule = Math.min(remainingPayment, scheduleAmount);
      const outstanding = Math.max(0, scheduleAmount - paidForThisSchedule);
      
      let paymentStatus: 'paid' | 'partial' | 'unpaid' = 'unpaid';
      if (paidForThisSchedule >= scheduleAmount) {
        paymentStatus = 'paid';
      } else if (paidForThisSchedule > 0) {
        paymentStatus = 'partial';
      }

      await supabase
        .from('loan_schedules')
        .update({
          paid_amount: paidForThisSchedule,
          outstanding_amount: outstanding,
          payment_status: paymentStatus
        })
        .eq('id', schedule.id);

      remainingPayment -= paidForThisSchedule;
      if (remainingPayment <= 0) break;
    }
  }

  /**
   * Create missing journal entries for accounting integration
   */
  private static async createMissingJournalEntries(loan: any, payments: PaymentMigrationData[]) {
    const loanProduct = loan.loan_products;
    
    if (!loanProduct?.accounting_type || loanProduct.accounting_type === 'none') {
      return;
    }

    // Check if disbursement journal entry exists
    const { data: existingDisbursementEntry } = await supabase
      .from('journal_entries')
      .select('id')
      .eq('reference_type', 'loan_disbursement')
      .eq('reference_id', loan.id)
      .single();

    // Create disbursement journal entry if missing
    if (!existingDisbursementEntry && loan.status !== 'pending') {
      await this.createDisbursementJournalEntry(loan, loanProduct);
    }

    // Create journal entries for payments that don't have them
    for (const payment of payments) {
      const { data: existingPaymentEntry } = await supabase
        .from('journal_entries')
        .select('id')
        .eq('reference_type', 'loan_payment')
        .ilike('description', `%${payment.id}%`)
        .single();

      if (!existingPaymentEntry) {
        await this.createPaymentJournalEntry(loan, payment, loanProduct);
      }
    }
  }

  /**
   * Create disbursement journal entry
   */
  private static async createDisbursementJournalEntry(loan: any, loanProduct: any) {
    const entryNumber = `JE-${new Date().getFullYear()}-${Date.now()}`;
    
    const { data: journalEntry, error: entryError } = await supabase
      .from('journal_entries')
      .insert({
        tenant_id: loan.tenant_id,
        entry_number: entryNumber,
        transaction_date: loan.disbursement_date || loan.created_at,
        description: `Loan disbursement - ${loan.loan_number}`,
        reference_type: 'loan_disbursement',
        reference_id: loan.id,
        status: 'posted',
        total_amount: loan.principal_amount,
        office_id: loan.clients?.office_id
      })
      .select()
      .single();

    if (entryError || !journalEntry) return;

    // Create journal entry lines
    const lines = [
      {
        tenant_id: loan.tenant_id,
        journal_entry_id: journalEntry.id,
        account_id: loanProduct.loan_portfolio_account_id,
        description: `Loan disbursement - ${loan.loan_number}`,
        debit_amount: loan.principal_amount,
        credit_amount: 0
      },
      {
        tenant_id: loan.tenant_id,
        journal_entry_id: journalEntry.id,
        account_id: loanProduct.fund_source_account_id,
        description: `Loan disbursement - ${loan.loan_number}`,
        debit_amount: 0,
        credit_amount: loan.principal_amount
      }
    ];

    await supabase.from('journal_entry_lines').insert(lines);
  }

  /**
   * Create payment journal entry
   */
  private static async createPaymentJournalEntry(loan: any, payment: PaymentMigrationData, loanProduct: any) {
    const entryNumber = `JE-${new Date().getFullYear()}-${Date.now()}-${payment.id.slice(-8)}`;
    
    const { data: journalEntry, error: entryError } = await supabase
      .from('journal_entries')
      .insert({
        tenant_id: loan.tenant_id,
        entry_number: entryNumber,
        transaction_date: payment.payment_date,
        description: `Loan payment - ${loan.loan_number} - ${payment.id}`,
        reference_type: 'loan_payment',
        reference_id: payment.id,
        status: 'posted',
        total_amount: payment.payment_amount,
        office_id: loan.clients?.office_id
      })
      .select()
      .single();

    if (entryError || !journalEntry) return;

    // Create journal entry lines for payment allocation
    const lines = [];
    
    // Principal payment
    if (payment.principal_amount && payment.principal_amount > 0) {
      lines.push(
        {
          tenant_id: loan.tenant_id,
          journal_entry_id: journalEntry.id,
          account_id: loanProduct.fund_source_account_id || loanProduct.loan_portfolio_account_id,
          description: `Principal payment - ${loan.loan_number}`,
          debit_amount: payment.principal_amount,
          credit_amount: 0
        },
        {
          tenant_id: loan.tenant_id,
          journal_entry_id: journalEntry.id,
          account_id: loanProduct.loan_portfolio_account_id,
          description: `Principal payment - ${loan.loan_number}`,
          debit_amount: 0,
          credit_amount: payment.principal_amount
        }
      );
    }

    // Interest payment
    if (payment.interest_amount && payment.interest_amount > 0 && loanProduct.interest_income_account_id) {
      lines.push(
        {
          tenant_id: loan.tenant_id,
          journal_entry_id: journalEntry.id,
          account_id: loanProduct.fund_source_account_id || loanProduct.loan_portfolio_account_id,
          description: `Interest payment - ${loan.loan_number}`,
          debit_amount: payment.interest_amount,
          credit_amount: 0
        },
        {
          tenant_id: loan.tenant_id,
          journal_entry_id: journalEntry.id,
          account_id: loanProduct.interest_income_account_id,
          description: `Interest payment - ${loan.loan_number}`,
          debit_amount: 0,
          credit_amount: payment.interest_amount
        }
      );
    }

    // Fee payment
    if (payment.fee_amount && payment.fee_amount > 0 && loanProduct.fee_income_account_id) {
      lines.push(
        {
          tenant_id: loan.tenant_id,
          journal_entry_id: journalEntry.id,
          account_id: loanProduct.fund_source_account_id || loanProduct.loan_portfolio_account_id,
          description: `Fee payment - ${loan.loan_number}`,
          debit_amount: payment.fee_amount,
          credit_amount: 0
        },
        {
          tenant_id: loan.tenant_id,
          journal_entry_id: journalEntry.id,
          account_id: loanProduct.fee_income_account_id,
          description: `Fee payment - ${loan.loan_number}`,
          debit_amount: 0,
          credit_amount: payment.fee_amount
        }
      );
    }

    if (lines.length > 0) {
      await supabase.from('journal_entry_lines').insert(lines);
    }
  }

  /**
   * Sync transaction records to ensure consistency
   */
  private static async syncTransactionRecords(loan: any, payments: PaymentMigrationData[]) {
    for (const payment of payments) {
      // Check if transaction record exists
      const { data: existingTransaction } = await supabase
        .from('transactions')
        .select('id')
        .eq('loan_id', loan.id)
        .eq('external_transaction_id', payment.id)
        .single();

      // Create transaction record if missing
      if (!existingTransaction) {
        await supabase
          .from('transactions')
          .insert({
            tenant_id: loan.tenant_id,
            client_id: loan.client_id,
            loan_id: loan.id,
            amount: payment.payment_amount,
            transaction_type: 'loan_repayment',
            payment_type: payment.payment_method === 'cash' ? 'cash' : 
                         payment.payment_method === 'bank_transfer' ? 'bank_transfer' :
                         payment.payment_method === 'mpesa' ? 'mpesa' : 'cash',
            payment_status: 'completed',
            transaction_date: payment.payment_date,
            transaction_id: `TXN-${Date.now()}-${payment.id.slice(-8)}`,
            external_transaction_id: payment.id,
            description: `Loan payment for ${loan.loan_number}`,
            reconciliation_status: 'reconciled'
          });
      }
    }
  }

  /**
   * Update loan status and outstanding balance
   */
  private static async updateLoanStatusAndBalance(loanId: string) {
    // Get total loan amount from schedules
    const { data: schedules } = await supabase
      .from('loan_schedules')
      .select('total_amount')
      .eq('loan_id', loanId);

    // Get total payments
    const { data: payments } = await supabase
      .from('loan_payments')
      .select('payment_amount')
      .eq('loan_id', loanId);

    const totalLoanAmount = (schedules || []).reduce((sum, s) => sum + (s.total_amount || 0), 0);
    const totalPaid = (payments || []).reduce((sum, p) => sum + (p.payment_amount || 0), 0);
    const outstandingBalance = Math.max(0, totalLoanAmount - totalPaid);

    // Determine status
    let status: 'active' | 'closed' | 'overdue' = 'active';
    if (outstandingBalance === 0) {
      status = 'closed';
    } else if (totalPaid > 0) {
      status = 'active';
    }

    // Update loan
    await supabase
      .from('loans')
      .update({
        outstanding_balance: outstandingBalance,
        status: status,
        updated_at: new Date().toISOString()
      })
      .eq('id', loanId);
  }

  /**
   * Validate data integrity after migration
   */
  static async validateMigration(tenantId: string): Promise<{
    isValid: boolean;
    issues: string[];
    metrics: {
      totalLoans: number;
      loansWithJournalEntries: number;
      loansWithSchedules: number;
      consistentBalances: number;
    };
  }> {
    const issues: string[] = [];
    const metrics = {
      totalLoans: 0,
      loansWithJournalEntries: 0,
      loansWithSchedules: 0,
      consistentBalances: 0
    };

    // Get all loans
    const { data: loans } = await supabase
      .from('loans')
      .select('id, loan_number, outstanding_balance, principal_amount')
      .eq('tenant_id', tenantId);

    metrics.totalLoans = loans?.length || 0;

    for (const loan of loans || []) {
      // Check journal entries
      const { data: journalEntries } = await supabase
        .from('journal_entries')
        .select('id')
        .eq('reference_type', 'loan_disbursement')
        .eq('reference_id', loan.id);

      if (journalEntries && journalEntries.length > 0) {
        metrics.loansWithJournalEntries++;
      } else {
        issues.push(`Loan ${loan.loan_number} missing disbursement journal entry`);
      }

      // Check schedules
      const { data: schedules } = await supabase
        .from('loan_schedules')
        .select('id')
        .eq('loan_id', loan.id);

      if (schedules && schedules.length > 0) {
        metrics.loansWithSchedules++;
      } else {
        issues.push(`Loan ${loan.loan_number} missing loan schedules`);
      }

      // Check balance consistency
      const { data: payments } = await supabase
        .from('loan_payments')
        .select('payment_amount')
        .eq('loan_id', loan.id);

      const totalPaid = (payments || []).reduce((sum, p) => sum + (p.payment_amount || 0), 0);
      const calculatedBalance = loan.principal_amount - totalPaid;
      
      if (Math.abs(calculatedBalance - (loan.outstanding_balance || 0)) < 0.01) {
        metrics.consistentBalances++;
      } else {
        issues.push(`Loan ${loan.loan_number} has balance inconsistency: calculated ${calculatedBalance}, stored ${loan.outstanding_balance}`);
      }
    }

    return {
      isValid: issues.length === 0,
      issues,
      metrics
    };
  }
}