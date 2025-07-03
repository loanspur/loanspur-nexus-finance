import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Types
export interface Tenant {
  id: string;
  name: string;
  slug: string;
  domain?: string | null;
  logo_url?: string | null;
  theme_colors: any; // JSON field
  pricing_tier: 'starter' | 'professional' | 'enterprise' | 'scale';
  status: 'active' | 'suspended' | 'cancelled';
  trial_ends_at?: string | null;
  subscription_ends_at?: string | null;
  mifos_base_url?: string | null;
  mifos_tenant_identifier?: string | null;
  mifos_username?: string | null;
  mifos_password?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  tenant_id: string;
  client_number: string;
  first_name: string;
  last_name: string;
  email?: string | null;
  phone?: string | null;
  national_id?: string | null;
  date_of_birth?: string | null;
  gender?: string | null;
  address?: any; // JSON field
  occupation?: string | null;
  monthly_income?: number | null;
  profile_picture_url?: string | null;
  is_active: boolean;
  timely_repayment_rate: number;
  mifos_client_id?: number | null;
  created_at: string;
  updated_at: string;
}

export interface LoanProduct {
  id: string;
  tenant_id: string;
  name: string;
  short_name: string;
  description?: string | null;
  currency_code: string;
  min_principal: number;
  max_principal: number;
  default_principal?: number | null;
  min_nominal_interest_rate: number;
  max_nominal_interest_rate: number;
  default_nominal_interest_rate?: number | null;
  min_term: number;
  max_term: number;
  default_term?: number | null;
  repayment_frequency: string;
  is_active: boolean;
  mifos_product_id?: number | null;
  created_at: string;
  updated_at: string;
}

export interface Loan {
  id: string;
  tenant_id: string;
  client_id: string;
  loan_product_id: string;
  loan_number: string;
  principal_amount: number;
  interest_rate: number;
  term_months: number;
  disbursement_date?: string | null;
  expected_maturity_date?: string | null;
  outstanding_balance: number;
  total_overdue_amount: number;
  next_repayment_amount: number;
  next_repayment_date?: string | null;
  status: 'pending' | 'approved' | 'active' | 'closed' | 'overdue' | 'written_off';
  loan_officer_id?: string | null;
  mifos_loan_id?: number | null;
  created_at: string;
  updated_at: string;
  clients?: {
    first_name: string;
    last_name: string;
    email: string | null;
    phone: string | null;
  };
  loan_products?: {
    name: string;
    currency_code: string;
  };
  loan_guarantors?: Array<{
    guarantor_name: string;
    guarantor_phone?: string | null;
    guarantee_amount: number;
  }>;
}

export interface SavingsProduct {
  id: string;
  tenant_id: string;
  name: string;
  short_name: string;
  description?: string | null;
  currency_code: string;
  nominal_annual_interest_rate: number;
  min_required_opening_balance: number;
  min_balance_for_interest_calculation: number;
  is_active: boolean;
  mifos_product_id?: number | null;
  created_at: string;
  updated_at: string;
}

export interface SavingsAccount {
  id: string;
  tenant_id: string;
  client_id: string;
  savings_product_id: string;
  account_number: string;
  account_balance: number;
  available_balance: number;
  interest_earned: number;
  is_active: boolean;
  opened_date: string;
  mifos_account_id?: number | null;
  created_at: string;
  updated_at: string;
  clients?: {
    first_name: string;
    last_name: string;
    email: string | null;
    phone: string | null;
  };
  savings_products?: {
    name: string;
    currency_code: string;
  };
}

// Tenant hooks
export const useTenants = () => {
  return useQuery({
    queryKey: ['tenants'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Tenant[];
    },
  });
};

export const useCreateTenant = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (tenant: Omit<Tenant, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('tenants')
        .insert([tenant])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      toast({
        title: "Success",
        description: "Tenant created successfully",
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

// Client hooks
export const useClients = () => {
  return useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Client[];
    },
  });
};

export const useCreateClient = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (client: Omit<Client, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('clients')
        .insert([client])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast({
        title: "Success",
        description: "Client created successfully",
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

// Loan Product hooks
export const useLoanProducts = () => {
  return useQuery({
    queryKey: ['loan-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('loan_products')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as LoanProduct[];
    },
  });
};

export const useCreateLoanProduct = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (product: Omit<LoanProduct, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('loan_products')
        .insert([product])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loan-products'] });
      toast({
        title: "Success",
        description: "Loan product created successfully",
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

// Loan hooks
export const useLoans = () => {
  return useQuery({
    queryKey: ['loans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('loans')
        .select(`
          *,
          clients (
            first_name,
            last_name,
            email,
            phone
          ),
          loan_products (
            name,
            currency_code
          ),
          loan_guarantors (
            guarantor_name,
            guarantor_phone,
            guarantee_amount
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Loan[];
    },
  });
};

export const useCreateLoan = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (loan: Omit<Loan, 'id' | 'created_at' | 'updated_at' | 'clients' | 'loan_products' | 'loan_guarantors'>) => {
      const { data, error } = await supabase
        .from('loans')
        .insert([loan])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loans'] });
      toast({
        title: "Success",
        description: "Loan created successfully",
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

// Savings Product hooks
export const useSavingsProducts = () => {
  return useQuery({
    queryKey: ['savings-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('savings_products')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as SavingsProduct[];
    },
  });
};

export const useCreateSavingsProduct = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (product: Omit<SavingsProduct, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('savings_products')
        .insert([product])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savings-products'] });
      toast({
        title: "Success",
        description: "Savings product created successfully",
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

// Savings Account hooks
export const useSavingsAccounts = () => {
  return useQuery({
    queryKey: ['savings-accounts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('savings_accounts')
        .select(`
          *,
          clients (
            first_name,
            last_name,
            email,
            phone
          ),
          savings_products (
            name,
            currency_code
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as SavingsAccount[];
    },
  });
};

export const useCreateSavingsAccount = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (account: Omit<SavingsAccount, 'id' | 'created_at' | 'updated_at' | 'clients' | 'savings_products'>) => {
      const { data, error } = await supabase
        .from('savings_accounts')
        .insert([account])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savings-accounts'] });
      toast({
        title: "Success",
        description: "Savings account created successfully",
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