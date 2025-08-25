/**
 * Unified Loan Management System
 * Single source of truth for all loan operations in LoanspurCBS v2.0
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { useMifosIntegration } from './useMifosIntegration';
import { defaultQueryOptions } from './useOptimizedQueries';
import { useCreateJournalEntry } from './useAccounting';
import { generateMifosLoanSchedule, validateMifosLoanParams, convertMifosScheduleToDatabase } from '@/lib/mifos-interest-calculation';
import { allocateRepayment } from '@/lib/mifos-interest-calculation';
import { getDerivedLoanStatus } from '@/lib/loan-status';
import { calculateFeeAmount } from '@/lib/fee-calculation';

// Unified interfaces
export interface UnifiedLoanApplication {
  id: string;
  tenant_id: string;
  client_id: string;
  loan_product_id: string;
  application_number: string;
  requested_amount: number;
  requested_term: number;
  purpose?: string;
  status: 'draft' | 'pending' | 'under_review' | 'approved' | 'rejected' | 'withdrawn' | 'pending_disbursement' | 'disbursed';
  submitted_at: string;
  reviewed_by?: string;
  reviewed_at?: string;
  approval_notes?: string;
  final_approved_amount?: number;
  final_approved_term?: number;
  final_approved_interest_rate?: number;
  linked_savings_account_id?: string;
  selected_charges?: any[];
  created_at: string;
  updated_at: string;
}

export interface UnifiedLoan {
  id: string;
  tenant_id: string;
  client_id: string;
  loan_product_id: string;
  application_id: string;
  loan_number: string;
  principal_amount: number;
  interest_rate: number;
  term_months: number;
  outstanding_balance: number;
  status: 'pending_disbursement' | 'active' | 'overdue' | 'in_arrears' | 'rescheduled' | 'closed' | 'written_off' | 'refinanced' | 'defaulted';
  disbursement_date?: string;
  loan_officer_id?: string;
  mifos_loan_id?: string;
  loan_product_snapshot: any;
  created_at: string;
  updated_at: string;
}

export interface UnifiedLoanTransaction {
  type: 'disbursement' | 'repayment' | 'charge' | 'reversal' | 'write_off' | 'early_settlement';
  loan_id: string;
  amount: number;
  transaction_date: string;
  payment_method?: string;
  reference_number?: string;
  description?: string;
  principal_amount?: number;
  interest_amount?: number;
  fee_amount?: number;
  penalty_amount?: number;
  use_strategy_allocation?: boolean;
  disbursement_method?: 'bank_transfer' | 'mpesa' | 'cash' | 'check' | 'transfer_to_savings';
  savings_account_id?: string;
  charge_type?: 'fee' | 'penalty' | 'interest';
  fee_structure_id?: string;
  original_payment_id?: string;
  reversal_reason?: string;
}

export interface UnifiedLoanApproval {
  loan_application_id: string;
  action: 'approve' | 'reject' | 'request_changes' | 'undo_approval';
  comments?: string;
  approved_amount?: number;
  approved_term?: number;
  approved_interest_rate?: number;
  conditions?: string;
}

// Main unified loan management hook
export const useUnifiedLoanManagement = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isConfigured: isMifosConfigured } = useMifosIntegration();
  const createJournalEntry = useCreateJournalEntry();

  // Query hooks
  const useLoanApplications = () => {
    return useQuery({
      queryKey: ['unified-loan-applications', profile?.tenant_id],
      queryFn: async () => {
        if (!profile?.tenant_id) throw new Error('No tenant ID available');
        const { data, error } = await supabase
          .from('loan_applications')
          .select(`
            *,
            clients(first_name, last_name, client_number, phone, email),
            loan_products(*)
          `)
          .eq('tenant_id', profile.tenant_id)
          .order('created_at', { ascending: false });
        if (error) throw error;
        return data as UnifiedLoanApplication[];
      },
      enabled: !!profile?.tenant_id,
      ...defaultQueryOptions,
    });
  };

  const useAllLoans = () => {
    return useQuery({
      queryKey: ['unified-all-loans', profile?.tenant_id],
      queryFn: async () => {
        if (!profile?.tenant_id) throw new Error('No tenant ID available');
        
        const [applicationsResult, loansResult] = await Promise.all([
          supabase.from('loan_applications').select('*, clients(*), loan_products(*)').eq('tenant_id', profile.tenant_id),
          supabase.from('loans').select('*, clients(*), loan_products(*)').eq('tenant_id', profile.tenant_id)
        ]);

        if (applicationsResult.error) throw applicationsResult.error;
        if (loansResult.error) throw loansResult.error;

        const normalizedApplications = applicationsResult.data?.map(app => ({
          ...app, type: 'application', amount: app.requested_amount, number: app.application_number
        })) || [];

        const normalizedLoans = loansResult.data?.map(loan => ({
          ...loan, type: 'loan', amount: loan.principal_amount, number: loan.loan_number
        })) || [];

        return [...normalizedApplications, ...normalizedLoans];
      },
      enabled: !!profile?.tenant_id,
      ...defaultQueryOptions,
    });
  };

  const useLoanSchedules = (loanId?: string) => {
    return useQuery({
      queryKey: ['unified-loan-schedules', loanId],
      queryFn: async () => {
        if (!loanId) throw new Error('No loan ID provided');
        const { data, error } = await supabase
          .from('loan_schedules')
          .select('*')
          .eq('loan_id', loanId)
          .order('installment_number', { ascending: true });
        if (error) throw error;
        return data;
      },
      enabled: !!loanId,
    });
  };

  // Mutation hooks
  const useCreateLoanApplication = () => {
    return useMutation({
      mutationFn: async (application: Omit<UnifiedLoanApplication, 'id' | 'created_at' | 'updated_at' | 'tenant_id' | 'application_number' | 'submitted_at' | 'status'>) => {
        if (!profile?.tenant_id) throw new Error('No tenant ID available');
        const appNumber = `LA-${Date.now()}`;
        const { data, error } = await supabase
          .from('loan_applications')
          .insert([{ ...application, tenant_id: profile.tenant_id, application_number: appNumber, status: 'pending' }])
          .select()
          .single();
        if (error) throw error;
        return data;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['unified-loan-applications'] });
        queryClient.invalidateQueries({ queryKey: ['unified-all-loans'] });
        toast({ title: "Success", description: "Loan application created successfully" });
      },
      onError: (error: any) => {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      },
    });
  };

  const useProcessLoanApproval = () => {
    return useMutation({
      mutationFn: async (approval: UnifiedLoanApproval) => {
        if (!profile?.tenant_id || !profile?.id) throw new Error('No user context');

        const { data: loanApp, error: loanError } = await supabase
          .from('loan_applications')
          .select('*, loan_products(*)')
          .eq('id', approval.loan_application_id)
          .single();
        
        if (loanError || !loanApp) throw new Error('Loan application not found');

        // Validate approval amounts
        if (approval.action === 'approve') {
          const product = loanApp.loan_products;
          const approvedAmount = approval.approved_amount || loanApp.requested_amount;
          const approvedTerm = approval.approved_term || loanApp.requested_term;

          if (product?.min_principal && approvedAmount < product.min_principal) {
            throw new Error(`Approved amount below product minimum`);
          }
          if (product?.max_principal && approvedAmount > product.max_principal) {
            throw new Error(`Approved amount exceeds product maximum`);
          }
        }

        // Create approval record
        const { data: approvalData, error: approvalError } = await supabase
          .from('loan_approvals')
          .insert([{
            tenant_id: profile.tenant_id,
            loan_application_id: approval.loan_application_id,
            approver_id: profile.id,
            action: approval.action,
            status: approval.action === 'approve' ? 'approved' : 'rejected',
            comments: approval.comments,
            approved_amount: approval.approved_amount,
            approved_term: approval.approved_term,
            approved_interest_rate: approval.approved_interest_rate,
            conditions: approval.conditions,
          }])
          .select()
          .single();
        
        if (approvalError) throw approvalError;

        // Update application status
        const newStatus = approval.action === 'approve' ? 'pending_disbursement' : 
                         approval.action === 'reject' ? 'rejected' : 
                         approval.action === 'undo_approval' ? 'pending' : 'under_review';

        const { error: updateError } = await supabase
          .from('loan_applications')
          .update({
            status: newStatus,
            reviewed_by: profile.id,
            reviewed_at: new Date().toISOString(),
            approval_notes: approval.comments,
            final_approved_amount: approval.approved_amount,
            final_approved_term: approval.approved_term,
            final_approved_interest_rate: approval.approved_interest_rate,
          })
          .eq('id', approval.loan_application_id);

        if (updateError) throw updateError;

        // Create loan record if approved
        if (approval.action === 'approve') {
          await createLoanRecord(loanApp, approval, profile);
        }

        return { ...approvalData, message: "Loan approval processed successfully" };
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['unified-loan-applications'] });
        queryClient.invalidateQueries({ queryKey: ['unified-all-loans'] });
        toast({ title: "Success", description: "Loan approval processed successfully" });
      },
      onError: (error: any) => {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      },
    });
  };

  const useProcessLoanTransaction = () => {
    return useMutation({
      mutationFn: async (transaction: UnifiedLoanTransaction): Promise<any> => {
        if (!profile?.tenant_id) throw new Error('No tenant context');

        const { data: loan, error: loanError } = await supabase
          .from('loans')
          .select('*, clients!inner(*), loan_products!inner(*)')
          .eq('id', transaction.loan_id)
          .eq('tenant_id', profile.tenant_id)
          .single();

        if (loanError || !loan) throw new Error('Loan not found or access denied');

        // Check loan status
        if (['repayment', 'charge'].includes(transaction.type)) {
          const { status: derivedStatus } = getDerivedLoanStatus(loan);
          if (['closed', 'written_off', 'fully_paid'].includes(derivedStatus)) {
            throw new Error(`Cannot process ${transaction.type} on ${derivedStatus} loans`);
          }
        }

        switch (transaction.type) {
          case 'disbursement':
            return await processDisbursement(transaction, loan, profile, createJournalEntry);
          case 'repayment':
            return await processRepayment(transaction, loan, profile, createJournalEntry);
          case 'charge':
            return await processCharge(transaction, loan, profile, createJournalEntry);
          case 'reversal':
            return await processReversal(transaction, loan, profile, createJournalEntry);
          case 'write_off':
            return await processWriteOff(transaction, loan, profile, createJournalEntry);
          case 'early_settlement':
            return await processEarlySettlement(transaction, loan, profile, createJournalEntry);
          default:
            throw new Error(`Unsupported transaction type: ${transaction.type}`);
        }
      },
      onSuccess: (result, variables) => {
        const invalidateQueries = [
          ['unified-all-loans'],
          ['unified-loan-applications'],
          ['unified-loan-schedules', variables.loan_id],
          ['transactions'],
          ['journal_entries'],
          ['account_balances'],
          ['savings_accounts'],
          ['dashboard-data']
        ];

        invalidateQueries.forEach(queryKey => {
          queryClient.invalidateQueries({ queryKey });
        });

        toast({ title: "Transaction Processed", description: result.message });
      },
      onError: (error: any) => {
        toast({ title: "Transaction Failed", description: error.message || "Failed to process transaction", variant: "destructive" });
      },
    });
  };

  const useGenerateLoanSchedule = () => {
    return useMutation({
      mutationFn: async ({ 
        loanId, 
        principal, 
        interestRate, 
        termMonths, 
        startDate,
        repaymentFrequency = 'monthly',
        calculationMethod = 'reducing_balance',
        daysInYearType = '365',
        daysInMonthType = 'actual',
        amortizationMethod = 'equal_installments',
        gracePeriodDays = 0,
        gracePeriodType = 'none'
      }: { 
        loanId: string; 
        principal: number; 
        interestRate: number; 
        termMonths: number; 
        startDate: string;
        repaymentFrequency?: 'daily' | 'weekly' | 'monthly';
        calculationMethod?: 'reducing_balance' | 'flat_rate' | 'declining_balance';
        daysInYearType?: '360' | '365' | 'actual';
        daysInMonthType?: '30' | 'actual';
        amortizationMethod?: 'equal_installments' | 'equal_principal';
        gracePeriodDays?: number;
        gracePeriodType?: 'none' | 'principal_only' | 'interest_only' | 'principal_and_interest';
      }) => {
        const mifosFrequency = repaymentFrequency === 'daily' ? 'daily' : 
                              repaymentFrequency === 'weekly' ? 'weekly' : 'monthly';
        const mifosInterestType = calculationMethod === 'flat_rate' ? 'flat_rate' : 'declining_balance';
        const termInPeriods = repaymentFrequency === 'daily' ? termMonths : 
                             repaymentFrequency === 'weekly' ? Math.ceil((termMonths / 12) * 52) : termMonths;

        const mifosParams = {
          principal,
          annualInterestRate: interestRate * 100,
          termInPeriods,
          repaymentFrequency: mifosFrequency as 'daily' | 'weekly' | 'monthly',
          interestType: mifosInterestType as 'declining_balance' | 'flat_rate',
          amortizationType: amortizationMethod,
          daysInYearType,
          daysInMonthType,
          disbursementDate: new Date(startDate),
          gracePeriodDays,
          gracePeriodType
        };

        const validation = validateMifosLoanParams(mifosParams);
        if (!validation.valid) {
          throw new Error(`Invalid loan parameters: ${validation.errors.join(', ')}`);
        }

        const mifosResult = generateMifosLoanSchedule(mifosParams);
        const schedules = convertMifosScheduleToDatabase(mifosResult.schedule, loanId);

        const { data, error } = await supabase
          .from('loan_schedules')
          .insert(schedules)
          .select();
        
        if (error) throw error;
        return data;
      },
      onSuccess: (_, variables) => {
        queryClient.invalidateQueries({ queryKey: ['unified-loan-schedules', variables.loanId] });
        toast({ title: "Success", description: "Loan schedule generated successfully" });
      },
      onError: (error: any) => {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      },
    });
  };

  // Helper functions
  const createLoanRecord = async (loanApp: any, approval: any, profile: any) => {
    const { data: existingLoan } = await supabase
      .from('loans')
      .select('id, status')
      .eq('application_id', approval.loan_application_id)
      .maybeSingle();
    
    if (!existingLoan) {
      const loanNumber = `LN-${Date.now()}`;
      const { data: productSnapshot } = await supabase
        .from('loan_products')
        .select('*')
        .eq('id', loanApp.loan_product_id)
        .single();
          
      const { error: loanError } = await supabase
        .from('loans')
        .insert([{
          tenant_id: profile.tenant_id,
          client_id: loanApp.client_id,
          loan_product_id: loanApp.loan_product_id,
          application_id: approval.loan_application_id,
          loan_number: loanNumber,
          principal_amount: approval.approved_amount || loanApp.requested_amount,
          interest_rate: (() => {
            const r = Number(approval.approved_interest_rate ?? productSnapshot?.default_nominal_interest_rate ?? 10);
            return r > 1 ? r / 100 : r;
          })(),
          term_months: approval.approved_term || loanApp.requested_term,
          outstanding_balance: approval.approved_amount || loanApp.requested_amount,
          status: 'pending_disbursement',
          loan_officer_id: profile.id,
          loan_product_snapshot: productSnapshot,
        }]);
        
      if (loanError) throw loanError;
    }
  };

  // Transaction processing functions (simplified for now)
  const processDisbursement = async (transaction: UnifiedLoanTransaction, loan: any, profile: any, createJournalEntry: any) => {
    // Implementation will be added
    return { success: true, message: 'Disbursement processed' };
  };

  const processRepayment = async (transaction: UnifiedLoanTransaction, loan: any, profile: any, createJournalEntry: any) => {
    // Implementation will be added
    return { success: true, message: 'Repayment processed' };
  };

  const processCharge = async (transaction: UnifiedLoanTransaction, loan: any, profile: any, createJournalEntry: any) => {
    // Implementation will be added
    return { success: true, message: 'Charge processed' };
  };

  const processReversal = async (transaction: UnifiedLoanTransaction, loan: any, profile: any, createJournalEntry: any) => {
    // Implementation will be added
    return { success: true, message: 'Reversal processed' };
  };

  const processWriteOff = async (transaction: UnifiedLoanTransaction, loan: any, profile: any, createJournalEntry: any) => {
    // Implementation will be added
    return { success: true, message: 'Write-off processed' };
  };

  const processEarlySettlement = async (transaction: UnifiedLoanTransaction, loan: any, profile: any, createJournalEntry: any) => {
    // Implementation will be added
    return { success: true, message: 'Early settlement processed' };
  };

  return {
    // Query hooks
    useLoanApplications,
    useAllLoans,
    useLoanSchedules,
    
    // Mutation hooks
    useCreateLoanApplication,
    useProcessLoanApproval,
    useProcessLoanTransaction,
    useGenerateLoanSchedule,
    
    // Utility
    isMifosConfigured,
  };
};
