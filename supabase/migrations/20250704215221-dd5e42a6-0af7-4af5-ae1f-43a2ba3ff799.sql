-- Create savings products table (loan_products already exists)
CREATE TABLE IF NOT EXISTS public.savings_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  product_code TEXT NOT NULL,
  description TEXT,
  currency_id UUID REFERENCES public.currencies(id),
  account_type TEXT NOT NULL DEFAULT 'regular' CHECK (account_type IN ('regular', 'fixed', 'recurring', 'current')),
  minimum_opening_balance NUMERIC NOT NULL DEFAULT 0,
  minimum_balance NUMERIC NOT NULL DEFAULT 0,
  maximum_balance NUMERIC,
  interest_rate NUMERIC DEFAULT 0,
  interest_calculation_method TEXT NOT NULL DEFAULT 'daily' CHECK (interest_calculation_method IN ('daily', 'monthly', 'quarterly', 'annually')),
  interest_posting_frequency TEXT NOT NULL DEFAULT 'monthly' CHECK (interest_posting_frequency IN ('daily', 'weekly', 'monthly', 'quarterly', 'annually')),
  allow_overdraft BOOLEAN NOT NULL DEFAULT false,
  overdraft_limit NUMERIC DEFAULT 0,
  dormancy_period_days INTEGER DEFAULT 365,
  auto_dormancy BOOLEAN NOT NULL DEFAULT false,
  withdrawal_limit_per_day NUMERIC,
  withdrawal_limit_per_transaction NUMERIC,
  minimum_withdrawal_amount NUMERIC DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, product_code)
);

-- Create fee structures table
CREATE TABLE IF NOT EXISTS public.fee_structures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  fee_name TEXT NOT NULL,
  fee_code TEXT NOT NULL,
  description TEXT,
  fee_type TEXT NOT NULL CHECK (fee_type IN ('loan', 'savings', 'transaction', 'account')),
  product_id UUID, -- Can be null for general fees
  calculation_method TEXT NOT NULL CHECK (calculation_method IN ('fixed', 'percentage', 'tiered')),
  fixed_amount NUMERIC DEFAULT 0,
  percentage_rate NUMERIC DEFAULT 0,
  minimum_fee NUMERIC DEFAULT 0,
  maximum_fee NUMERIC,
  frequency TEXT NOT NULL DEFAULT 'one_time' CHECK (frequency IN ('one_time', 'monthly', 'quarterly', 'annually')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, fee_code)
);

-- Create fee tiers table for tiered fee structures
CREATE TABLE IF NOT EXISTS public.fee_tiers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fee_structure_id UUID NOT NULL REFERENCES public.fee_structures(id) ON DELETE CASCADE,
  tier_order INTEGER NOT NULL,
  minimum_amount NUMERIC NOT NULL DEFAULT 0,
  maximum_amount NUMERIC,
  fee_amount NUMERIC NOT NULL DEFAULT 0,
  fee_percentage NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create product fees junction table
CREATE TABLE IF NOT EXISTS public.product_fees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_type TEXT NOT NULL CHECK (product_type IN ('loan', 'savings')),
  product_id UUID NOT NULL,
  fee_structure_id UUID NOT NULL REFERENCES public.fee_structures(id) ON DELETE CASCADE,
  is_mandatory BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(product_type, product_id, fee_structure_id)
);

-- Enable Row Level Security
ALTER TABLE public.savings_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_fees ENABLE ROW LEVEL SECURITY;

-- Create policies for savings products
CREATE POLICY "Users can view their tenant's savings products" 
ON public.savings_products 
FOR SELECT 
USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Tenant admins can manage savings products" 
ON public.savings_products 
FOR ALL 
USING (
  tenant_id IN (
    SELECT tenant_id FROM profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('tenant_admin', 'super_admin')
  )
);

-- Create policies for fee structures
CREATE POLICY "Users can view their tenant's fee structures" 
ON public.fee_structures 
FOR SELECT 
USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Tenant admins can manage fee structures" 
ON public.fee_structures 
FOR ALL 
USING (
  tenant_id IN (
    SELECT tenant_id FROM profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('tenant_admin', 'super_admin')
  )
);

-- Create policies for fee tiers
CREATE POLICY "Users can view fee tiers for their tenant's fees" 
ON public.fee_tiers 
FOR SELECT 
USING (
  fee_structure_id IN (
    SELECT id FROM public.fee_structures 
    WHERE tenant_id IN (
      SELECT tenant_id FROM profiles WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Tenant admins can manage fee tiers" 
ON public.fee_tiers 
FOR ALL 
USING (
  fee_structure_id IN (
    SELECT id FROM public.fee_structures 
    WHERE tenant_id IN (
      SELECT tenant_id FROM profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('tenant_admin', 'super_admin')
    )
  )
);

-- Create policies for product fees
CREATE POLICY "Users can view product fees for their tenant" 
ON public.product_fees 
FOR SELECT 
USING (
  fee_structure_id IN (
    SELECT id FROM public.fee_structures 
    WHERE tenant_id IN (
      SELECT tenant_id FROM profiles WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Tenant admins can manage product fees" 
ON public.product_fees 
FOR ALL 
USING (
  fee_structure_id IN (
    SELECT id FROM public.fee_structures 
    WHERE tenant_id IN (
      SELECT tenant_id FROM profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('tenant_admin', 'super_admin')
    )
  )
);

-- Add triggers for updated_at
CREATE TRIGGER update_savings_products_updated_at
BEFORE UPDATE ON public.savings_products
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_fee_structures_updated_at
BEFORE UPDATE ON public.fee_structures
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_savings_products_tenant_id ON public.savings_products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_fee_structures_tenant_id ON public.fee_structures(tenant_id);
CREATE INDEX IF NOT EXISTS idx_fee_tiers_fee_structure_id ON public.fee_tiers(fee_structure_id);
CREATE INDEX IF NOT EXISTS idx_product_fees_product ON public.product_fees(product_type, product_id);