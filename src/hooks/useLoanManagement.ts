import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { useMifosIntegration } from './useMifosIntegration';
import { defaultQueryOptions } from './useOptimizedQueries';
import { useLoanDisbursementAccounting, useLoanChargeAccounting } from './useLoanAccounting';
import { calculateFeeAmount } from '@/lib/fee-calculation';
import { generateLoanSchedule } from '@/lib/loan-schedule-generator';
import { calculateReducingBalanceInterest, calculateMonthlyInterest } from "@/lib/interest-calculation";
export interface LoanApplication {
  id: string;
  tenant_id: string;
  client_id: string;
  loan_product_id: string;
  application_number: string;
  requested_amount: number;
  requested_term: number;
  purpose?: string;
  status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'withdrawn' | 'pending_disbursement' | 'disbursed';
  submitted_at: string;
  reviewed_by?: string;
  reviewed_at?: string;
  approval_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface LoanSchedule {
  id: string;
  loan_id: string;
  installment_number: number;
  due_date: string;
  principal_amount: number;
  interest_amount: number;
  fee_amount: number;
  total_amount: number;
  paid_amount: number;
  outstanding_amount: number;
  payment_status: 'unpaid' | 'partial' | 'paid' | 'overdue';
  created_at: string;
}

export interface LoanPayment {
  id: string;
  tenant_id: string;
  loan_id: string;
  schedule_id?: string;
  payment_amount: number;
  principal_amount: number;
  interest_amount: number;
  fee_amount: number;
  payment_date: string;
  payment_method: string;
  reference_number?: string;
  processed_by?: string;
  created_at: string;
}

export interface CollectionCase {
  id: string;
  tenant_id: string;
  loan_id: string;
  collection_status: 'active' | 'resolved' | 'written_off';
  days_overdue: number;
  overdue_amount: number;
  last_contact_date?: string;
  next_action_date?: string;
  collection_notes?: string;
  assigned_to?: string;
  created_at: string;
  updated_at: string;
}

export interface LoanApproval {
  id: string;
  tenant_id: string;
  loan_application_id: string;
  approver_id: string;
  approval_level: number;
  action: 'approve' | 'reject' | 'request_changes';
  status: string;
  decision_notes?: string;
  comments?: string;
  approved_amount?: number;
  approved_term?: number;
  approved_interest_rate?: number;
  conditions?: string;
  created_at: string;
  updated_at: string;
}

export interface LoanDisbursement {
  id: string;
  tenant_id: string;
  loan_application_id: string;
  loan_id?: string;
  disbursed_amount: number;
  disbursement_date: string;
  disbursement_method: 'bank_transfer' | 'mpesa' | 'cash' | 'check';
  bank_account_name?: string;
  bank_account_number?: string;
  bank_name?: string;
  mpesa_phone?: string;
  reference_number?: string;
  disbursed_by?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  failure_reason?: string;
  created_at: string;
  updated_at: string;
}

// Loan Applications Hook
export const useLoanApplications = () => {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['loan-applications', profile?.tenant_id],
    queryFn: async () => {
      if (!profile?.tenant_id) throw new Error('No tenant ID available');

      const { data, error } = await supabase
        .from('loan_applications')
        .select(`
          *,
          clients(first_name, last_name, client_number, phone, email),
          loan_products(
            name, 
            short_name, 
            currency_code, 
            default_nominal_interest_rate,
            min_principal,
            max_principal,
            default_term,
            min_term,
            max_term
          )
        `)
        .eq('tenant_id', profile.tenant_id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Loan applications query error:', error);
        throw new Error(`Failed to fetch loan applications: ${error.message}`);
      }
      return data as any[];
    },
    enabled: !!profile?.tenant_id,
    ...defaultQueryOptions,
  });
};

// Enhanced hook to get all loans (both applications and disbursed loans)
export const useAllLoans = () => {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['all-loans', profile?.tenant_id],
    queryFn: async () => {
      if (!profile?.tenant_id) throw new Error('No tenant ID available');

      // Fetch loan applications
      const { data: applications, error: appsError } = await supabase
        .from('loan_applications')
        .select(`
          *,
          clients(first_name, last_name, client_number, phone, email),
          loan_products(
            name, 
            short_name, 
            currency_code, 
            default_nominal_interest_rate,
            min_principal,
            max_principal,
            default_term,
            min_term,
            max_term
          )
        `)
        .eq('tenant_id', profile.tenant_id)
        .order('created_at', { ascending: false });

      if (appsError) {
        console.error('Loan applications error:', appsError);
        throw new Error(`Failed to fetch loan applications: ${appsError.message}`);
      }

      // Fetch actual loans (disbursed)
      const { data: loans, error: loansError } = await supabase
        .from('loans')
        .select(`
          *,
          clients(first_name, last_name, client_number, phone, email),
          loan_products(name, short_name, currency_code),
          loan_disbursements(disbursed_by, disbursement_date)
        `)
        .eq('tenant_id', profile.tenant_id)
        .order('created_at', { ascending: false });

      if (loansError) {
        console.error('Loans error:', loansError);
        throw new Error(`Failed to fetch loans: ${loansError.message}`);
      }

      // Combine and normalize data
      const normalizedApplications = applications?.map(app => ({
        ...app,
        type: 'application',
        amount: app.requested_amount,
        number: app.application_number,
        term: app.requested_term,
        disbursement_date: null,
        outstanding_balance: null,
        next_repayment_date: null
      })) || [];

      const normalizedLoans = loans?.map(loan => ({
        ...loan,
        type: 'loan',
        amount: loan.principal_amount,
        number: loan.loan_number,
        term: loan.term_months,
        requested_amount: loan.principal_amount,
        requested_term: loan.term_months
      })) || [];

      return [...normalizedApplications, ...normalizedLoans];
    },
    enabled: !!profile?.tenant_id,
    ...defaultQueryOptions,
  });
};

