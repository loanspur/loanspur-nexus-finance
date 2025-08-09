-- Create table to map products' payment channels to chart of accounts (asset/liability) accounts
CREATE TABLE IF NOT EXISTS public.product_fund_source_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  product_id UUID NOT NULL,
  product_type TEXT NOT NULL CHECK (product_type IN ('loan','savings')),
  channel_id TEXT NOT NULL,
  channel_name TEXT NOT NULL,
  account_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_product_channel UNIQUE (tenant_id, product_id, product_type, channel_id),
  CONSTRAINT fk_account_id FOREIGN KEY (account_id) REFERENCES public.chart_of_accounts (id) ON DELETE RESTRICT
);

-- Enable RLS
ALTER TABLE public.product_fund_source_mappings ENABLE ROW LEVEL SECURITY;

-- Policy: tenant users can manage their mappings
DO $$ BEGIN
  CREATE POLICY "Users can manage their tenant's product fund sources"
  ON public.product_fund_source_mappings
  FOR ALL
  USING (
    tenant_id IN (
      SELECT profiles.tenant_id FROM public.profiles WHERE profiles.user_id = auth.uid()
    )
  )
  WITH CHECK (
    tenant_id IN (
      SELECT profiles.tenant_id FROM public.profiles WHERE profiles.user_id = auth.uid()
    )
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Trigger to keep updated_at fresh
DO $$ BEGIN
  CREATE TRIGGER update_product_fund_source_mappings_updated_at
  BEFORE UPDATE ON public.product_fund_source_mappings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_product_fund_mappings_tenant_product
  ON public.product_fund_source_mappings (tenant_id, product_id);
