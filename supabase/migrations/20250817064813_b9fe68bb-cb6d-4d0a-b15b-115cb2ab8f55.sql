-- Create loan payment reversals table
CREATE TABLE public.loan_payment_reversals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  original_payment_id UUID NOT NULL,
  loan_id UUID NOT NULL,
  reversed_amount NUMERIC NOT NULL,
  principal_amount NUMERIC NOT NULL DEFAULT 0,
  interest_amount NUMERIC NOT NULL DEFAULT 0,
  fee_amount NUMERIC NOT NULL DEFAULT 0,
  penalty_amount NUMERIC NOT NULL DEFAULT 0,
  reversal_date DATE NOT NULL,
  reversed_by UUID,
  reason TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.loan_payment_reversals ENABLE ROW LEVEL SECURITY;

-- Create policy for tenant access
CREATE POLICY "Users can access their tenant's loan payment reversals" 
ON public.loan_payment_reversals 
FOR ALL 
USING (tenant_id IN (
  SELECT profiles.tenant_id 
  FROM profiles 
  WHERE profiles.user_id = auth.uid()
));

-- Add updated_at trigger
CREATE TRIGGER update_loan_payment_reversals_updated_at
  BEFORE UPDATE ON public.loan_payment_reversals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add penalty_amount column to loan_payments table if it doesn't exist
DO $$ BEGIN
  ALTER TABLE public.loan_payments ADD COLUMN penalty_amount NUMERIC DEFAULT 0;
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;

-- Add status and reversal tracking columns to loan_payments
DO $$ BEGIN
  ALTER TABLE public.loan_payments ADD COLUMN status TEXT DEFAULT 'completed';
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.loan_payments ADD COLUMN reversed_at TIMESTAMP WITH TIME ZONE;
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.loan_payments ADD COLUMN reversed_by UUID;
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;