// Create Loan Application
export const useCreateLoanApplication = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async (application: Omit<LoanApplication, 'id' | 'created_at' | 'updated_at' | 'tenant_id' | 'application_number' | 'submitted_at'>) => {
      if (!profile?.tenant_id) throw new Error('No tenant ID available');

      // Generate application number
      const appNumber = `LA-${Date.now()}`;

      const { data, error } = await supabase
        .from('loan_applications')
        .insert([{
          ...application,
          tenant_id: profile.tenant_id,
          application_number: appNumber,
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Invalidate all related queries for better data consistency
      queryClient.invalidateQueries({ queryKey: ['loan-applications'] });
      queryClient.invalidateQueries({ queryKey: ['all-loans'] });
      queryClient.invalidateQueries({ queryKey: ['client-loans'] });
      queryClient.invalidateQueries({ queryKey: ['client-loans-dialog'] });
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-data'] });
      toast({
        title: "Success",
        description: "Loan application created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

// Loan Schedules Hook with Payment Data
export const useLoanSchedules = (loanId?: string) => {
  return useQuery({
    queryKey: ['loan-schedules', loanId],
    queryFn: async () => {
      if (!loanId) throw new Error('No loan ID provided');

      // Get loan schedules
      const { data: schedules, error: scheduleError } = await supabase
        .from('loan_schedules')
        .select('*')
        .eq('loan_id', loanId)
        .order('installment_number', { ascending: true });
      
      if (scheduleError) throw scheduleError;

      // Get actual payments for this loan
      const { data: payments, error: paymentsError } = await supabase
        .from('transactions')
        .select(`
          id,
          amount,
          transaction_date,
          payment_status,
          description,
          external_transaction_id,
          mpesa_receipt_number
        `)
        .eq('loan_id', loanId)
        .eq('transaction_type', 'loan_repayment')
        .eq('payment_status', 'completed')
        .order('transaction_date', { ascending: true });
      
      if (paymentsError) throw paymentsError;

      // Calculate actual paid amounts for each schedule installment
      const enhancedSchedules = (schedules || []).map(schedule => {
        // Calculate payments that apply to this schedule installment
        const schedulePayments = (payments || []).filter(payment => {
          const paymentDate = new Date(payment.transaction_date);
          const scheduleDate = new Date(schedule.due_date);
          
          // Consider payments made up to this schedule's due date
          return paymentDate <= scheduleDate;
        });

        // Calculate total payments allocated to this and previous installments
        let totalPaid = 0;
        let remainingToPay = Number(schedule.total_amount);
        
        // Allocate payments chronologically across installments
        for (const payment of schedulePayments) {
          const paymentAmount = Number(payment.amount);
          if (totalPaid < Number(schedule.total_amount)) {
            const allocationToThisSchedule = Math.min(paymentAmount, remainingToPay);
            totalPaid += allocationToThisSchedule;
            remainingToPay -= allocationToThisSchedule;
          }
        }

        const actualPaidAmount = Math.min(totalPaid, Number(schedule.total_amount));
        const actualOutstanding = Math.max(0, Number(schedule.total_amount) - actualPaidAmount);
        
        let paymentStatus: 'paid' | 'partial' | 'unpaid' = 'unpaid';
        if (actualPaidAmount >= Number(schedule.total_amount)) {
          paymentStatus = 'paid';
        } else if (actualPaidAmount > 0) {
          paymentStatus = 'partial';
        }

        return {
          ...schedule,
          paid_amount: actualPaidAmount,
          outstanding_amount: actualOutstanding,
          payment_status: paymentStatus,
          actual_payments: schedulePayments
        };
      });
      
      return enhancedSchedules as (LoanSchedule & { 
        actual_payments: Array<{
          id: string;
          amount: number;
          transaction_date: string;
          payment_status: string;
          description?: string;
          external_transaction_id?: string;
          mpesa_receipt_number?: string;
        }>;
      })[];
    },
    enabled: !!loanId,
  });
};

// Generate Loan Schedule
export const useGenerateLoanSchedule = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      loanId, 
      principal, 
      interestRate, 
      termMonths, 
      startDate 
    }: { 
      loanId: string; 
      principal: number; 
      interestRate: number; 
      termMonths: number; 
      startDate: string;
    }) => {
      // Use unified interest calculation library
      const interestResult = calculateReducingBalanceInterest({
        principal,
        annualRate: interestRate,
        termInMonths: termMonths,
        calculationMethod: 'reducing_balance'
      });
      const monthlyPayment = interestResult.monthlyPayment;

      const schedules: Omit<LoanSchedule, 'id' | 'created_at'>[] = [];
      let remainingBalance = principal;

      for (let i = 1; i <= termMonths; i++) {
        const interestAmount = calculateMonthlyInterest(remainingBalance, interestRate);
        const principalAmount = monthlyPayment - interestAmount;
        const dueDate = new Date(startDate);
        dueDate.setMonth(dueDate.getMonth() + i);

        remainingBalance -= principalAmount;

        schedules.push({
          loan_id: loanId,
          installment_number: i,
          due_date: dueDate.toISOString().split('T')[0],
          principal_amount: principalAmount,
          interest_amount: interestAmount,
          fee_amount: 0,
          total_amount: monthlyPayment,
          paid_amount: 0,
          outstanding_amount: monthlyPayment,
          payment_status: 'unpaid'
        });
      }

      const { data, error } = await supabase
        .from('loan_schedules')
        .insert(schedules)
        .select();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['loan-schedules', variables.loanId] });
      toast({
        title: "Success",
        description: "Loan schedule generated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

// Collection Cases Hook
export const useCollectionCases = () => {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['collection-cases', profile?.tenant_id],
    queryFn: async () => {
      if (!profile?.tenant_id) throw new Error('No tenant ID available');

      const { data, error } = await supabase
        .from('loan_collections')
        .select(`
          *,
          loans(loan_number, principal_amount, client_id),
          clients(first_name, last_name, phone)
        `)
        .eq('tenant_id', profile.tenant_id)
        .eq('collection_status', 'active')
        .order('days_overdue', { ascending: false });
      
      if (error) throw error;
      return data as any[];
    },
    enabled: !!profile?.tenant_id,
  });
};

// Process Loan Payment - DEPRECATED: Use useLoanTransactionManager instead
export const useProcessLoanPayment = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async (payment: Omit<LoanPayment, 'id' | 'created_at' | 'tenant_id'>) => {
      if (!profile?.tenant_id) throw new Error('No tenant ID available');

      const { data, error } = await supabase
        .from('loan_payments')
        .insert([{
          ...payment,
          tenant_id: profile.tenant_id,
          processed_by: profile.id,
        }])
        .select()
        .single();
      
      if (error) throw error;

      // The database trigger will automatically:
      // 1. Calculate if overpayment occurred
      // 2. Transfer overpaid amount to savings account
      // 3. Auto-close loan if fully paid
      // 4. Update loan schedules
      // Real-time updates will handle UI refresh automatically

      return data;
    },
    onSuccess: (result, variables) => {
      // Invalidate all related queries for better data consistency
      queryClient.invalidateQueries({ queryKey: ['loan-schedules', variables.loan_id] });
      queryClient.invalidateQueries({ queryKey: ['collection-cases'] });
      queryClient.invalidateQueries({ queryKey: ['client-loans'] });
      queryClient.invalidateQueries({ queryKey: ['client-loans-dialog'] });
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-data'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['savings-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['savings-transactions'] });
      
      toast({
        title: "Payment Processed",
        description: "Payment processed successfully. If overpayment occurred, excess amount has been transferred to savings account and loan has been auto-closed.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

// Loan Approvals Hook
export const useLoanApprovals = () => {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['loan-approvals', profile?.tenant_id],
    queryFn: async () => {
      if (!profile?.tenant_id) throw new Error('No tenant ID available');

      const { data, error } = await supabase
        .from('loan_approvals')
        .select(`
          *,
          loan_applications(application_number, requested_amount),
          profiles!approver_id(first_name, last_name)
        `)
        .eq('tenant_id', profile.tenant_id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as any[];
    },
    enabled: !!profile?.tenant_id,
  });
};

// Approve/Reject Loan Application - FIXED VERSION
export const useProcessLoanApproval = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async (approval: {
      loan_application_id: string;
      action: 'approve' | 'reject' | 'request_changes' | 'undo_approval';
      comments?: string;
      approved_amount?: number;
      approved_term?: number;
      approved_interest_rate?: number;
      approval_date?: string;
      conditions?: string;
    }) => {
      if (!profile?.tenant_id || !profile?.id) {
        throw new Error('No user context');
      }

      // Get current loan application
      const { data: loanApp, error: loanError } = await supabase
        .from('loan_applications')
        .select(`
          *,
          loan_products (
            name,
            min_principal,
            max_principal,
            min_term,
            max_term,
            default_nominal_interest_rate
          )
        `)
        .eq('id', approval.loan_application_id)
        .single();
      
      if (loanError || !loanApp) throw new Error('Loan application not found');

      // Check if approval workflow is required
      const { data: workflow, error: workflowError } = await supabase
        .from('approval_workflows')
        .select('*')
        .eq('tenant_id', profile.tenant_id)
        .eq('action_type', 'loan_approval')
        .eq('is_active', true)
        .single();

      // If no workflow exists, use simple approval
      if (workflowError || !workflow) {
        return await processSimpleApproval(approval, loanApp, profile);
      }

      // Use multi-level approval workflow
      return await processMultiLevelApproval(approval, loanApp, profile, workflow);
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['loan-applications'] });
      queryClient.invalidateQueries({ queryKey: ['loan-approvals'] });
      queryClient.invalidateQueries({ queryKey: ['approval-requests'] });
      queryClient.invalidateQueries({ queryKey: ['pending-approvals'] });
      
      toast({
        title: "Success",
        description: result.message || "Loan approval processed successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

// Helper function for simple approval (no workflow)
async function processSimpleApproval(
  approval: any,
  loanApp: any,
  profile: any
) {
  // Validate approval amounts against product limits
  if (approval.action === 'approve') {
    const product = loanApp.loan_products;
    const approvedAmount = approval.approved_amount || loanApp.requested_amount;
    const approvedTerm = approval.approved_term || loanApp.requested_term;

        if (product?.min_principal && approvedAmount < product.min_principal) {
          throw new Error(`Approved amount (${approvedAmount.toLocaleString()}) is below product minimum (${product.min_principal.toLocaleString()})`);
        }

        if (product?.max_principal && approvedAmount > product.max_principal) {
          throw new Error(`Approved amount (${approvedAmount.toLocaleString()}) exceeds product maximum (${product.max_principal.toLocaleString()})`);
        }

        if (product?.min_term && approvedTerm < product.min_term) {
          throw new Error(`Approved term (${approvedTerm} months) is below product minimum (${product.min_term} months)`);
        }

        if (product?.max_term && approvedTerm > product.max_term) {
          throw new Error(`Approved term (${approvedTerm} months) exceeds product maximum (${product.max_term} months)`);
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

      // Update loan application status
      let newStatus: string;
      if (approval.action === 'approve') {
        newStatus = 'pending_disbursement';
      } else if (approval.action === 'reject') {
        newStatus = 'rejected';
      } else if (approval.action === 'undo_approval') {
        newStatus = 'pending';
      } else {
        newStatus = 'under_review';
      }

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

  // If approved, create loan record
      if (approval.action === 'approve') {
    await createLoanRecord(loanApp, approval, profile);
  }

  // If undoing approval, delete any pending loan records
  if (approval.action === 'undo_approval') {
    const { error: deleteLoanError } = await supabase
      .from('loans')
      .delete()
      .eq('application_id', approval.loan_application_id)
      .eq('status', 'pending_disbursement');
    
    if (deleteLoanError) console.warn('Error deleting pending loan:', deleteLoanError);
  }

  return { ...approvalData, message: "Loan approval processed successfully" };
}

// Helper function for multi-level approval workflow
async function processMultiLevelApproval(
  approval: any,
  loanApp: any,
  profile: any,
  workflow: any
) {
  // Check if user has approval authority for this workflow
  const { data: userRole, error: roleError } = await supabase
    .from('approval_workflow_roles')
    .select('*')
    .eq('workflow_id', workflow.id)
    .eq('tenant_id', profile.tenant_id)
    .eq('role', profile.role)
    .single();

  if (roleError || !userRole) {
    throw new Error('You do not have approval authority for this loan');
  }

  // Check if approval request exists
  const { data: approvalRequest, error: requestError } = await supabase
    .from('approval_requests')
    .select('*')
    .eq('workflow_id', workflow.id)
    .eq('record_id', approval.loan_application_id)
    .eq('status', 'pending')
    .single();

  if (requestError || !approvalRequest) {
    throw new Error('No pending approval request found for this loan');
  }

  // Check if user has already approved this request
  const { data: existingAction, error: actionError } = await supabase
    .from('approval_actions')
    .select('*')
    .eq('approval_request_id', approvalRequest.id)
    .eq('approver_id', profile.id)
    .maybeSingle();

  if (actionError) throw actionError;
  if (existingAction) {
    throw new Error('You have already acted on this approval request');
  }

  // Create approval action
  const { data: action, error: actionCreateError } = await supabase
    .from('approval_actions')
    .insert([{
      approval_request_id: approvalRequest.id,
      approver_id: profile.id,
      action: approval.action === 'approve' ? 'approved' : 'rejected',
      comments: approval.comments,
      approval_level: userRole.approval_level,
      tenant_id: profile.tenant_id,
    }])
    .select()
    .single();

  if (actionCreateError) throw actionCreateError;

  // Count total approvals for this request
  const { data: allActions, error: countError } = await supabase
    .from('approval_actions')
    .select('action')
    .eq('approval_request_id', approvalRequest.id)
    .eq('action', 'approved');

  if (countError) throw countError;

  const approvalCount = allActions?.length || 0;
  const rejectionCount = await getRejectionCount(approvalRequest.id);

  // Determine new status based on workflow rules
  let newRequestStatus = 'pending';
  let newApplicationStatus = loanApp.status;

  if (rejectionCount > 0) {
    newRequestStatus = 'rejected';
    newApplicationStatus = 'rejected';
  } else if (approvalCount >= workflow.minimum_approvers) {
    newRequestStatus = 'approved';
    newApplicationStatus = 'pending_disbursement';
  }

  // Update approval request status
  const { error: updateRequestError } = await supabase
    .from('approval_requests')
    .update({
      status: newRequestStatus,
      completed_at: newRequestStatus !== 'pending' ? new Date().toISOString() : null,
    })
    .eq('id', approvalRequest.id);

  if (updateRequestError) throw updateRequestError;

  // Update loan application status
  const { error: updateAppError } = await supabase
    .from('loan_applications')
    .update({
      status: newApplicationStatus,
      reviewed_by: profile.id,
      reviewed_at: new Date().toISOString(),
      approval_notes: approval.comments,
      final_approved_amount: approval.approved_amount,
      final_approved_term: approval.approved_term,
      final_approved_interest_rate: approval.approved_interest_rate,
    })
    .eq('id', approval.loan_application_id);

  if (updateAppError) throw updateAppError;

  // Create loan record if fully approved
  if (newApplicationStatus === 'pending_disbursement') {
    await createLoanRecord(loanApp, approval, profile);
  }

  // Create loan approval record for audit trail
  const { error: approvalRecordError } = await supabase
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
    }]);

  if (approvalRecordError) console.warn('Error creating approval record:', approvalRecordError);

  const message = newApplicationStatus === 'pending_disbursement' 
    ? `Loan approved! ${approvalCount}/${workflow.minimum_approvers} approvals received. Ready for disbursement.`
    : newApplicationStatus === 'rejected'
    ? 'Loan rejected. No further approvals needed.'
    : `Approval recorded. ${approvalCount}/${workflow.minimum_approvers} approvals received.`;

  return { ...action, message };
}

// Helper function to get rejection count
async function getRejectionCount(approvalRequestId: string): Promise<number> {
  const { data, error } = await supabase
    .from('approval_actions')
    .select('action')
    .eq('approval_request_id', approvalRequestId)
    .eq('action', 'rejected');

  if (error) throw error;
  return data?.length || 0;
}

// Helper function to create loan record
async function createLoanRecord(loanApp: any, approval: any, profile: any) {
  // Check if loan already exists for this application
  const { data: existingLoan, error: checkError } = await supabase
    .from('loans')
    .select('id, status')
    .eq('application_id', approval.loan_application_id)
    .maybeSingle();
  
  if (checkError && checkError.code !== 'PGRST116') throw checkError;
  
  // Only create loan if none exists
  if (!existingLoan) {
        const loanNumber = `LN-${Date.now()}`;
    
    // Get full loan product details for snapshot preservation
    const { data: productSnapshot, error: productError } = await supabase
      .from('loan_products')
      .select('*')
      .eq('id', loanApp.loan_product_id)
      .single();

    if (productError) throw new Error('Failed to fetch loan product details for snapshot');
        
        const { data: loanData, error: loanError } = await supabase
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
        creation_interest_rate: (() => {
          const r = Number(approval.approved_interest_rate ?? productSnapshot?.default_nominal_interest_rate ?? 10);
          return r > 1 ? r / 100 : r;
        })(),
        creation_term_months: approval.approved_term || loanApp.requested_term,
        creation_principal: approval.approved_amount || loanApp.requested_amount,
        creation_days_in_year_type: productSnapshot?.days_in_year_type || '365',
        creation_days_in_month_type: productSnapshot?.days_in_month_type || 'actual',
        creation_amortization_method: productSnapshot?.amortization_method || 'equal_installments',
        creation_interest_recalculation_enabled: productSnapshot?.interest_recalculation_enabled || false,
        creation_compounding_enabled: productSnapshot?.compounding_enabled || false,
        creation_reschedule_strategy_method: productSnapshot?.reschedule_strategy_method || 'reduce_emi',
        creation_pre_closure_interest_calculation_rule: productSnapshot?.pre_closure_interest_calculation_rule || 'till_pre_close_date',
        creation_advance_payments_adjustment_type: productSnapshot?.advance_payments_adjustment_type || 'reduce_emi',
          }])
          .select()
          .single();
        
        if (loanError) throw loanError;
      }
}

