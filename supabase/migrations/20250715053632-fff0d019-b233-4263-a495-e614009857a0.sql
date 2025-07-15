-- Create loan purposes table
CREATE TABLE public.loan_purposes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT, -- business, personal, agriculture, etc.
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, name)
);

-- Create collateral types table
CREATE TABLE public.collateral_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  requires_valuation BOOLEAN NOT NULL DEFAULT false,
  category TEXT, -- physical, financial, guarantees, etc.
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, name)
);

-- Enable RLS
ALTER TABLE public.loan_purposes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collateral_types ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for loan_purposes
CREATE POLICY "Users can access their tenant's loan purposes" 
ON public.loan_purposes 
FOR ALL 
USING (tenant_id IN (
  SELECT tenant_id FROM public.profiles WHERE user_id = auth.uid()
));

-- Create RLS policies for collateral_types
CREATE POLICY "Users can access their tenant's collateral types" 
ON public.collateral_types 
FOR ALL 
USING (tenant_id IN (
  SELECT tenant_id FROM public.profiles WHERE user_id = auth.uid()
));

-- Add triggers for updated_at
CREATE TRIGGER update_loan_purposes_updated_at
  BEFORE UPDATE ON public.loan_purposes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_collateral_types_updated_at
  BEFORE UPDATE ON public.collateral_types
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some default loan purposes (these can be customized per tenant)
INSERT INTO public.loan_purposes (tenant_id, name, description, category) 
SELECT 
  t.id,
  purpose.name,
  purpose.description,
  purpose.category
FROM public.tenants t
CROSS JOIN (
  VALUES 
    ('Business Expansion', 'Expand existing business operations', 'business'),
    ('Working Capital', 'Finance day-to-day business operations', 'business'),
    ('Equipment Purchase', 'Purchase business equipment or machinery', 'business'),
    ('Inventory Financing', 'Finance inventory and stock', 'business'),
    ('Education/School Fees', 'Pay for education expenses', 'personal'),
    ('Home Improvement', 'Renovate or improve residential property', 'personal'),
    ('Medical Expenses', 'Cover medical bills and health expenses', 'personal'),
    ('Agriculture/Farming', 'Agricultural activities and farming', 'agriculture'),
    ('Vehicle Purchase', 'Purchase personal or business vehicle', 'personal'),
    ('Debt Consolidation', 'Consolidate existing debts', 'personal'),
    ('Emergency', 'Emergency financial needs', 'personal'),
    ('Asset Purchase', 'Purchase of assets for business use', 'business')
) AS purpose(name, description, category);

-- Insert some default collateral types
INSERT INTO public.collateral_types (tenant_id, name, description, requires_valuation, category)
SELECT 
  t.id,
  collateral.name,
  collateral.description,
  collateral.requires_valuation::BOOLEAN,
  collateral.category
FROM public.tenants t
CROSS JOIN (
  VALUES 
    ('Real Estate/Property', 'Land, buildings, or other real estate', 'true', 'physical'),
    ('Motor Vehicle', 'Cars, trucks, motorcycles, or other vehicles', 'true', 'physical'),
    ('Machinery & Equipment', 'Business machinery, tools, or equipment', 'true', 'physical'),
    ('Inventory/Stock', 'Business inventory or stock in trade', 'true', 'physical'),
    ('Bank Deposits', 'Fixed deposits or savings accounts', 'false', 'financial'),
    ('Accounts Receivable', 'Outstanding customer invoices', 'false', 'financial'),
    ('Personal Guarantor', 'Individual guarantee for loan repayment', 'false', 'guarantee'),
    ('Corporate Guarantee', 'Company guarantee for loan repayment', 'false', 'guarantee'),
    ('Insurance Policy', 'Life or asset insurance policies', 'false', 'financial'),
    ('Government Securities', 'Treasury bills, bonds, or other securities', 'false', 'financial')
) AS collateral(name, description, requires_valuation, category);