-- Add missing loan status values to enum
DO $$ 
BEGIN
    -- Check if status values already exist before adding them
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'under_review' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'loan_status')) THEN
        ALTER TYPE loan_status ADD VALUE 'under_review';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'pending_disbursement' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'loan_status')) THEN
        ALTER TYPE loan_status ADD VALUE 'pending_disbursement';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'disbursed' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'loan_status')) THEN
        ALTER TYPE loan_status ADD VALUE 'disbursed';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'rejected' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'loan_status')) THEN
        ALTER TYPE loan_status ADD VALUE 'rejected';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'withdrawn' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'loan_status')) THEN
        ALTER TYPE loan_status ADD VALUE 'withdrawn';
    END IF;
END $$;

-- Create loan disbursements table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.loan_disbursements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  loan_application_id UUID NOT NULL REFERENCES public.loan_applications(id) ON DELETE CASCADE,
  loan_id UUID, -- Will be created after disbursement
  disbursed_amount NUMERIC NOT NULL,
  disbursement_date DATE NOT NULL,
  disbursement_method TEXT NOT NULL DEFAULT 'bank_transfer',
  bank_account_name TEXT,
  bank_account_number TEXT,
  bank_name TEXT,
  mpesa_phone TEXT,
  reference_number TEXT,
  disbursed_by UUID REFERENCES public.profiles(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  failure_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add columns to loan_approvals if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'loan_approvals' AND column_name = 'tenant_id') THEN
        ALTER TABLE public.loan_approvals ADD COLUMN tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'loan_approvals' AND column_name = 'action') THEN
        ALTER TABLE public.loan_approvals ADD COLUMN action TEXT NOT NULL DEFAULT 'approve' CHECK (action IN ('approve', 'reject', 'request_changes'));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'loan_approvals' AND column_name = 'comments') THEN
        ALTER TABLE public.loan_approvals ADD COLUMN comments TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'loan_approvals' AND column_name = 'approved_interest_rate') THEN
        ALTER TABLE public.loan_approvals ADD COLUMN approved_interest_rate NUMERIC;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'loan_approvals' AND column_name = 'conditions') THEN
        ALTER TABLE public.loan_approvals ADD COLUMN conditions TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'loan_approvals' AND column_name = 'updated_at') THEN
        ALTER TABLE public.loan_approvals ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now();
    END IF;
END $$;

-- Add workflow tracking columns to loan_applications if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'loan_applications' AND column_name = 'requires_approval') THEN
        ALTER TABLE public.loan_applications ADD COLUMN requires_approval BOOLEAN NOT NULL DEFAULT true;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'loan_applications' AND column_name = 'approval_level') THEN
        ALTER TABLE public.loan_applications ADD COLUMN approval_level INTEGER DEFAULT 1;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'loan_applications' AND column_name = 'final_approved_amount') THEN
        ALTER TABLE public.loan_applications ADD COLUMN final_approved_amount NUMERIC;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'loan_applications' AND column_name = 'final_approved_term') THEN
        ALTER TABLE public.loan_applications ADD COLUMN final_approved_term INTEGER;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'loan_applications' AND column_name = 'final_approved_interest_rate') THEN
        ALTER TABLE public.loan_applications ADD COLUMN final_approved_interest_rate NUMERIC;
    END IF;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_loan_disbursements_tenant_id ON public.loan_disbursements(tenant_id);
CREATE INDEX IF NOT EXISTS idx_loan_disbursements_loan_application_id ON public.loan_disbursements(loan_application_id);
CREATE INDEX IF NOT EXISTS idx_loan_disbursements_status ON public.loan_disbursements(status);

-- Enable RLS on loan_disbursements if not already enabled
ALTER TABLE public.loan_disbursements ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for loan_disbursements
DROP POLICY IF EXISTS "Users can access their tenant's loan disbursements" ON public.loan_disbursements;
CREATE POLICY "Users can access their tenant's loan disbursements" 
ON public.loan_disbursements 
FOR ALL 
USING (tenant_id IN (
  SELECT tenant_id FROM profiles WHERE user_id = auth.uid()
));

-- Add trigger for loan_disbursements updated_at if it doesn't exist
DROP TRIGGER IF EXISTS update_loan_disbursements_updated_at ON public.loan_disbursements;
CREATE TRIGGER update_loan_disbursements_updated_at
  BEFORE UPDATE ON public.loan_disbursements
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add trigger for loan_approvals updated_at if it doesn't exist  
DROP TRIGGER IF EXISTS update_loan_approvals_updated_at ON public.loan_approvals;
CREATE TRIGGER update_loan_approvals_updated_at
  BEFORE UPDATE ON public.loan_approvals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();