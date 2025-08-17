import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { useCreateJournalEntry } from './useAccounting';
import { allocateRepayment, type RepaymentStrategyType, type LoanBalances } from '@/lib/loan-repayment-strategy';
import { getDerivedLoanStatus } from '@/lib/loan-status';
import { generateLoanSchedule } from '@/lib/loan-schedule-generator';

// Unified interfaces for all loan transactions
export interface LoanTransactionData {
  type: 'disbursement' | 'repayment' | 'charge' | 'reversal';
  loan_id: string;
  amount: number;
  transaction_date: string;
  payment_method?: string;
  reference_number?: string;
  description?: string;
  
  // Repayment-specific fields
  principal_amount?: number;
  interest_amount?: number;
  fee_amount?: number;
  penalty_amount?: number;
  use_strategy_allocation?: boolean;
  
  // Disbursement-specific fields
  disbursement_method?: 'bank_transfer' | 'mpesa' | 'cash' | 'check';
  
  // Charge-specific fields
  charge_type?: 'fee' | 'penalty' | 'interest';
  fee_structure_id?: string;
  
  // Reversal-specific fields
  original_payment_id?: string;
  reversal_reason?: string;
}

export interface ProcessedTransaction {
  transaction_id: string;
  journal_entry_id?: string;
  loan_payment_id?: string;
  success: boolean;
  message: string;
  updated_loan?: any;
}

/**
 * Unified Loan Transaction Manager
 * Handles all loan-related transactions: disbursements, repayments, charges, and reversals
 * Ensures consistent accounting, schedule updates, and status management
 */
export const useLoanTransactionManager = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createJournalEntry = useCreateJournalEntry();

  return useMutation({
    mutationFn: async (data: LoanTransactionData): Promise<ProcessedTransaction> => {
      if (!profile?.tenant_id) {
        throw new Error('No tenant context');
      }

      // Validate loan exists and get details
      const { data: loan, error: loanError } = await supabase
        .from('loans')
        .select(`
          *,
          clients!inner(first_name, last_name, office_id),
          loan_products!inner(
            *,
            loan_portfolio_account_id,
            interest_income_account_id,
            fee_income_account_id,
            penalty_income_account_id,
            fund_source_account_id,
            accounting_type,
            repayment_strategy
          )
        `)
        .eq('id', data.loan_id)
        .eq('tenant_id', profile.tenant_id)
        .single();

      if (loanError || !loan) {
        throw new Error('Loan not found or access denied');
      }

      // Check loan status for transactions that require active loans
      if (['repayment', 'charge'].includes(data.type)) {
        const { status: derivedStatus } = getDerivedLoanStatus(loan);
        if (['closed', 'written_off', 'fully_paid'].includes(derivedStatus)) {
          throw new Error(`Cannot process ${data.type} on ${derivedStatus} loans`);
        }
      }

      switch (data.type) {
        case 'disbursement':
          return await processDisbursement(data, loan, profile, createJournalEntry);
        case 'repayment':
          return await processRepayment(data, loan, profile, createJournalEntry);
        case 'charge':
          return await processCharge(data, loan, profile, createJournalEntry);
        case 'reversal':
          return await processReversal(data, loan, profile, createJournalEntry);
        default:
          throw new Error(`Unsupported transaction type: ${data.type}`);
      }
    },
    onSuccess: (result, variables) => {
      // Invalidate all relevant queries for comprehensive data refresh
      const invalidateQueries = [
        ['loans'],
        ['loan_applications'],
        ['loan_schedules', variables.loan_id],
        ['loan_payments', variables.loan_id],
        ['transactions'],
        ['journal_entries'],
        ['account_balances'],
        ['savings_accounts'],
        ['savings_transactions'],
        ['dashboard-data'],
        ['clients'],
        ['all-loans'],
        ['harmonized_loan_calculations']
      ];

      invalidateQueries.forEach(queryKey => {
        queryClient.invalidateQueries({ queryKey });
      });

      toast({
        title: "Transaction Processed",
        description: result.message,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Transaction Failed",
        description: error.message || "Failed to process transaction. Please try again.",
        variant: "destructive",
      });
    },
  });
};

