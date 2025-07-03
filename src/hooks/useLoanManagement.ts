import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export interface LoanApplication {
  id: string;
  tenant_id: string;
  client_id: string;
  loan_product_id: string;
  application_number: string;
  requested_amount: number;
  requested_term: number;
  purpose?: string;
  status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'withdrawn';
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