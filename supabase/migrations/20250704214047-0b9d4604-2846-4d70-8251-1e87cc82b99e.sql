-- Create funds table for tenant fund management
CREATE TABLE public.funds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  fund_name TEXT NOT NULL,
  fund_code TEXT NOT NULL,
  description TEXT,
  fund_type TEXT NOT NULL DEFAULT 'general' CHECK (fund_type IN ('general', 'loan', 'savings', 'operational', 'reserve')),
  currency_id UUID REFERENCES public.currencies(id),
  initial_balance NUMERIC NOT NULL DEFAULT 0,
  current_balance NUMERIC NOT NULL DEFAULT 0,
  minimum_balance NUMERIC DEFAULT 0,
  maximum_balance NUMERIC,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, fund_code)
);

-- Create fund transactions table
CREATE TABLE public.fund_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fund_id UUID NOT NULL REFERENCES public.funds(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('credit', 'debit', 'transfer_in', 'transfer_out', 'adjustment')),
  amount NUMERIC NOT NULL CHECK (amount > 0),
  reference_number TEXT,
  description TEXT NOT NULL,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  processed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  related_fund_id UUID REFERENCES public.funds(id), -- For transfers between funds
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create fund allocations table for budget management
CREATE TABLE public.fund_allocations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fund_id UUID NOT NULL REFERENCES public.funds(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  allocation_name TEXT NOT NULL,
  allocated_amount NUMERIC NOT NULL CHECK (allocated_amount >= 0),
  used_amount NUMERIC NOT NULL DEFAULT 0 CHECK (used_amount >= 0),
  allocation_period TEXT NOT NULL DEFAULT 'monthly' CHECK (allocation_period IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CHECK (end_date >= start_date)
);

-- Enable Row Level Security
ALTER TABLE public.funds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fund_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fund_allocations ENABLE ROW LEVEL SECURITY;

-- Create policies for funds
CREATE POLICY "Users can view their tenant's funds" 
ON public.funds 
FOR SELECT 
USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Tenant admins can manage funds" 
ON public.funds 
FOR ALL 
USING (
  tenant_id IN (
    SELECT tenant_id FROM profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('tenant_admin', 'super_admin')
  )
);

-- Create policies for fund transactions
CREATE POLICY "Users can view their tenant's fund transactions" 
ON public.fund_transactions 
FOR SELECT 
USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Authorized users can manage fund transactions" 
ON public.fund_transactions 
FOR ALL 
USING (
  tenant_id IN (
    SELECT tenant_id FROM profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('tenant_admin', 'super_admin', 'loan_officer')
  )
);

-- Create policies for fund allocations
CREATE POLICY "Users can view their tenant's fund allocations" 
ON public.fund_allocations 
FOR SELECT 
USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Tenant admins can manage fund allocations" 
ON public.fund_allocations 
FOR ALL 
USING (
  tenant_id IN (
    SELECT tenant_id FROM profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('tenant_admin', 'super_admin')
  )
);

-- Add triggers for updated_at
CREATE TRIGGER update_funds_updated_at
BEFORE UPDATE ON public.funds
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_fund_transactions_updated_at
BEFORE UPDATE ON public.fund_transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_fund_allocations_updated_at
BEFORE UPDATE ON public.fund_allocations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_funds_tenant_id ON public.funds(tenant_id);
CREATE INDEX idx_fund_transactions_fund_id ON public.fund_transactions(fund_id);
CREATE INDEX idx_fund_transactions_tenant_id ON public.fund_transactions(tenant_id);
CREATE INDEX idx_fund_allocations_fund_id ON public.fund_allocations(fund_id);