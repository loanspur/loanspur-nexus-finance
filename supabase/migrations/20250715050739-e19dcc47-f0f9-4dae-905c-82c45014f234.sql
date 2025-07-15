-- Create payment_types table for managing different payment methods
CREATE TABLE IF NOT EXISTS public.payment_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  description TEXT,
  is_cash_payment BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, code)
);

-- Enable RLS
ALTER TABLE public.payment_types ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can access their tenant's payment types" 
ON public.payment_types 
FOR ALL 
USING (tenant_id IN (
  SELECT tenant_id FROM profiles WHERE user_id = auth.uid()
));

-- Add foreign key constraint
ALTER TABLE public.payment_types 
ADD CONSTRAINT fk_payment_types_tenant 
FOREIGN KEY (tenant_id) REFERENCES tenants(id);

-- Create trigger for updated_at
CREATE TRIGGER update_payment_types_updated_at
BEFORE UPDATE ON public.payment_types
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some default payment types
INSERT INTO public.payment_types (tenant_id, name, code, description, is_cash_payment, position)
SELECT 
  t.id as tenant_id,
  'Cash',
  'CASH',
  'Cash payment method',
  true,
  1
FROM tenants t
ON CONFLICT (tenant_id, code) DO NOTHING;

INSERT INTO public.payment_types (tenant_id, name, code, description, is_cash_payment, position)
SELECT 
  t.id as tenant_id,
  'Bank Transfer',
  'BANK_TRANSFER',
  'Bank transfer payment method',
  false,
  2
FROM tenants t
ON CONFLICT (tenant_id, code) DO NOTHING;

INSERT INTO public.payment_types (tenant_id, name, code, description, is_cash_payment, position)
SELECT 
  t.id as tenant_id,
  'Mobile Money',
  'MOBILE_MONEY',
  'Mobile money payment method',
  false,
  3
FROM tenants t
ON CONFLICT (tenant_id, code) DO NOTHING;