-- Create remaining tables
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