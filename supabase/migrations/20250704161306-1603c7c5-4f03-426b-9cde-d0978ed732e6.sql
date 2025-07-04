-- Create M-Pesa API credentials table for tenant-specific configurations
CREATE TABLE public.mpesa_credentials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  environment TEXT NOT NULL DEFAULT 'sandbox' CHECK (environment IN ('sandbox', 'production')),
  consumer_key TEXT NOT NULL,
  consumer_secret TEXT NOT NULL,
  business_short_code TEXT NOT NULL,
  passkey TEXT NOT NULL,
  initiator_name TEXT,
  security_credential TEXT,
  till_number TEXT,
  paybill_number TEXT,
  validation_url TEXT,
  confirmation_url TEXT,
  callback_url TEXT,
  result_url TEXT,
  timeout_url TEXT,
  account_balance_callback_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id),
  UNIQUE(tenant_id, environment)
);

-- Enable RLS on mpesa_credentials table
ALTER TABLE public.mpesa_credentials ENABLE ROW LEVEL SECURITY;

-- RLS policies for mpesa_credentials (only tenant admins can manage)
CREATE POLICY "Tenant admins can manage mpesa credentials" 
ON public.mpesa_credentials 
FOR ALL 
USING (tenant_id IN (
  SELECT tenant_id FROM public.profiles 
  WHERE user_id = auth.uid() AND role = 'tenant_admin'
));

CREATE POLICY "Super admins can view all mpesa credentials" 
ON public.mpesa_credentials 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE user_id = auth.uid() AND role = 'super_admin'
));

-- Add trigger for updated_at
CREATE TRIGGER update_mpesa_credentials_updated_at
  BEFORE UPDATE ON public.mpesa_credentials
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample M-Pesa credentials for demo tenants
INSERT INTO public.mpesa_credentials (tenant_id, environment, consumer_key, consumer_secret, business_short_code, passkey, is_active) 
SELECT 
  t.id,
  'sandbox',
  'CK_' || upper(substr(md5(t.slug), 1, 16)),
  'CS_' || upper(substr(md5(t.slug || '_secret'), 1, 24)),
  CASE 
    WHEN t.slug = 'acme-mfi' THEN '174379'
    WHEN t.slug = 'village-bank-ke' THEN '600982'
    WHEN t.slug = 'startup-loans' THEN '600000'
    ELSE '17' || lpad((random() * 9999)::text, 4, '0')
  END,
  CASE 
    WHEN t.slug = 'acme-mfi' THEN 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919'
    WHEN t.slug = 'village-bank-ke' THEN 'MTAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDA='
    ELSE 'PK_' || upper(substr(md5(t.slug || '_passkey'), 1, 32))
  END,
  CASE 
    WHEN t.slug = 'acme-mfi' THEN true
    WHEN t.slug = 'village-bank-ke' THEN true
    WHEN t.slug = 'startup-loans' THEN false
    ELSE false
  END as is_active
FROM public.tenants t;