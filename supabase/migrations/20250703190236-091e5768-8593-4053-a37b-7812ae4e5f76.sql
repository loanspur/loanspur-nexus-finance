-- Create final tables and enable RLS
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

CREATE TABLE public.reconciliation_reports (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    report_name TEXT NOT NULL,
    statement_type TEXT NOT NULL,
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