-- Create remaining core tables
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

CREATE TABLE public.group_members (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    is_active BOOLEAN NOT NULL DEFAULT true,
    UNIQUE(group_id, client_id)
);

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