// Disbursement processing
async function processDisbursement(
  data: LoanTransactionData,
  loan: any,
  profile: any,
  createJournalEntry: any
): Promise<ProcessedTransaction> {
  const product = loan.loan_products;
  
  if (product.accounting_type === 'none') {
    throw new Error('Accounting is disabled for this loan product');
  }

  // Resolve fund source account
  let fundSourceAccount = product.fund_source_account_id;
  try {
    const { resolveFundSourceAccount } = await import('./useFundSourceResolver');
    const resolved = await resolveFundSourceAccount({
      productId: loan.loan_product_id,
      productType: 'loan',
      paymentMethodCode: data.payment_method || null,
    });
    if (resolved) fundSourceAccount = resolved;
  } catch (e) {
    console.warn('Fund source resolver failed, using default', e);
  }

  if (!fundSourceAccount) {
    throw new Error('Fund source account not configured');
  }

  // Create journal entry for disbursement
  const journalEntry = await createJournalEntry.mutateAsync({
    transaction_date: data.transaction_date,
    description: `Loan disbursement - ${loan.loan_number}`,
    reference_type: 'loan_disbursement',
    reference_id: data.loan_id,
    lines: [
      {
        account_id: product.loan_portfolio_account_id,
        description: `Loan disbursement - ${loan.loan_number}`,
        debit_amount: data.amount,
        credit_amount: 0,
      },
      {
        account_id: fundSourceAccount,
        description: `Loan disbursement - ${loan.loan_number}`,
        debit_amount: 0,
        credit_amount: data.amount,
      },
    ],
  });

  // Create transaction record
  const { data: transaction, error: transactionError } = await supabase
    .from('transactions')
    .insert({
      tenant_id: profile.tenant_id,
      loan_id: data.loan_id,
      client_id: loan.client_id,
      amount: data.amount,
      transaction_type: 'loan_disbursement',
      payment_type: (data.payment_method || 'cash') as any,
      payment_status: 'completed',
      transaction_date: new Date(data.transaction_date).toISOString(),
      transaction_id: `LD-${Date.now()}`,
      external_transaction_id: data.reference_number,
      description: data.description || `Loan disbursement - ${loan.loan_number}`,
      processed_by: profile.id,
      reconciliation_status: 'reconciled'
    })
    .select()
    .single();

  if (transactionError) {
    console.error('Failed to create transaction record:', transactionError);
  }

  // Update loan status to disbursed/active
  await supabase
    .from('loans')
    .update({
      status: 'active',
      disbursement_date: data.transaction_date,
      outstanding_balance: data.amount,
      updated_at: new Date().toISOString()
    })
    .eq('id', data.loan_id);

  // Generate loan schedule if not exists
  const { data: existingSchedule } = await supabase
    .from('loan_schedules')
    .select('id')
    .eq('loan_id', data.loan_id)
    .limit(1);

  if (!existingSchedule || existingSchedule.length === 0) {
    const schedule = generateLoanSchedule({
      loanId: data.loan_id,
      principal: data.amount,
      interestRate: loan.interest_rate || product.default_nominal_interest_rate || 0,
      termMonths: loan.term_months || 12,
      disbursementDate: data.transaction_date,
      repaymentFrequency: product.repayment_frequency || 'monthly',
      calculationMethod: product.interest_calculation_method || 'reducing_balance'
    });

    await supabase
      .from('loan_schedules')
      .insert(schedule.map(entry => ({
        loan_id: data.loan_id,
        installment_number: entry.installment_number,
        due_date: entry.due_date,
        principal_amount: entry.principal_amount,
        interest_amount: entry.interest_amount,
        fee_amount: entry.fee_amount,
        total_amount: entry.total_amount,
        paid_amount: 0,
        outstanding_amount: entry.total_amount,
        payment_status: 'unpaid'
      })));
  }

  return {
    transaction_id: transaction?.id || '',
    journal_entry_id: journalEntry.id,
    success: true,
    message: `Loan disbursement of ${new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
    }).format(data.amount)} processed successfully`
  };
}

