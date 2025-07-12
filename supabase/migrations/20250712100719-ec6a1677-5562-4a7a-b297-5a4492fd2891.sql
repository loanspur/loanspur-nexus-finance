-- Update loan status enum to include proper workflow stages
ALTER TYPE loan_status ADD VALUE 'under_review';
ALTER TYPE loan_status ADD VALUE 'pending_disbursement';
ALTER TYPE loan_status ADD VALUE 'disbursed';
ALTER TYPE loan_status ADD VALUE 'rejected';
ALTER TYPE loan_status ADD VALUE 'withdrawn';

-- Create loan approvals table to track approval workflow
CREATE TABLE public.loan_approvals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  loan_application_id UUID NOT NULL REFERENCES public.loan_applications(id) ON DELETE CASCADE,
  approver_id UUID NOT NULL REFERENCES public.profiles(id),
  approval_level INTEGER NOT NULL DEFAULT 1,
  action TEXT NOT NULL CHECK (action IN ('approve', 'reject', 'request_changes')),
  comments TEXT,
  approved_amount NUMERIC,
  approved_term INTEGER,
  approved_interest_rate NUMERIC,
  conditions TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create loan disbursements table to track disbursement process
CREATE TABLE public.loan_disbursements (
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

-- Add indexes for performance
CREATE INDEX idx_loan_approvals_tenant_id ON public.loan_approvals(tenant_id);
CREATE INDEX idx_loan_approvals_loan_application_id ON public.loan_approvals(loan_application_id);
CREATE INDEX idx_loan_approvals_approver_id ON public.loan_approvals(approver_id);
CREATE INDEX idx_loan_disbursements_tenant_id ON public.loan_disbursements(tenant_id);
CREATE INDEX idx_loan_disbursements_loan_application_id ON public.loan_disbursements(loan_application_id);
CREATE INDEX idx_loan_disbursements_status ON public.loan_disbursements(status);

-- Enable RLS
ALTER TABLE public.loan_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loan_disbursements ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for loan_approvals
CREATE POLICY "Users can access their tenant's loan approvals" 
ON public.loan_approvals 
FOR ALL 
USING (tenant_id IN (
  SELECT tenant_id FROM profiles WHERE user_id = auth.uid()
));

-- Create RLS policies for loan_disbursements
CREATE POLICY "Users can access their tenant's loan disbursements" 
ON public.loan_disbursements 
FOR ALL 
USING (tenant_id IN (
  SELECT tenant_id FROM profiles WHERE user_id = auth.uid()
));

-- Add triggers for updated_at timestamps
CREATE TRIGGER update_loan_approvals_updated_at
  BEFORE UPDATE ON public.loan_approvals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_loan_disbursements_updated_at
  BEFORE UPDATE ON public.loan_disbursements
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Update loan_applications status default to pending
ALTER TABLE public.loan_applications 
ALTER COLUMN status SET DEFAULT 'pending';

-- Add approval workflow tracking to loan_applications
ALTER TABLE public.loan_applications 
ADD COLUMN requires_approval BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN approval_level INTEGER DEFAULT 1,
ADD COLUMN final_approved_amount NUMERIC,
ADD COLUMN final_approved_term INTEGER,
ADD COLUMN final_approved_interest_rate NUMERIC;