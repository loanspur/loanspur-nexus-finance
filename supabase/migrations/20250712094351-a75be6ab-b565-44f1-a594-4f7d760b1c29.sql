-- Create fee_structures table
CREATE TABLE public.fee_structures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  fee_type TEXT NOT NULL,
  calculation_type TEXT NOT NULL DEFAULT 'fixed',
  amount NUMERIC NOT NULL DEFAULT 0,
  percentage_rate NUMERIC,
  min_amount NUMERIC,
  max_amount NUMERIC,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.fee_structures ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can access their tenant's fee structures" 
ON public.fee_structures 
FOR ALL
USING (tenant_id IN (
  SELECT tenant_id FROM profiles WHERE user_id = auth.uid()
));

-- Add foreign key constraint
ALTER TABLE public.fee_structures 
ADD CONSTRAINT fk_fee_structures_tenant 
FOREIGN KEY (tenant_id) REFERENCES public.tenants(id);

-- Add trigger for updated_at
CREATE TRIGGER update_fee_structures_updated_at
  BEFORE UPDATE ON public.fee_structures
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();