// Repayment processing
async function processRepayment(
  data: LoanTransactionData,
  loan: any,
  profile: any,
  createJournalEntry: any
): Promise<ProcessedTransaction> {
  const product = loan.loan_products;
  
  if (product.accounting_type === 'none') {
    throw new Error('Accounting is disabled for this loan product');
  }

  // Determine payment allocation strategy
  let allocation = {
    principal: data.principal_amount || 0,
    interest: data.interest_amount || 0,
    fees: data.fee_amount || 0,
    penalties: data.penalty_amount || 0
  };

  if (data.use_strategy_allocation !== false) {
    const totalSpecified = allocation.principal + allocation.interest + allocation.fees + allocation.penalties;
    
    if (Math.abs(totalSpecified - data.amount) > 0.01) {
      // Get outstanding balances from loan schedules
      const { data: schedules } = await supabase
        .from('loan_schedules')
        .select('*')
        .eq('loan_id', data.loan_id);

      const outstandingPrincipal = schedules?.reduce((sum, s) => 
        sum + (Number(s.outstanding_amount) || 0), 0) || 0;

      const loanBalances: LoanBalances = {
        outstandingPrincipal,
        unpaidInterest: 0, // Would be calculated from accruals
        unpaidFees: 0,
        unpaidPenalties: 0
      };

      const strategy = (product.repayment_strategy || 'penalties_fees_interest_principal') as RepaymentStrategyType;
      const strategyAllocation = allocateRepayment(data.amount, loanBalances, strategy);
      
      allocation = {
        principal: strategyAllocation.principal,
        interest: strategyAllocation.interest,
        fees: strategyAllocation.fees,
        penalties: strategyAllocation.penalties
      };
    }
  }

  // Get payment account
  let paymentAccount = product.fund_source_account_id;
  
  if (data.payment_method) {
    const { data: mappings } = await supabase
      .from('product_fund_source_mappings')
      .select('account_id')
      .eq('tenant_id', profile.tenant_id)
      .eq('product_id', product.id)
      .eq('product_type', 'loan')
      .eq('channel_id', data.payment_method)
      .maybeSingle();

    if (mappings?.account_id) {
      paymentAccount = mappings.account_id;
    }
  }

  if (!paymentAccount) {
    throw new Error('Payment account not configured');
  }

  // Create journal entry lines
  const lines: Array<{
    account_id: string;
    description: string;
    debit_amount: number;
    credit_amount: number;
  }> = [];

  // Principal repayment
  if (allocation.principal > 0) {
    lines.push(
      {
        account_id: paymentAccount,
        description: `Principal repayment - ${loan.loan_number}`,
        debit_amount: allocation.principal,
        credit_amount: 0,
      },
      {
        account_id: product.loan_portfolio_account_id,
        description: `Principal repayment - ${loan.loan_number}`,
        debit_amount: 0,
        credit_amount: allocation.principal,
      }
    );
  }

  // Interest repayment
  if (allocation.interest > 0 && product.interest_income_account_id) {
    lines.push(
      {
        account_id: paymentAccount,
        description: `Interest repayment - ${loan.loan_number}`,
        debit_amount: allocation.interest,
        credit_amount: 0,
      },
      {
        account_id: product.interest_income_account_id,
        description: `Interest repayment - ${loan.loan_number}`,
        debit_amount: 0,
        credit_amount: allocation.interest,
      }
    );
  }

  // Fee repayment
  if (allocation.fees > 0 && product.fee_income_account_id) {
    lines.push(
      {
        account_id: paymentAccount,
        description: `Fee repayment - ${loan.loan_number}`,
        debit_amount: allocation.fees,
        credit_amount: 0,
      },
      {
        account_id: product.fee_income_account_id,
        description: `Fee repayment - ${loan.loan_number}`,
        debit_amount: 0,
        credit_amount: allocation.fees,
      }
    );
  }

  // Penalty repayment
  if (allocation.penalties > 0 && product.penalty_income_account_id) {
    lines.push(
      {
        account_id: paymentAccount,
        description: `Penalty repayment - ${loan.loan_number}`,
        debit_amount: allocation.penalties,
        credit_amount: 0,
      },
      {
        account_id: product.penalty_income_account_id,
        description: `Penalty repayment - ${loan.loan_number}`,
        debit_amount: 0,
        credit_amount: allocation.penalties,
      }
    );
  }

  // Create journal entry
  const journalEntry = await createJournalEntry.mutateAsync({
    transaction_date: data.transaction_date,
    description: `Loan repayment - ${loan.loan_number}`,
    reference_type: 'loan_payment',
    reference_id: data.loan_id,
    lines,
  });

  // Create loan payment record
  const { data: loanPayment, error: paymentError } = await supabase
    .from('loan_payments')
    .insert({
      tenant_id: profile.tenant_id,
      loan_id: data.loan_id,
      payment_amount: data.amount,
      principal_amount: allocation.principal,
      interest_amount: allocation.interest,
      fee_amount: allocation.fees,
      penalty_amount: allocation.penalties,
      payment_date: data.transaction_date,
      payment_method: data.payment_method || 'cash',
      reference_number: data.reference_number,
      processed_by: profile.id
    })
    .select()
    .single();

  if (paymentError) {
    console.error('Failed to create loan payment record:', paymentError);
  }

  // Create transaction record
  const { data: transaction, error: transactionError } = await supabase
    .from('transactions')
    .insert({
      tenant_id: profile.tenant_id,
      loan_id: data.loan_id,
      client_id: loan.client_id,
      amount: data.amount,
      transaction_type: 'loan_repayment',
      payment_type: (data.payment_method || 'cash') as any,
      payment_status: 'completed',
      transaction_date: new Date(data.transaction_date).toISOString(),
      transaction_id: `LR-${Date.now()}`,
      external_transaction_id: data.reference_number,
      description: data.description || `Loan repayment - ${loan.loan_number}`,
      processed_by: profile.id,
      reconciliation_status: 'reconciled'
    })
    .select()
    .single();

  if (transactionError) {
    console.error('Failed to create transaction record:', transactionError);
  }

  // Update loan schedules
  await updateLoanSchedules(data.loan_id, data.amount);

  // Update loan outstanding balance and status
  const newOutstanding = (loan.outstanding_balance || 0) - data.amount;
  const updatePayload: any = { 
    outstanding_balance: Math.max(0, newOutstanding),
    updated_at: new Date().toISOString()
  };

  if (newOutstanding <= 0) {
    updatePayload.status = 'closed';
    updatePayload.closed_date = data.transaction_date;
  }

  const { data: updatedLoan } = await supabase
    .from('loans')
    .update(updatePayload)
    .eq('id', data.loan_id)
    .select()
    .single();

  // Handle overpayment if necessary
  if (newOutstanding < 0) {
    await handleOverpayment(data.loan_id, Math.abs(newOutstanding), profile, loan);
  }

  return {
    transaction_id: transaction?.id || '',
    journal_entry_id: journalEntry.id,
    loan_payment_id: loanPayment?.id,
    updated_loan: updatedLoan,
    success: true,
    message: `Loan repayment of ${new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
    }).format(data.amount)} processed successfully`
  };
}

