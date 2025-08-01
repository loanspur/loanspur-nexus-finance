-- Create client_identifiers table for managing additional client identifiers
CREATE TABLE public.client_identifiers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  client_id UUID NOT NULL,
  identifier_type TEXT NOT NULL, -- 'passport', 'driver_license', 'additional_phone', 'social_security', etc.
  identifier_value TEXT NOT NULL,
  expiry_date DATE,
  issuing_authority TEXT,
  notes TEXT,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  verified_at TIMESTAMP WITH TIME ZONE,
  verified_by UUID,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.client_identifiers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can access their tenant's client identifiers" 
ON public.client_identifiers 
FOR ALL 
USING (tenant_id IN (
  SELECT tenant_id FROM public.profiles WHERE user_id = auth.uid()
));

-- Add unique constraint to prevent duplicate identifier types per client
ALTER TABLE public.client_identifiers 
ADD CONSTRAINT client_identifiers_unique_type_per_client 
UNIQUE (tenant_id, client_id, identifier_type, identifier_value);

-- Create trigger for updated_at
CREATE TRIGGER update_client_identifiers_updated_at
  BEFORE UPDATE ON public.client_identifiers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_client_identifiers_client_id ON public.client_identifiers(client_id);
CREATE INDEX idx_client_identifiers_tenant_id ON public.client_identifiers(tenant_id);
CREATE INDEX idx_client_identifiers_type ON public.client_identifiers(identifier_type);