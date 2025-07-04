-- Create currencies table for system-wide currency definitions
CREATE TABLE public.currencies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  symbol TEXT NOT NULL,
  decimal_places INTEGER NOT NULL DEFAULT 2,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert common currencies
INSERT INTO public.currencies (code, name, symbol, decimal_places) VALUES
('USD', 'US Dollar', '$', 2),
('EUR', 'Euro', '€', 2),
('GBP', 'British Pound', '£', 2),
('KES', 'Kenyan Shilling', 'KSh', 2),
('NGN', 'Nigerian Naira', '₦', 2),
('GHS', 'Ghanaian Cedi', 'GH₵', 2),
('ZAR', 'South African Rand', 'R', 2),
('TZS', 'Tanzanian Shilling', 'TSh', 2),
('UGX', 'Ugandan Shilling', 'USh', 0),
('RWF', 'Rwandan Franc', 'RF', 0),
('XOF', 'West African CFA Franc', 'CFA', 0),
('XAF', 'Central African CFA Franc', 'FCFA', 0);

-- Create tenant currency settings table
CREATE TABLE public.tenant_currency_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  default_currency_id UUID NOT NULL REFERENCES public.currencies(id),
  display_format TEXT NOT NULL DEFAULT 'symbol_before', -- 'symbol_before', 'symbol_after', 'code_before', 'code_after'
  thousand_separator TEXT NOT NULL DEFAULT ',',
  decimal_separator TEXT NOT NULL DEFAULT '.',
  show_decimals BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(tenant_id)
);

-- Enable Row Level Security
ALTER TABLE public.currencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_currency_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for currencies (read-only for all authenticated users)
CREATE POLICY "Anyone can view currencies" 
ON public.currencies 
FOR SELECT 
USING (true);

-- Create policies for tenant currency settings
CREATE POLICY "Users can view their tenant's currency settings" 
ON public.tenant_currency_settings 
FOR SELECT 
USING (tenant_id IN (SELECT tenant_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Tenant admins can manage currency settings" 
ON public.tenant_currency_settings 
FOR ALL 
USING (
  tenant_id IN (
    SELECT tenant_id FROM profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('tenant_admin', 'super_admin')
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_tenant_currency_settings_updated_at
BEFORE UPDATE ON public.tenant_currency_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();