// Loan Disbursements Hook
export const useLoanDisbursements = () => {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['loan-disbursements', profile?.tenant_id],
    queryFn: async () => {
      if (!profile?.tenant_id) throw new Error('No tenant ID available');

      const { data, error } = await supabase
        .from('loan_disbursements')
        .select(`
          *,
          loan_applications(application_number, final_approved_amount),
          profiles!disbursed_by(first_name, last_name)
        `)
        .eq('tenant_id', profile.tenant_id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as any[];
    },
    enabled: !!profile?.tenant_id,
  });
};

// Process Loan Disbursement
export const useProcessLoanDisbursement = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { profile } = useAuth();
  const { disburseMifosLoan, isConfigured: isMifosConfigured } = useMifosIntegration();
  const accountingDisburse = useLoanDisbursementAccounting();
  const chargeAccounting = useLoanChargeAccounting();

  return useMutation({
    mutationFn: async (disbursement: {
      loan_application_id: string;
      client_id?: string;
      disbursed_amount: number;
      disbursement_date: string;
      disbursement_method: 'bank_transfer' | 'mpesa' | 'cash' | 'check' | 'transfer_to_savings';
      bank_account_name?: string;
      bank_account_number?: string;
      bank_name?: string;
      mpesa_phone?: string;
      reference_number?: string;
      savings_account_id?: string;
    }) => {
      if (!profile?.tenant_id) throw new Error('No tenant ID available');

      // Fetch loan application to validate client context and gather product info
      const { data: application, error: appFetchError } = await supabase
        .from('loan_applications')
        .select('id, client_id, loan_product_id, final_approved_amount, requested_amount, linked_savings_account_id, selected_charges')
        .eq('id', disbursement.loan_application_id)
        .single();

      if (appFetchError || !application) {
        console.error('Failed to fetch loan application for disbursement validation:', appFetchError);
        throw new Error('Loan application not found');
      }

      // Determine disbursement-time fees that must be collected via account transfer
      let totalTransferFees = 0;
      let feeNamesForTransfer: string[] = [];
      let savingsAccountIdForFees: string | undefined = undefined;

      // Load product fee mappings (if any)
      const { data: product, error: prodErr } = await supabase
        .from('loan_products')
        .select('fee_mappings')
        .eq('id', application.loan_product_id)
        .maybeSingle();
      if (prodErr) console.warn('Could not load loan product fee mappings', prodErr);
      const mappedFeeIds = new Set(
        Array.isArray(product?.fee_mappings)
          ? product!.fee_mappings.map((m: any) => m.fee_id || m.feeType).filter(Boolean)
          : []
      );

      // Load active fee structures for this tenant
      const { data: feeStructs, error: fsErr } = await supabase
        .from('fee_structures')
        .select('*')
        .eq('tenant_id', profile.tenant_id)
        .eq('is_active', true);
      if (fsErr) console.warn('Could not fetch fee structures', fsErr);
      const baseAmount = Number(
        disbursement.disbursed_amount || (application as any).final_approved_amount || (application as any).requested_amount || 0
      );

      const disbursementTransferFees = (feeStructs || []).filter((f: any) => {
        const chargeTime = (f.charge_time_type || '').toLowerCase();
        const payBy = (f.charge_payment_by || '').toLowerCase();
        const timeMatch = ['on_disbursement', 'disbursement', 'upfront'].includes(chargeTime);
        const paymentMatch = payBy.includes('transfer');
        const mappingMatch = mappedFeeIds.size === 0 || mappedFeeIds.has(f.id);
        const typeMatch = (f.fee_type || '').toLowerCase().includes('loan');
        return timeMatch && paymentMatch && mappingMatch && typeMatch;
      });

      for (const f of disbursementTransferFees) {
        const calc = calculateFeeAmount({
          id: f.id,
          name: f.name,
          calculation_type: (f.calculation_type === 'percentage' ? 'percentage' : (f.calculation_type === 'flat' ? 'flat' : 'fixed')),
          amount: Number(f.amount),
          min_amount: f.min_amount ?? null,
          max_amount: f.max_amount ?? null,
          fee_type: f.fee_type,
          charge_time_type: f.charge_time_type,
        } as any, baseAmount);
        totalTransferFees += calc.calculated_amount;
        feeNamesForTransfer.push(f.name);
      }

      // If fees must be collected via transfer, ensure a valid savings account is available
      if (totalTransferFees > 0) {
      if (disbursement.disbursement_method === 'transfer_to_savings') {
          savingsAccountIdForFees = disbursement.savings_account_id;
          if (!savingsAccountIdForFees) {
          throw new Error('Please select a savings account to complete disbursement to savings.');
        }
          // Validate ownership/active
          const { data: sa, error: saErr } = await supabase
          .from('savings_accounts')
          .select('id, client_id, is_active')
            .eq('id', savingsAccountIdForFees)
          .single();
          if (saErr || !sa) throw new Error('Savings account not found.');
          if (sa.client_id !== application.client_id) throw new Error('Selected savings account does not belong to the loan\'s client.');
          if (!sa.is_active) throw new Error('Selected savings account is not active.');
        } else {
          // Prefer linked savings account if set on application; otherwise use client's first active
          const preferredId = (application as any).linked_savings_account_id as string | null;
          let sa: any = null;

          if (preferredId) {
            const { data, error } = await supabase
              .from('savings_accounts')
              .select('id, client_id, is_active, account_balance')
              .eq('id', preferredId)
              .single();
            if (!error) sa = data;
          }

          if (!sa) {
            const { data, error } = await supabase
              .from('savings_accounts')
              .select('id, client_id, is_active, account_balance')
              .eq('client_id', application.client_id)
              .eq('is_active', true)
              .order('opened_date', { ascending: true })
              .maybeSingle();
            if (error || !data) {
              throw new Error('No active savings account found for this client. Link a savings account or use "Disburse to savings".');
            }
            sa = data;
          }

          if (sa.client_id !== application.client_id || !sa.is_active) {
            throw new Error('Linked savings account is invalid for this client.');
          }

          savingsAccountIdForFees = sa.id;
          if (Number(sa.account_balance || 0) < totalTransferFees) {
            throw new Error(`Insufficient savings balance (KES ${(sa.account_balance || 0).toLocaleString()}) to cover disbursement-time fees (KES ${totalTransferFees.toLocaleString()}). Link a different account, top up, or use "Disburse to savings".`);
          }
        }
      }

      console.log('Starting disbursement process for application:', disbursement.loan_application_id);
      console.log('Disbursement data:', disbursement);
      // Check if loan has already been disbursed
      console.log('Checking for existing disbursements for application:', disbursement.loan_application_id);
      const { data: existingDisbursement, error: disbursementCheckError } = await supabase
        .from('loan_disbursements')
        .select('loan_id')
        .eq('loan_application_id', disbursement.loan_application_id)
        .single();
      
      if (disbursementCheckError && disbursementCheckError.code !== 'PGRST116') {
        console.error('Error checking disbursement:', disbursementCheckError);
        throw disbursementCheckError;
      }
      
      // If already disbursed, check if we should allow re-disbursement or return existing loan
      if (existingDisbursement) {
        console.log('Found existing disbursement, checking loan status...');
        
        // Get the existing loan to check its status
        const { data: existingLoan, error: loanError } = await supabase
          .from('loans')
          .select('id, status, loan_number')
          .eq('id', existingDisbursement.loan_id)
          .single();
          
        if (!loanError && existingLoan && existingLoan.status === 'active') {
          console.log('Loan already active:', existingLoan);
          // Loan is already active, return success without doing anything
          return { 
            loan: existingLoan, 
            disbursement: existingDisbursement,
            message: 'Loan was already disbursed and is active'
          };
        }
      }

      // Get approved loan record created during approval (prefer latest if multiple)
      let existingLoan: any;
      const { data: loanData, error: loanFetchError } = await supabase
        .from('loans')
        .select('id, loan_number, status, client_id, mifos_loan_id, loan_product_id')
        .eq('application_id', disbursement.loan_application_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (!loanData) {
        // Enforce one-loan-per-application: do not create loans during disbursement
        // Require the loan to be created at approval stage
        throw new Error('No approved loan found for this application. Please approve the application before disbursement.');
      } else {
        // Update existing loan to active status
        const { error: statusUpdateError } = await supabase
          .from('loans')
          .update({
            status: 'active',
            disbursement_date: disbursement.disbursement_date,
          })
          .eq('id', loanData.id);
          
        if (statusUpdateError) {
          console.error('Error updating loan status:', statusUpdateError);
          throw statusUpdateError;
        }
        existingLoan = loanData;
      }

      // After we have the loan, recalculate outstanding as principal + interest + unpaid fees (+ penalties if modeled)
      try {
        const { data: scheds } = await supabase
          .from('loan_schedules')
          .select('principal_amount, interest_amount, fee_amount, payment_status')
          .eq('loan_id', existingLoan.id);
        let outstandingTotal = Number(
          (application as any).final_approved_amount || (application as any).requested_amount || disbursement.disbursed_amount || 0
        );
        if (Array.isArray(scheds) && scheds.length > 0) {
          const unpaid = scheds.filter((s: any) => (s.payment_status || '').toLowerCase() !== 'paid');
          outstandingTotal = unpaid.reduce((sum: number, s: any) => sum + Number(s.principal_amount || 0) + Number(s.interest_amount || 0) + Number(s.fee_amount || 0), 0);
        }
        await supabase
          .from('loans')
          .update({ outstanding_balance: outstandingTotal })
          .eq('id', existingLoan.id);
      } catch (e) {
        console.warn('Could not recalculate outstanding at disbursement time:', e);
      }

      // If disbursing to savings account, transfer the funds
      if (disbursement.disbursement_method === 'transfer_to_savings' && disbursement.savings_account_id) {
        // Get current balance first
        const { data: savingsAccount, error: fetchError } = await supabase
          .from('savings_accounts')
          .select('account_balance')
          .eq('id', disbursement.savings_account_id)
          .single();

        if (fetchError) throw fetchError;
        
        const newBalance = (savingsAccount.account_balance || 0) + disbursement.disbursed_amount;
        
        // Update savings account balance
        const { error: savingsError } = await supabase
          .from('savings_accounts')
          .update({
            account_balance: newBalance,
            available_balance: newBalance
          })
          .eq('id', disbursement.savings_account_id);

        if (savingsError) throw savingsError;

        // Create savings transaction
        console.log('Creating savings transaction for account:', disbursement.savings_account_id);
        const { error: transactionError } = await supabase
          .from('savings_transactions')
          .insert({
            tenant_id: profile.tenant_id,
            savings_account_id: disbursement.savings_account_id,
            transaction_type: 'deposit', // Changed from 'credit' to 'deposit'
            amount: disbursement.disbursed_amount,
            balance_after: newBalance,
            transaction_date: disbursement.disbursement_date, // Add the missing required field
            description: `Loan disbursement - ${existingLoan.loan_number}`,
            processed_by: profile.id,
          });

        if (transactionError) {
          console.error('Savings transaction error:', transactionError);
          throw transactionError;
        }
        console.log('Savings transaction created successfully');
      }

      // Create disbursement record
      const { data: disbursementData, error: disbursementError } = await supabase
        .from('loan_disbursements')
        .insert([{
          tenant_id: profile.tenant_id,
          loan_application_id: disbursement.loan_application_id,
          loan_id: existingLoan.id,
          disbursed_amount: disbursement.disbursed_amount,
          disbursement_date: disbursement.disbursement_date,
          disbursement_method: disbursement.disbursement_method,
          bank_account_name: disbursement.bank_account_name,
          bank_account_number: disbursement.bank_account_number,
          bank_name: disbursement.bank_name,
          mpesa_phone: disbursement.mpesa_phone,
          reference_number: disbursement.reference_number,
          disbursed_by: profile.id,
          status: 'completed',
        }])
        .select()
        .single();
      
      if (disbursementError) throw disbursementError;

      // Collect disbursement-time fees via account transfer from savings (if any)
      if (totalTransferFees > 0) {
        const targetSavingsId = disbursement.disbursement_method === 'transfer_to_savings'
          ? disbursement.savings_account_id
          : savingsAccountIdForFees;

        if (!targetSavingsId) {
          throw new Error('A savings account is required to collect disbursement-time fees.');
        }

        // Fetch latest balance (after deposit if we disbursed to savings)
        const { data: saNow, error: saNowErr } = await supabase
          .from('savings_accounts')
          .select('id, account_balance')
          .eq('id', targetSavingsId)
          .single();
        if (saNowErr || !saNow) throw new Error('Failed to read savings account balance.');

        const balanceAfterFees = Number(saNow.account_balance || 0) - totalTransferFees;
        if (balanceAfterFees < 0) {
          throw new Error('Savings balance is insufficient to collect fees at disbursement.');
        }

        // Update balance
        const { error: saUpdErr } = await supabase
          .from('savings_accounts')
          .update({ account_balance: balanceAfterFees, available_balance: balanceAfterFees })
          .eq('id', targetSavingsId);
        if (saUpdErr) throw saUpdErr;

        // Record savings fee transaction (single aggregated entry)
        const feeDesc = `Loan fees on disbursement - ${existingLoan.loan_number || existingLoan.id}` + (feeNamesForTransfer.length ? ` [${feeNamesForTransfer.join(', ')}]` : '');
        const { error: savTxnErr } = await supabase
          .from('savings_transactions')
          .insert({
            tenant_id: profile.tenant_id,
            savings_account_id: targetSavingsId,
            transaction_type: 'fee_charge',
            amount: totalTransferFees,
            balance_after: balanceAfterFees,
            transaction_date: disbursement.disbursement_date,
            description: feeDesc,
            processed_by: profile.id,
          });
        if (savTxnErr) throw savTxnErr;

        // Record unified transaction log linking loan and savings
        const feeTxId = `TRX-FEE-${Date.now()}`;
        const { error: txErr } = await supabase
          .from('transactions')
          .insert({
            tenant_id: profile.tenant_id,
            client_id: application.client_id,
            loan_id: existingLoan.id,
            savings_account_id: targetSavingsId,
            amount: totalTransferFees,
            transaction_type: 'fee_payment',
            payment_type: 'bank_transfer',
            payment_status: 'completed',
            transaction_date: new Date(disbursement.disbursement_date).toISOString(),
            transaction_id: feeTxId,
            description: feeDesc,
            processed_by: profile.id,
          });
        if (txErr) throw txErr;
      }

      // If Mifos is configured and loan has Mifos ID, disburse in Mifos X first
      if (false && isMifosConfigured && existingLoan.mifos_loan_id) {
        console.log('Disbursing loan in Mifos X with ID:', existingLoan.mifos_loan_id);
        
        try {
          await disburseMifosLoan.mutateAsync({
            mifosLoanId: existingLoan.mifos_loan_id,
            disbursementAmount: disbursement.disbursed_amount,
            disbursementDate: disbursement.disbursement_date,
            note: `Disbursement for loan ${existingLoan.loan_number}`,
          });
          
          console.log('Mifos X disbursement successful');
        } catch (mifosError: any) {
          console.error('Mifos X disbursement failed:', mifosError);
          throw new Error(`Mifos X disbursement failed: ${mifosError.message}`);
        }
      }

      // Generate loan repayment schedule after successful disbursement
      try {
        // First check if schedule already exists to avoid duplicates
        const { data: existingSchedule, error: scheduleCheckError } = await supabase
          .from('loan_schedules')
          .select('id')
          .eq('loan_id', existingLoan.id)
          .limit(1)
          .maybeSingle();

        if (scheduleCheckError && scheduleCheckError.code !== 'PGRST116') {
          console.warn('Error checking existing schedule:', scheduleCheckError);
        }

        if (!existingSchedule) {
          // Fetch loan product details for schedule calculation
          const { data: loanProduct, error: productError } = await supabase
            .from('loan_products')
            .select('default_nominal_interest_rate, repayment_frequency, interest_calculation_method')
            .eq('id', existingLoan.loan_product_id)
            .single();

          if (productError) {
            console.warn('Could not fetch loan product for schedule generation:', productError);
          } else {
            // Get loan details for schedule generation
            const { data: loanDetails, error: loanError } = await supabase
        .from('loans')
              .select('principal_amount, interest_rate, term_months')
              .eq('id', existingLoan.id)
              .single();

            if (!loanError && loanDetails) {
              const scheduleParams = {
                loanId: existingLoan.id,
                principal: Number(loanDetails.principal_amount || disbursement.disbursed_amount),
                interestRate: Number(loanDetails.interest_rate || loanProduct.default_nominal_interest_rate || 0) / 100, // Convert percentage to decimal
                termMonths: Number(loanDetails.term_months || 12),
                disbursementDate: disbursement.disbursement_date,
                repaymentFrequency: (loanProduct.repayment_frequency || 'monthly') as 'daily' | 'weekly' | 'bi-weekly' | 'monthly' | 'quarterly',
                calculationMethod: (loanProduct.interest_calculation_method || 'reducing_balance') as 'reducing_balance' | 'flat_rate' | 'declining_balance',
              };

              const schedule = generateLoanSchedule(scheduleParams);

              // Insert the schedule into the database
              const { error: scheduleInsertError } = await supabase
                .from('loan_schedules')
                .insert(schedule);

              if (scheduleInsertError) {
                console.error('Error inserting loan schedule:', scheduleInsertError);
                // Don't throw error - disbursement should still succeed even if schedule generation fails
              } else {
                console.log(`Generated ${schedule.length} schedule entries for loan ${existingLoan.id}`);
              }
            }
          }
        } else {
          console.log('Loan schedule already exists, skipping generation');
        }
      } catch (scheduleError) {
        console.error('Error during schedule generation:', scheduleError);
        // Don't throw - disbursement should succeed even if schedule generation fails
      }

      // Mark application as disbursed after successful loan activation
      const { error: applicationUpdateError } = await supabase
        .from('loan_applications')
        .update({
          status: 'disbursed'
        })
        .eq('id', disbursement.loan_application_id);

      if (applicationUpdateError) {
        console.error('Error updating loan application to disbursed status:', applicationUpdateError);
        throw applicationUpdateError;
      }
       console.log('Disbursement completed successfully, loan is active and application marked disbursed');

      return { loan: existingLoan, disbursement: disbursementData };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['loan-applications'] });
      queryClient.invalidateQueries({ queryKey: ['loan-disbursements'] });
      queryClient.invalidateQueries({ queryKey: ['client-loans'] });
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      queryClient.invalidateQueries({ queryKey: ['savings-accounts'] });
      queryClient.invalidateQueries({ queryKey: ['loan-schedules'] }); // Refresh schedules
      
      const message = result?.message || "Loan disbursed successfully";
      toast({
        title: "Success",
        description: message,
      });
    },
    onError: (error: any) => {
      console.error('Detailed disbursement error:', error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      toast({
        title: "Error",
        description: error.message || "Failed to disburse loan. Please try again.",
        variant: "destructive",
      });
    },
  });
};

