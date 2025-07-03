-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE public.user_role AS ENUM ('super_admin', 'tenant_admin', 'loan_officer', 'client');
CREATE TYPE public.tenant_status AS ENUM ('active', 'suspended', 'cancelled');
CREATE TYPE public.pricing_tier AS ENUM ('starter', 'professional', 'enterprise', 'scale');
CREATE TYPE public.payment_status AS ENUM ('pending', 'completed', 'failed', 'cancelled');
CREATE TYPE public.loan_status AS ENUM ('pending', 'approved', 'active', 'closed', 'overdue', 'written_off');
CREATE TYPE public.payment_type AS ENUM ('cash', 'bank_transfer', 'mpesa', 'mobile_money', 'cheque');
CREATE TYPE public.transaction_type AS ENUM ('loan_repayment', 'savings_deposit', 'loan_disbursement', 'savings_withdrawal', 'fee_payment');

-- Create tenants table
CREATE TABLE public.tenants (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    domain TEXT,
    logo_url TEXT,
    theme_colors JSONB DEFAULT '{"primary": "#1e40af", "secondary": "#64748b"}',
    pricing_tier pricing_tier NOT NULL DEFAULT 'starter',
    status tenant_status NOT NULL DEFAULT 'active',
    trial_ends_at TIMESTAMP WITH TIME ZONE,
    subscription_ends_at TIMESTAMP WITH TIME ZONE,
    mifos_base_url TEXT,
    mifos_tenant_identifier TEXT,
    mifos_username TEXT,
    mifos_password TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create profiles table
CREATE TABLE public.profiles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE,
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    phone TEXT,
    role user_role NOT NULL,
    avatar_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create clients table
CREATE TABLE public.clients (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    mifos_client_id BIGINT,
    client_number TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    national_id TEXT,
    date_of_birth DATE,
    gender TEXT,
    address JSONB,
    occupation TEXT,
    monthly_income DECIMAL(15,2),
    profile_picture_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    timely_repayment_rate DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(tenant_id, client_number)
);

-- Create groups table
CREATE TABLE public.groups (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    mifos_group_id BIGINT,
    name TEXT NOT NULL,
    group_number TEXT NOT NULL,
    meeting_frequency TEXT,
    meeting_day TEXT,
    meeting_time TIME,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(tenant_id, group_number)
);

-- Create group_members table
CREATE TABLE public.group_members (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    is_active BOOLEAN NOT NULL DEFAULT true,
    UNIQUE(group_id, client_id)
);

-- Create loan_products table
CREATE TABLE public.loan_products (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    mifos_product_id BIGINT,
    name TEXT NOT NULL,
    short_name TEXT NOT NULL,
    description TEXT,
    currency_code TEXT NOT NULL DEFAULT 'USD',
    min_principal DECIMAL(15,2) NOT NULL,
    max_principal DECIMAL(15,2) NOT NULL,
    default_principal DECIMAL(15,2),
    min_nominal_interest_rate DECIMAL(5,4) NOT NULL,
    max_nominal_interest_rate DECIMAL(5,4) NOT NULL,
    default_nominal_interest_rate DECIMAL(5,4),
    min_term INTEGER NOT NULL,
    max_term INTEGER NOT NULL,
    default_term INTEGER,
    repayment_frequency TEXT NOT NULL DEFAULT 'monthly',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create loans table
CREATE TABLE public.loans (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    loan_product_id UUID NOT NULL REFERENCES public.loan_products(id),
    mifos_loan_id BIGINT,
    loan_number TEXT NOT NULL,
    principal_amount DECIMAL(15,2) NOT NULL,
    interest_rate DECIMAL(5,4) NOT NULL,
    term_months INTEGER NOT NULL,
    disbursement_date DATE,
    expected_maturity_date DATE,
    outstanding_balance DECIMAL(15,2) DEFAULT 0,
    total_overdue_amount DECIMAL(15,2) DEFAULT 0,
    next_repayment_amount DECIMAL(15,2) DEFAULT 0,
    next_repayment_date DATE,
    status loan_status NOT NULL DEFAULT 'pending',
    loan_officer_id UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(tenant_id, loan_number)
);

-- Create loan_guarantors table
CREATE TABLE public.loan_guarantors (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    loan_id UUID NOT NULL REFERENCES public.loans(id) ON DELETE CASCADE,
    guarantor_client_id UUID REFERENCES public.clients(id),
    guarantor_name TEXT NOT NULL,
    guarantor_phone TEXT,
    guarantor_national_id TEXT,
    guarantee_amount DECIMAL(15,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create savings_products table
CREATE TABLE public.savings_products (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    mifos_product_id BIGINT,
    name TEXT NOT NULL,
    short_name TEXT NOT NULL,
    description TEXT,
    currency_code TEXT NOT NULL DEFAULT 'USD',
    nominal_annual_interest_rate DECIMAL(5,4) DEFAULT 0,
    min_required_opening_balance DECIMAL(15,2) DEFAULT 0,
    min_balance_for_interest_calculation DECIMAL(15,2) DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create savings_accounts table
CREATE TABLE public.savings_accounts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    savings_product_id UUID NOT NULL REFERENCES public.savings_products(id),
    mifos_account_id BIGINT,
    account_number TEXT NOT NULL,
    account_balance DECIMAL(15,2) DEFAULT 0,
    available_balance DECIMAL(15,2) DEFAULT 0,
    interest_earned DECIMAL(15,2) DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    opened_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(tenant_id, account_number)
);

-- Create transactions table
CREATE TABLE public.transactions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    client_id UUID REFERENCES public.clients(id),
    loan_id UUID REFERENCES public.loans(id),
    savings_account_id UUID REFERENCES public.savings_accounts(id),
    transaction_id TEXT NOT NULL,
    external_transaction_id TEXT,
    amount DECIMAL(15,2) NOT NULL,
    transaction_type transaction_type NOT NULL,
    payment_type payment_type NOT NULL,
    payment_status payment_status NOT NULL DEFAULT 'pending',
    description TEXT,
    transaction_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    processed_by UUID REFERENCES public.profiles(id),
    reconciliation_status TEXT DEFAULT 'unreconciled',
    mpesa_receipt_number TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(tenant_id, transaction_id)
);

-- Create unallocated_payments table
CREATE TABLE public.unallocated_payments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    amount DECIMAL(15,2) NOT NULL,
    payment_type payment_type NOT NULL,
    reference_number TEXT,
    payer_name TEXT,
    payer_phone TEXT,
    payment_date TIMESTAMP WITH TIME ZONE NOT NULL,
    is_allocated BOOLEAN NOT NULL DEFAULT false,
    allocated_to_loan_id UUID REFERENCES public.loans(id),
    allocated_to_savings_id UUID REFERENCES public.savings_accounts(id),
    allocated_at TIMESTAMP WITH TIME ZONE,
    allocated_by UUID REFERENCES public.profiles(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create client_documents table
CREATE TABLE public.client_documents (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL,
    document_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_size BIGINT,
    mime_type TEXT,
    uploaded_by UUID REFERENCES public.profiles(id),
    is_verified BOOLEAN NOT NULL DEFAULT false,
    verified_by UUID REFERENCES public.profiles(id),
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create reconciliation_reports table
CREATE TABLE public.reconciliation_reports (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    report_name TEXT NOT NULL,
    statement_type TEXT NOT NULL, -- 'bank' or 'mpesa'
    statement_file_url TEXT NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    total_statement_amount DECIMAL(15,2),
    total_system_amount DECIMAL(15,2),
    matched_amount DECIMAL(15,2),
    unmatched_amount DECIMAL(15,2),
    reconciliation_status TEXT NOT NULL DEFAULT 'pending',
    reconciled_by UUID REFERENCES public.profiles(id),
    reconciled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create billing_invoices table
CREATE TABLE public.billing_invoices (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    invoice_number TEXT NOT NULL UNIQUE,
    billing_period_start DATE NOT NULL,
    billing_period_end DATE NOT NULL,
    base_amount DECIMAL(10,2) NOT NULL,
    addon_charges JSONB DEFAULT '{}',
    total_amount DECIMAL(10,2) NOT NULL,
    status payment_status NOT NULL DEFAULT 'pending',
    due_date DATE NOT NULL,
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loan_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loan_guarantors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.savings_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.savings_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unallocated_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reconciliation_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_invoices ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for super admins (can access everything)
CREATE POLICY "Super admins can view all tenants" ON public.tenants FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'super_admin')
);

CREATE POLICY "Super admins can view all profiles" ON public.profiles FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'super_admin')
);

CREATE POLICY "Super admins can view all billing invoices" ON public.billing_invoices FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'super_admin')
);

-- Create RLS policies for tenant isolation
CREATE POLICY "Users can only access their tenant's data" ON public.clients FOR ALL TO authenticated USING (
    tenant_id IN (SELECT tenant_id FROM public.profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Users can only access their tenant's groups" ON public.groups FOR ALL TO authenticated USING (
    tenant_id IN (SELECT tenant_id FROM public.profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Users can only access their tenant's group members" ON public.group_members FOR ALL TO authenticated USING (
    group_id IN (SELECT id FROM public.groups WHERE tenant_id IN (SELECT tenant_id FROM public.profiles WHERE user_id = auth.uid()))
);

CREATE POLICY "Users can only access their tenant's loan products" ON public.loan_products FOR ALL TO authenticated USING (
    tenant_id IN (SELECT tenant_id FROM public.profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Users can only access their tenant's loans" ON public.loans FOR ALL TO authenticated USING (
    tenant_id IN (SELECT tenant_id FROM public.profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Users can only access their tenant's loan guarantors" ON public.loan_guarantors FOR ALL TO authenticated USING (
    loan_id IN (SELECT id FROM public.loans WHERE tenant_id IN (SELECT tenant_id FROM public.profiles WHERE user_id = auth.uid()))
);

CREATE POLICY "Users can only access their tenant's savings products" ON public.savings_products FOR ALL TO authenticated USING (
    tenant_id IN (SELECT tenant_id FROM public.profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Users can only access their tenant's savings accounts" ON public.savings_accounts FOR ALL TO authenticated USING (
    tenant_id IN (SELECT tenant_id FROM public.profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Users can only access their tenant's transactions" ON public.transactions FOR ALL TO authenticated USING (
    tenant_id IN (SELECT tenant_id FROM public.profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Users can only access their tenant's unallocated payments" ON public.unallocated_payments FOR ALL TO authenticated USING (
    tenant_id IN (SELECT tenant_id FROM public.profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Users can only access their tenant's client documents" ON public.client_documents FOR ALL TO authenticated USING (
    tenant_id IN (SELECT tenant_id FROM public.profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Users can only access their tenant's reconciliation reports" ON public.reconciliation_reports FOR ALL TO authenticated USING (
    tenant_id IN (SELECT tenant_id FROM public.profiles WHERE user_id = auth.uid())
);

-- Create policy for users to view their own profile
CREATE POLICY "Users can view and update their own profile" ON public.profiles FOR ALL TO authenticated USING (
    user_id = auth.uid()
);

-- Create policy for clients to access only their own data
CREATE POLICY "Clients can only access their own data" ON public.clients FOR SELECT TO authenticated USING (
    id IN (
        SELECT client_id FROM public.profiles p 
        JOIN public.clients c ON p.tenant_id = c.tenant_id 
        WHERE p.user_id = auth.uid() AND p.role = 'client' AND c.email = p.email
    )
);

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES 
    ('tenant-logos', 'tenant-logos', true),
    ('client-documents', 'client-documents', false),
    ('reconciliation-files', 'reconciliation-files', false),
    ('payment-files', 'payment-files', false);

-- Create storage policies
CREATE POLICY "Users can upload tenant logos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'tenant-logos' AND 
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role IN ('super_admin', 'tenant_admin'))
);

CREATE POLICY "Anyone can view tenant logos" ON storage.objects FOR SELECT TO authenticated USING (
    bucket_id = 'tenant-logos'
);

CREATE POLICY "Users can upload client documents" ON storage.objects FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'client-documents' AND 
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Users can view their tenant's client documents" ON storage.objects FOR SELECT TO authenticated USING (
    bucket_id = 'client-documents'
);

-- Create trigger function for updating timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updating updated_at
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON public.tenants FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_groups_updated_at BEFORE UPDATE ON public.groups FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_loan_products_updated_at BEFORE UPDATE ON public.loan_products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_loans_updated_at BEFORE UPDATE ON public.loans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_savings_products_updated_at BEFORE UPDATE ON public.savings_products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_savings_accounts_updated_at BEFORE UPDATE ON public.savings_accounts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();