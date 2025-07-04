-- Extend global_integrations table to support M-Pesa
ALTER TABLE public.global_integrations DROP CONSTRAINT IF EXISTS global_integrations_integration_type_check;
ALTER TABLE public.global_integrations ADD CONSTRAINT global_integrations_integration_type_check 
CHECK (integration_type IN ('sms', 'whatsapp', 'mpesa'));

-- Extend tenant_integration_preferences table to support M-Pesa
ALTER TABLE public.tenant_integration_preferences DROP CONSTRAINT IF EXISTS tenant_integration_preferences_integration_type_check;
ALTER TABLE public.tenant_integration_preferences ADD CONSTRAINT tenant_integration_preferences_integration_type_check 
CHECK (integration_type IN ('sms', 'whatsapp', 'mpesa'));

-- Insert default M-Pesa integration option if it doesn't exist
INSERT INTO public.global_integrations (integration_type, provider_name, display_name, configuration) 
SELECT 'mpesa', 'safaricom', 'Safaricom M-Pesa', '{"environment": "sandbox", "supports_c2b": true, "supports_b2c": true, "supports_paybill": true, "supports_till": true}'::jsonb
WHERE NOT EXISTS (
  SELECT 1 FROM public.global_integrations 
  WHERE integration_type = 'mpesa' AND provider_name = 'safaricom'
);