// Update Loan Application details (term, linked savings, selected charges)
export const useUpdateLoanApplicationDetails = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async (payload: {
      loan_application_id: string;
      requested_term?: number;
      linked_savings_account_id?: string | null;
      selected_charges?: any[];
    }) => {
      if (!profile?.tenant_id) throw new Error('No tenant ID available');

      const updates: Record<string, any> = {};
      if (typeof payload.requested_term === 'number') updates.requested_term = payload.requested_term;
      if (payload.linked_savings_account_id !== undefined) updates.linked_savings_account_id = payload.linked_savings_account_id || null;
      if (payload.selected_charges !== undefined) updates.selected_charges = payload.selected_charges;

      if (Object.keys(updates).length === 0) return true;

      const { error } = await supabase
        .from('loan_applications')
        .update(updates)
        .eq('id', payload.loan_application_id);
      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loan-applications'] });
      queryClient.invalidateQueries({ queryKey: ['all-loans'] });
      queryClient.invalidateQueries({ queryKey: ['client-loans'] });
      queryClient.invalidateQueries({ queryKey: ['client-loans-dialog'] });
      toast({ title: 'Success', description: 'Loan details updated.' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message || 'Failed to update loan details', variant: 'destructive' });
    }
  });
};

// Undo Loan Disbursement - return application to approval stage
export const useUndoLoanDisbursement = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { profile } = useAuth();

  return useMutation({
    mutationFn: async ({ loan_application_id }: { loan_application_id: string }) => {
      if (!profile?.tenant_id) throw new Error('No tenant ID available');

      // Find most recent disbursement for this application
      const { data: disb, error: disbErr } = await supabase
        .from('loan_disbursements')
        .select('id, loan_id')
        .eq('loan_application_id', loan_application_id)
        .order('created_at', { ascending: false })
        .maybeSingle();
      if (disbErr) throw disbErr;

      // If a loan exists, remove schedules then the loan
      let loanId = disb?.loan_id as string | undefined;
      if (!loanId) {
        const { data: loan } = await supabase
          .from('loans')
          .select('id')
          .eq('application_id', loan_application_id)
          .maybeSingle();
        loanId = loan?.id;
      }
      if (loanId) {
        await supabase.from('loan_schedules').delete().eq('loan_id', loanId);
        await supabase.from('loans').delete().eq('id', loanId);
      }

      // Remove disbursement record(s)
      await supabase.from('loan_disbursements').delete().eq('loan_application_id', loan_application_id);

      // Send application back to approval stage
      const { error: appErr } = await supabase
        .from('loan_applications')
        .update({ status: 'pending' })
        .eq('id', loan_application_id);
      if (appErr) throw appErr;

      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loan-applications'] });
      queryClient.invalidateQueries({ queryKey: ['loan-disbursements'] });
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      toast({ title: 'Success', description: 'Disbursement undone. Application returned to approval.' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message || 'Failed to undo disbursement', variant: 'destructive' });
    },
  });
};

