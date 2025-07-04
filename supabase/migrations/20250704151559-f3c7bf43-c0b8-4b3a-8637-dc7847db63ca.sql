-- Create integrations table for global SMS and WhatsApp gateway management
CREATE TABLE public.global_integrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  integration_type TEXT NOT NULL CHECK (integration_type IN ('sms', 'whatsapp')),
  provider_name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  configuration JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.profiles(id)
);

-- Create tenant integration preferences table
CREATE TABLE public.tenant_integration_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  integration_id UUID NOT NULL REFERENCES public.global_integrations(id) ON DELETE CASCADE,
  integration_type TEXT NOT NULL CHECK (integration_type IN ('sms', 'whatsapp')),
  is_primary BOOLEAN NOT NULL DEFAULT false,
  tenant_specific_config JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, integration_type, is_primary) -- Only one primary integration per type per tenant
);

-- Enable RLS
ALTER TABLE public.global_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_integration_preferences ENABLE ROW LEVEL SECURITY;

-- RLS policies for global_integrations (only super admins can manage)
CREATE POLICY "Super admins can manage global integrations" 
ON public.global_integrations 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE user_id = auth.uid() AND role = 'super_admin'
));

-- RLS policies for tenant_integration_preferences
CREATE POLICY "Super admins can manage all tenant integration preferences" 
ON public.tenant_integration_preferences 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE user_id = auth.uid() AND role = 'super_admin'
));

CREATE POLICY "Tenants can view their integration preferences" 
ON public.tenant_integration_preferences 
FOR SELECT 
USING (tenant_id IN (
  SELECT tenant_id FROM public.profiles 
  WHERE user_id = auth.uid()
));

-- Add triggers for updated_at
CREATE TRIGGER update_global_integrations_updated_at
  BEFORE UPDATE ON public.global_integrations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tenant_integration_preferences_updated_at
  BEFORE UPDATE ON public.tenant_integration_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some default SMS/WhatsApp providers
INSERT INTO public.global_integrations (integration_type, provider_name, display_name, configuration) VALUES
('sms', 'twilio', 'Twilio SMS', '{"account_sid": "", "auth_token": "", "from_number": ""}'),
('sms', 'africas_talking', 'Africa''s Talking SMS', '{"api_key": "", "username": "", "from": ""}'),
('whatsapp', 'twilio_whatsapp', 'Twilio WhatsApp', '{"account_sid": "", "auth_token": "", "from_number": ""}'),
('whatsapp', 'whatsapp_business', 'WhatsApp Business API', '{"access_token": "", "phone_number_id": "", "webhook_verify_token": ""}')