import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Types
export interface Tenant {
  id: string;
  name: string;
  slug: string;
  subdomain?: string | null;
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
  contact_person_name?: string | null;
  contact_person_email?: string | null;
  contact_person_phone?: string | null;
  billing_address?: any; // JSON field
  dns_settings?: any; // JSON field
  mpesa_settings?: any; // JSON field
  addons?: any; // JSON field
  billing_cycle?: string | null;
  auto_billing?: boolean;
  payment_terms?: number | null;
  country?: string | null;
  timezone?: string | null;
  city?: string | null;
  state_province?: string | null;
  postal_code?: string | null;
  currency_code?: string | null;
  ssl_status?: string | null;
  ssl_verified_at?: string | null;
  custom_domain_verified?: boolean;
  email_settings?: any; // JSON field
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
  date_of_birth?: string | null;
  place_of_birth?: string | null;
  nationality?: string | null;
  gender?: string | null;
  address?: any; // JSON field
  national_id?: string | null;
  passport_number?: string | null;
  driving_license_number?: string | null;
  occupation?: string | null;
  employer_name?: string | null;
  employer_address?: string | null;
  job_title?: string | null;
  employment_start_date?: string | null;
  monthly_income?: number | null;
  business_name?: string | null;
  business_type?: string | null;
  business_registration_number?: string | null;
  business_address?: string | null;
  bank_name?: string | null;
  bank_account_number?: string | null;
  bank_branch?: string | null;
  next_of_kin_name?: string | null;
  next_of_kin_relationship?: string | null;
  next_of_kin_phone?: string | null;
  next_of_kin_email?: string | null;
  next_of_kin_address?: string | null;
  profile_picture_url?: string | null;
  kyc_status?: string | null;
  kyc_completed_at?: string | null;
  approval_status?: string | null;
  approved_by?: string | null;
  approved_at?: string | null;
  is_active: boolean;
  timely_repayment_rate?: number | null;
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
        .select(`
          *,
          loans(
            outstanding_balance,
            status
          ),
          savings_accounts(
            account_balance
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as (Client & {
        loans?: Array<{
          outstanding_balance: number;
          status: string;
        }>;
        savings_accounts?: Array<{
          account_balance: number;
        }>;
      })[];
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
      
      if (error) {
        // Handle unique constraint violations with user-friendly messages
        if (error.code === '23505') {
          if (error.message.includes('unique_client_national_id')) {
            throw new Error('A client with this National ID already exists');
          } else if (error.message.includes('unique_client_passport')) {
            throw new Error('A client with this Passport Number already exists');
          } else if (error.message.includes('unique_client_driving_license')) {
            throw new Error('A client with this Driving License already exists');
          } else if (error.message.includes('unique_client_email')) {
            throw new Error('A client with this Email already exists');
          } else if (error.message.includes('unique_client_phone')) {
            throw new Error('A client with this Phone Number already exists');
          } else {
            throw new Error('A client with these details already exists');
          }
        }
        throw error;
      }
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

// Client activation hook  
export const useActivateClient = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (clientId: string) => {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!profileData?.id) {
        throw new Error('No user profile available');
      }

      const { data, error } = await supabase.rpc('activate_client', {
        client_id: clientId,
        activated_by_id: profileData.id
      });

      if (error) {
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast({
        title: "Success",
        description: "Client activated successfully",
      });
    },
    onError: (error: any) => {
      console.error('Error activating client:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to activate client",
        variant: "destructive",
      });
    },
  });
};

// Check client activation eligibility hook
export const useCheckClientActivation = (clientId?: string) => {
  return useQuery({
    queryKey: ['client-activation-eligibility', clientId],
    queryFn: async () => {
      if (!clientId) return false;
      
      const { data, error } = await supabase.rpc('check_client_activation_eligibility', {
        client_id: clientId
      });

      if (error) {
        throw error;
      }
      return data as boolean;
    },
    enabled: !!clientId,
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

export const useUpdateLoanProduct = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (product: Partial<LoanProduct> & { id: string }) => {
      const { data, error } = await supabase
        .from('loan_products')
        .update(product)
        .eq('id', product.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loan-products'] });
      toast({
        title: "Success",
        description: "Loan product updated successfully",
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

export const useUpdateSavingsProduct = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (product: Partial<SavingsProduct> & { id: string }) => {
      const { data, error } = await supabase
        .from('savings_products')
        .update(product)
        .eq('id', product.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savings-products'] });
      toast({
        title: "Success",
        description: "Savings product updated successfully",
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