// Client Loans Hook - for fetching loans for a specific client
export const useClientLoans = (clientId?: string) => {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['client-loans', clientId],
    queryFn: async () => {
      if (!clientId) return [];
      
      const { data, error } = await supabase
        .from('loans')
        .select(`
          *,
          loan_products(name, short_name),
          loan_schedules(*)
        `)
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!clientId,
  });
};

// Update Client Details Dialog to show both loans and applications
export const useClientLoansForDialog = (clientId?: string) => {
  return useQuery({
    queryKey: ['client-loans-dialog', clientId],
    queryFn: async () => {
      if (!clientId) return { loans: [], loanApplications: [] };
      
      // Fetch both loans and loan applications
      const [loansResult, applicationsResult] = await Promise.all([
        supabase
          .from('loans')
          .select(`
            *,
            loan_products(name, short_name)
          `)
          .eq('client_id', clientId)
          .order('created_at', { ascending: false }),
        
        supabase
          .from('loan_applications')
          .select(`
            *,
            loan_products(name, short_name)
          `)
          .eq('client_id', clientId)
          .order('created_at', { ascending: false })
      ]);
      
      if (loansResult.error) throw loansResult.error;
      if (applicationsResult.error) throw applicationsResult.error;
      
      return {
        loans: loansResult.data || [],
        loanApplications: applicationsResult.data || []
      };
    },
    enabled: !!clientId,
  });
};