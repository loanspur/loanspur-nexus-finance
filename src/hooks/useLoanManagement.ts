import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { useMifosIntegration } from './useMifosIntegration';

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
          clients(first_name, last_name, client_number),
          loan_products(name, short_name)
        `)
        .eq('tenant_id', profile.tenant_id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as any[];
    },
    enabled: !!profile?.tenant_id,
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
      queryClient.invalidateQueries({ queryKey: ['loan-applications'] });
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
      queryClient.invalidateQueries({ queryKey: ['loan-schedules', variables.loan_id] });
      queryClient.invalidateQueries({ queryKey: ['collection-cases'] });
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
      action: 'approve' | 'reject' | 'request_changes';
      comments?: string;
      approved_amount?: number;
      approved_term?: number;
      approved_interest_rate?: number;
      conditions?: string;
    }) => {
      if (!profile?.tenant_id) throw new Error('No tenant ID available');

      // Get loan application details
      const { data: loanApplication, error: fetchError } = await supabase
        .from('loan_applications')
        .select('*')
        .eq('id', approval.loan_application_id)
        .single();
      
      if (fetchError || !loanApplication) throw new Error('Loan application not found');

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
            interest_rate: approval.approved_interest_rate || 10,
            term_months: approval.approved_term || loanApplication.requested_term,
            outstanding_balance: approval.approved_amount || loanApplication.requested_amount,
            status: 'pending_disbursement',
            loan_officer_id: profile.id,
          }])
          .select()
          .single();
        
        if (loanError) throw loanError;
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

      console.log('Starting disbursement process for application:', disbursement.loan_application_id);
      console.log('Disbursement data:', disbursement);
      // Check if loan has already been disbursed
      const { data: existingDisbursement, error: disbursementCheckError } = await supabase
        .from('loan_disbursements')
        .select('loan_id')
        .eq('loan_application_id', disbursement.loan_application_id)
        .single();
      
      if (disbursementCheckError && disbursementCheckError.code !== 'PGRST116') {
        throw disbursementCheckError;
      }
      
      // If already disbursed, return error
      if (existingDisbursement) {
        throw new Error('Loan has already been disbursed');
      }

      // Get approved loan record created during approval
      let existingLoan: any;
      const { data: loanData, error: loanFetchError } = await supabase
        .from('loans')
        .select('id, loan_number, status, client_id, mifos_loan_id')
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
            interest_rate: loanApplication.final_approved_interest_rate || 0,
            term_months: loanApplication.final_approved_term || loanApplication.requested_term,
            disbursement_date: disbursement.disbursement_date,
            outstanding_balance: loanApplication.final_approved_amount || loanApplication.requested_amount,
            status: 'active', // Set directly to active during disbursement
            loan_officer_id: profile.id,
          })
          .select('id, loan_number, status, client_id, mifos_loan_id')
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
            transaction_type: 'credit',
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

      // Ensure loan status is active (in case it wasn't set during creation)
      const { error: loanUpdateError } = await supabase
        .from('loans')
        .update({
          status: 'active',
          disbursement_date: disbursement.disbursement_date,
        })
        .eq('id', existingLoan.id);

      if (loanUpdateError) {
        console.error('Error updating loan to active status:', loanUpdateError);
        throw loanUpdateError;
      }

      // Update loan application status to disbursed
      const { error: updateError } = await supabase
        .from('loan_applications')
        .update({
          status: 'disbursed',
        })
        .eq('id', disbursement.loan_application_id);

      if (updateError) throw updateError;

      return { loan: existingLoan, disbursement: disbursementData };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loan-applications'] });
      queryClient.invalidateQueries({ queryKey: ['loan-disbursements'] });
      queryClient.invalidateQueries({ queryKey: ['client-loans'] });
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      queryClient.invalidateQueries({ queryKey: ['savings-accounts'] });
      toast({
        title: "Success",
        description: "Loan disbursed successfully",
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