-- Add email settings and SSL verification fields to tenants table
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS ssl_status text DEFAULT 'pending';
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS ssl_verified_at timestamp with time zone;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS custom_domain_verified boolean DEFAULT false;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS email_settings jsonb DEFAULT '{}';

-- Create email configurations table for global email handling
CREATE TABLE IF NOT EXISTS public.email_configurations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL,
  provider text NOT NULL DEFAULT 'resend',
  api_key_encrypted text,
  from_email text NOT NULL,
  from_name text,
  reply_to_email text,
  smtp_host text,
  smtp_port integer,
  smtp_username text,
  smtp_password_encrypted text,
  use_tls boolean DEFAULT true,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on email_configurations
ALTER TABLE public.email_configurations ENABLE ROW LEVEL SECURITY;

-- Create policies for email_configurations
CREATE POLICY "Tenant admins can manage email configurations" 
ON public.email_configurations 
FOR ALL 
USING (tenant_id IN (
  SELECT tenant_id FROM public.profiles 
  WHERE user_id = auth.uid() AND role IN ('tenant_admin', 'super_admin')
));

CREATE POLICY "Users can view their tenant's email configurations" 
ON public.email_configurations 
FOR SELECT 
USING (tenant_id IN (
  SELECT tenant_id FROM public.profiles 
  WHERE user_id = auth.uid()
));

-- Create domain verifications table
CREATE TABLE IF NOT EXISTS public.domain_verifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL,
  domain text NOT NULL,
  verification_token text NOT NULL,
  dns_record_type text NOT NULL DEFAULT 'TXT',
  dns_record_name text NOT NULL,
  dns_record_value text NOT NULL,
  is_verified boolean DEFAULT false,
  verified_at timestamp with time zone,
  ssl_certificate_issued boolean DEFAULT false,
  ssl_certificate_issued_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, domain)
);

-- Enable RLS on domain_verifications
ALTER TABLE public.domain_verifications ENABLE ROW LEVEL SECURITY;

-- Create policies for domain_verifications
CREATE POLICY "Tenant admins can manage domain verifications" 
ON public.domain_verifications 
FOR ALL 
USING (tenant_id IN (
  SELECT tenant_id FROM public.profiles 
  WHERE user_id = auth.uid() AND role IN ('tenant_admin', 'super_admin')
));

-- Create email templates table for tenant-specific templates
CREATE TABLE IF NOT EXISTS public.tenant_email_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL,
  template_name text NOT NULL,
  template_type text NOT NULL, -- welcome, payment_confirmation, loan_approval, etc.
  subject text NOT NULL,
  html_content text NOT NULL,
  text_content text,
  variables jsonb DEFAULT '[]', -- Available template variables
  is_active boolean DEFAULT true,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, template_name)
);

-- Enable RLS on tenant_email_templates
ALTER TABLE public.tenant_email_templates ENABLE ROW LEVEL SECURITY;

-- Create policies for tenant_email_templates
CREATE POLICY "Users can access their tenant's email templates" 
ON public.tenant_email_templates 
FOR ALL 
USING (tenant_id IN (
  SELECT tenant_id FROM public.profiles 
  WHERE user_id = auth.uid()
));

-- Add updated_at triggers
CREATE TRIGGER update_email_configurations_updated_at
  BEFORE UPDATE ON public.email_configurations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_domain_verifications_updated_at
  BEFORE UPDATE ON public.domain_verifications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tenant_email_templates_updated_at
  BEFORE UPDATE ON public.tenant_email_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();