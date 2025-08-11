import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { useMifosIntegration } from './useMifosIntegration';
import { defaultQueryOptions } from './useOptimizedQueries';
import { useLoanDisbursementAccounting, useLoanChargeAccounting } from './useLoanAccounting';
import { calculateFeeAmount } from '@/lib/fee-calculation';
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
          clients!loan_applications_client_id_fkey(first_name, last_name, client_number, phone, email),
          loan_products!loan_applications_loan_product_id_fkey(
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
          clients!loan_applications_client_id_fkey(first_name, last_name, client_number, phone, email),
          loan_products!loan_applications_loan_product_id_fkey(
            name, 
            short_name, 
            currency_code, 
            default_nominal_interest_rate,
            min_principal,
            max_principal,
            default_term,
            min_term,
            max_term
          ),
          reviewed_by_profile:profiles!reviewed_by(first_name, last_name)
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
          clients!loans_client_id_fkey(first_name, last_name, client_number, phone, email),
          loan_products!loans_loan_product_id_fkey(name, short_name, currency_code),
          loan_disbursements!loan_disbursements_loan_id_fkey(
            disbursed_by,
            disbursement_date,
            disbursed_by_profile:profiles!disbursed_by(first_name, last_name)
          )
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

// Loan Schedules Hook
export const useLoanSchedules = (loanId?: string) => {
  return useQuery({
    queryKey: ['loan-schedules', loanId],
    queryFn: async () => {
      if (!loanId) throw new Error('No loan ID provided');

      const { data, error } = await supabase
        .from('loan_schedules')
        .select('*')
        .eq('loan_id', loanId)
        .order('installment_number', { ascending: true });
      
      if (error) throw error;
      return data as LoanSchedule[];
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
      // Calculate monthly payment using standard loan formula
      const monthlyRate = interestRate / 100 / 12;
      const monthlyPayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / (Math.pow(1 + monthlyRate, termMonths) - 1);

      const schedules: Omit<LoanSchedule, 'id' | 'created_at'>[] = [];
      let remainingBalance = principal;

      for (let i = 1; i <= termMonths; i++) {
        const interestAmount = remainingBalance * monthlyRate;
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

// Process Loan Payment
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

      // Update loan schedule if schedule_id is provided
      if (payment.schedule_id) {
        const { error: updateError } = await supabase
          .from('loan_schedules')
          .update({
            paid_amount: payment.payment_amount,
            outstanding_amount: 0,
            payment_status: 'paid'
          })
          .eq('id', payment.schedule_id);

        if (updateError) throw updateError;
      }

      return data;
    },
    onSuccess: (_, variables) => {
      // Invalidate all related queries for better data consistency
      queryClient.invalidateQueries({ queryKey: ['loan-schedules', variables.loan_id] });
      queryClient.invalidateQueries({ queryKey: ['collection-cases'] });
      queryClient.invalidateQueries({ queryKey: ['client-loans'] });
      queryClient.invalidateQueries({ queryKey: ['client-loans-dialog'] });
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-data'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast({
        title: "Success",
        description: "Payment processed successfully",
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

// Approve/Reject Loan Application
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
      if (!profile?.tenant_id) throw new Error('No tenant ID available');

      // Get loan application details with product information
      const { data: loanApplication, error: fetchError } = await supabase
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
      
      if (fetchError || !loanApplication) throw new Error('Loan application not found');

      // Validate approval amounts against product limits
      if (approval.action === 'approve') {
        const product = loanApplication.loan_products;
        const approvedAmount = approval.approved_amount || loanApplication.requested_amount;
        const approvedTerm = approval.approved_term || loanApplication.requested_term;

        console.log('Validating approval against product limits:', {
          product: product?.name,
          approvedAmount,
          limits: { min: product?.min_principal, max: product?.max_principal },
          approvedTerm,
          termLimits: { min: product?.min_term, max: product?.max_term }
        });

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

      // If approved, create loan record immediately
      if (approval.action === 'approve') {
        const loanNumber = `LN-${Date.now()}`;
        
        const { data: loanData, error: loanError } = await supabase
          .from('loans')
          .insert([{
            tenant_id: profile.tenant_id,
            client_id: loanApplication.client_id,
            loan_product_id: loanApplication.loan_product_id,
            application_id: approval.loan_application_id, // Link back to application
            loan_number: loanNumber,
            principal_amount: approval.approved_amount || loanApplication.requested_amount,
            // Normalize interest rate: accept 10 (percent) or 0.10 (fraction)
            interest_rate: (() => {
              const r = (approval.approved_interest_rate ?? 10);
              return r > 1 ? r / 100 : r;
            })(),
            term_months: approval.approved_term || loanApplication.requested_term,
            outstanding_balance: approval.approved_amount || loanApplication.requested_amount,
            status: 'pending_disbursement',
            loan_officer_id: profile.id,
          }])
          .select()
          .single();
        
        if (loanError) throw loanError;
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

      return approvalData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loan-applications'] });
      queryClient.invalidateQueries({ queryKey: ['loan-approvals'] });
      toast({
        title: "Success",
        description: "Loan approval processed successfully",
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
        .select('id, client_id, loan_product_id, final_approved_amount, requested_amount')
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
          // Use the client\'s first active savings account
          const { data: sa, error: saErr } = await supabase
            .from('savings_accounts')
            .select('id, client_id, is_active, account_balance')
            .eq('client_id', application.client_id)
            .eq('is_active', true)
            .order('opened_date', { ascending: true })
            .maybeSingle();
          if (saErr || !sa) {
            throw new Error('No active savings account found for this client. Link a savings account or use "Disburse to savings".');
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

      // Get approved loan record created during approval
      let existingLoan: any;
      const { data: loanData, error: loanFetchError } = await supabase
        .from('loans')
        .select('id, loan_number, status, client_id, mifos_loan_id, loan_product_id')
        .eq('application_id', disbursement.loan_application_id)
        .single();
      
      if (loanFetchError) {
        // If no pending loan found, we need to create one from the approved application
        console.log('No existing loan found, fetching approved loan application');
        const { data: loanApplication, error: appError } = await supabase
          .from('loan_applications')
          .select('*')
          .eq('id', disbursement.loan_application_id)
          .in('status', ['pending_disbursement', 'approved']) // Accept both statuses
          .single();
          
        if (appError || !loanApplication) throw new Error('Approved loan application not found');
        
        // Create loan record for disbursement
        const loanNumber = `LN-${Date.now()}`;
        console.log('Creating loan record and setting status to active for application ID:', disbursement.loan_application_id);
        const { data: newLoan, error: createError } = await supabase
          .from('loans')
          .insert({
            tenant_id: profile.tenant_id,
            client_id: loanApplication.client_id,
            loan_product_id: loanApplication.loan_product_id,
            application_id: disbursement.loan_application_id, // Link to application
            loan_number: loanNumber,
            principal_amount: loanApplication.final_approved_amount || loanApplication.requested_amount,
            interest_rate: (() => {
              const r = (loanApplication.final_approved_interest_rate ?? 0);
              return r > 1 ? r / 100 : r;
            })(),
            term_months: loanApplication.final_approved_term || loanApplication.requested_term,
            disbursement_date: disbursement.disbursement_date,
            outstanding_balance: loanApplication.final_approved_amount || loanApplication.requested_amount,
            status: 'active', // Set directly to active during disbursement
            loan_officer_id: profile.id,
          })
          .select('id, loan_number, status, client_id, mifos_loan_id, loan_product_id')
          .single();
          
        if (createError || !newLoan) {
          console.error('Error creating loan:', createError);
          throw createError;
        }
        console.log('Loan created successfully with active status:', newLoan);
        existingLoan = newLoan;
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
            account_balance: newBalance
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

      // Keep the application as 'approved' after successful disbursement
      const { error: applicationUpdateError } = await supabase
        .from('loan_applications')
        .update({
          status: 'approved'
        })
        .eq('id', disbursement.loan_application_id);

      if (applicationUpdateError) {
        console.error('Error updating loan application to approved status:', applicationUpdateError);
        throw applicationUpdateError;
      }
      console.log('Disbursement completed successfully, loan is active and application remains approved');

      return { loan: existingLoan, disbursement: disbursementData };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['loan-applications'] });
      queryClient.invalidateQueries({ queryKey: ['loan-disbursements'] });
      queryClient.invalidateQueries({ queryKey: ['client-loans'] });
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      queryClient.invalidateQueries({ queryKey: ['savings-accounts'] });
      
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