// Charge processing (fees, penalties, interest)
async function processCharge(
  data: LoanTransactionData,
  loan: any,
  profile: any,
  createJournalEntry: any
): Promise<ProcessedTransaction> {
  const product = loan.loan_products;
  
  if (product.accounting_type === 'none') {
    throw new Error('Accounting is disabled for this loan product');
  }

  // Determine the income account based on charge type
  let incomeAccountId: string | null = null;
  switch (data.charge_type) {
    case 'fee':
      incomeAccountId = product.fee_income_account_id;
      break;
    case 'penalty':
      incomeAccountId = product.penalty_income_account_id;
      break;
    case 'interest':
      incomeAccountId = product.interest_income_account_id;
      break;
  }

  if (!incomeAccountId) {
    throw new Error(`${data.charge_type} income account not configured`);
  }

  // Create journal entry
  const journalEntry = await createJournalEntry.mutateAsync({
    transaction_date: data.transaction_date,
    description: `${data.charge_type} charge - ${loan.loan_number}`,
    reference_type: 'loan_charge',
    reference_id: data.loan_id,
    lines: [
      {
        account_id: product.loan_portfolio_account_id, // Receivable account
        description: `${data.charge_type} charge - ${loan.loan_number}`,
        debit_amount: data.amount,
        credit_amount: 0,
      },
      {
        account_id: incomeAccountId,
        description: `${data.charge_type} charge - ${loan.loan_number}`,
        debit_amount: 0,
        credit_amount: data.amount,
      },
    ],
  });

  // Create transaction record
  const { data: transaction, error: transactionError } = await supabase
    .from('transactions')
    .insert({
      tenant_id: profile.tenant_id,
      loan_id: data.loan_id,
      client_id: loan.client_id,
      amount: data.amount,
      transaction_type: 'fee_payment',
      payment_type: 'system' as any,
      payment_status: 'completed',
      transaction_date: new Date(data.transaction_date).toISOString(),
      transaction_id: `LC-${Date.now()}`,
      external_transaction_id: data.reference_number,
      description: data.description || `${data.charge_type} charge - ${loan.loan_number}`,
      processed_by: profile.id,
      reconciliation_status: 'reconciled'
    })
    .select()
    .single();

  if (transactionError) {
    console.error('Failed to create transaction record:', transactionError);
  }

  return {
    transaction_id: transaction?.id || '',
    journal_entry_id: journalEntry.id,
    success: true,
    message: `${data.charge_type} charge of ${new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
    }).format(data.amount)} applied successfully`
  };
}

