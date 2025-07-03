-- Create loan and savings tables
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