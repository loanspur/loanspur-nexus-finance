-- Add missing creation columns to loans table for unified interest calculation
ALTER TABLE public.loans 
ADD COLUMN IF NOT EXISTS creation_interest_rate NUMERIC,
ADD COLUMN IF NOT EXISTS creation_term_months INTEGER,
ADD COLUMN IF NOT EXISTS creation_principal NUMERIC;

-- Update existing loans with current values to populate the new columns
UPDATE public.loans 
SET 
  creation_interest_rate = interest_rate,
  creation_term_months = term_months,
  creation_principal = principal_amount
WHERE creation_interest_rate IS NULL;