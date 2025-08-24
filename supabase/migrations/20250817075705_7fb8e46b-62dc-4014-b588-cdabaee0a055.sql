-- Create financial_activity_mappings table that is referenced in accounting hooks
CREATE TABLE IF NOT EXISTS public.financial_activity_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  activity_name text NOT NULL,
  activity_code text NOT NULL,
  description text,
  account_id uuid NOT NULL REFERENCES public.chart_of_accounts(id),
  mapping_type text NOT NULL DEFAULT 'manual',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, activity_code)
);

-- Enable RLS on financial_activity_mappings
ALTER TABLE public.financial_activity_mappings ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for financial_activity_mappings
CREATE POLICY "Users can access their tenant's financial activity mappings"
ON public.financial_activity_mappings
FOR ALL
USING (tenant_id IN (
  SELECT tenant_id FROM public.profiles WHERE user_id = auth.uid()
));

-- Add trigger for updated_at
CREATE TRIGGER update_financial_activity_mappings_updated_at
  BEFORE UPDATE ON public.financial_activity_mappings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable real-time for the table
ALTER TABLE public.financial_activity_mappings REPLICA IDENTITY FULL;

-- Add the table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.financial_activity_mappings;