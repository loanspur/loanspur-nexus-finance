-- Add fee_mappings column to loan_products for per-fee income account mapping
ALTER TABLE public.loan_products
ADD COLUMN IF NOT EXISTS fee_mappings jsonb DEFAULT '[]'::jsonb;