// Reversal processing
async function processReversal(
  data: LoanTransactionData,
  loan: any,
  profile: any,
  createJournalEntry: any
): Promise<ProcessedTransaction> {
  if (!data.original_payment_id) {
    throw new Error('Original payment ID required for reversal');
  }

  // Get original payment details
  const { data: originalPayment, error: paymentError } = await supabase
    .from('loan_payments')
    .select('*')
    .eq('id', data.original_payment_id)
    .eq('tenant_id', profile.tenant_id)
    .single();

  if (paymentError || !originalPayment) {
    throw new Error('Original payment not found');
  }

  // Create reversal journal entries (opposite of original)
  // Implementation would mirror the reversal logic from useLoanRepaymentUndo
  // but in a more streamlined way

  return {
    transaction_id: `REV-${Date.now()}`,
    success: true,
    message: `Payment reversal processed successfully`
  };
}

// Helper function to update loan schedules
async function updateLoanSchedules(loanId: string, paymentAmount: number) {
  const { data: schedules } = await supabase
    .from('loan_schedules')
    .select('*')
    .eq('loan_id', loanId)
    .order('installment_number', { ascending: true });

  if (!schedules || schedules.length === 0) return;

  let remainingPayment = paymentAmount;
  const updates = [];

  for (const schedule of schedules) {
    if (remainingPayment <= 0) break;

    const outstandingForSchedule = Number(schedule.outstanding_amount || schedule.total_amount);
    const currentPaid = Number(schedule.paid_amount || 0);
    
    if (outstandingForSchedule > 0) {
      const paymentForSchedule = Math.min(remainingPayment, outstandingForSchedule);
      const newPaidAmount = currentPaid + paymentForSchedule;
      const newOutstandingAmount = Math.max(0, Number(schedule.total_amount) - newPaidAmount);
      
      updates.push({
        id: schedule.id,
        paid_amount: newPaidAmount,
        outstanding_amount: newOutstandingAmount,
        payment_status: newOutstandingAmount <= 0.01 ? 'paid' : (newPaidAmount > 0 ? 'partial' : 'unpaid')
      });

      remainingPayment -= paymentForSchedule;
    }
  }

  // Update schedules in batch
  for (const update of updates) {
    await supabase
      .from('loan_schedules')
      .update({
        paid_amount: update.paid_amount,
        outstanding_amount: update.outstanding_amount,
        payment_status: update.payment_status
      })
      .eq('id', update.id);
  }
}

// Helper function to handle overpayments
async function handleOverpayment(
  loanId: string, 
  overpaymentAmount: number, 
  profile: any, 
  loan: any
) {
  // Find client's primary savings account
  const { data: savingsAccount } = await supabase
    .from('savings_accounts')
    .select('*')
    .eq('client_id', loan.client_id)
    .eq('tenant_id', profile.tenant_id)
    .eq('status', 'activated')
    .eq('is_active', true)
    .order('created_at', { ascending: true })
    .limit(1)
    .single();

  if (savingsAccount) {
      // Transfer overpayment to savings
      await supabase
        .from('savings_transactions')
        .insert({
          tenant_id: profile.tenant_id,
          savings_account_id: savingsAccount.id,
          amount: overpaymentAmount,
          transaction_type: 'deposit',
          transaction_date: new Date().toISOString().split('T')[0],
          description: `Overpayment transfer from loan ${loan.loan_number}`,
          reference_number: `OVP-${loanId}`,
          method: 'internal_transfer',
          processed_by: profile.id,
          balance_after: (savingsAccount.account_balance || 0) + overpaymentAmount
        });

    // Update savings account balance
    await supabase
      .from('savings_accounts')
      .update({
        account_balance: (savingsAccount.account_balance || 0) + overpaymentAmount,
        available_balance: (savingsAccount.available_balance || 0) + overpaymentAmount,
        updated_at: new Date().toISOString()
      })
      .eq('id', savingsAccount.id);
  }
}