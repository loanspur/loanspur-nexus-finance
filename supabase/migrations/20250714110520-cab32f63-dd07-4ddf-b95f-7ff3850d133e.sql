-- Add comprehensive loan product configuration fields
ALTER TABLE public.loan_products 
ADD COLUMN require_guarantor BOOLEAN DEFAULT false,
ADD COLUMN require_collateral BOOLEAN DEFAULT false,
ADD COLUMN require_business_plan BOOLEAN DEFAULT false,
ADD COLUMN require_financial_statements BOOLEAN DEFAULT false,
ADD COLUMN require_bank_statements BOOLEAN DEFAULT false,
ADD COLUMN require_income_proof BOOLEAN DEFAULT false,
ADD COLUMN min_credit_score INTEGER DEFAULT 0,
ADD COLUMN max_debt_to_income_ratio DECIMAL(5,2) DEFAULT 100.00,
ADD COLUMN allow_joint_applications BOOLEAN DEFAULT false,
ADD COLUMN require_insurance BOOLEAN DEFAULT false,
ADD COLUMN auto_calculate_repayment BOOLEAN DEFAULT true,
ADD COLUMN application_steps JSONB DEFAULT '["basic", "documents", "financial", "review"]'::jsonb,
ADD COLUMN required_documents JSONB DEFAULT '["id_copy", "income_proof"]'::jsonb;

-- Create comprehensive loan applications table extensions
CREATE TABLE IF NOT EXISTS public.loan_application_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_application_id UUID NOT NULL REFERENCES public.loan_applications(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  document_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  is_verified BOOLEAN DEFAULT false,
  verified_by UUID REFERENCES public.profiles(id),
  verified_at TIMESTAMP WITH TIME ZONE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create guarantors table
CREATE TABLE IF NOT EXISTS public.loan_guarantors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_application_id UUID NOT NULL REFERENCES public.loan_applications(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  national_id TEXT,
  relationship_to_borrower TEXT,
  employment_status TEXT,
  employer_name TEXT,
  monthly_income DECIMAL(15,2),
  address JSONB,
  guarantor_type TEXT DEFAULT 'individual', -- individual, corporate
  is_primary BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'pending', -- pending, accepted, rejected
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create collateral table
CREATE TABLE IF NOT EXISTS public.loan_collateral (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_application_id UUID NOT NULL REFERENCES public.loan_applications(id) ON DELETE CASCADE,
  collateral_type TEXT NOT NULL, -- property, vehicle, equipment, securities, cash
  collateral_name TEXT NOT NULL,
  description TEXT,
  estimated_value DECIMAL(15,2) NOT NULL,
  valuation_date DATE,
  valuator_name TEXT,
  location TEXT,
  registration_number TEXT,
  ownership_documents JSONB, -- URLs to ownership documents
  insurance_details JSONB,
  lien_holder TEXT,
  status TEXT DEFAULT 'pending', -- pending, verified, rejected
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add comprehensive fields to loan_applications
ALTER TABLE public.loan_applications 
ADD COLUMN IF NOT EXISTS application_step TEXT DEFAULT 'basic',
ADD COLUMN IF NOT EXISTS financial_data JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS credit_score INTEGER,
ADD COLUMN IF NOT EXISTS debt_to_income_ratio DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS employment_verification JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS business_information JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS repayment_schedule JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS risk_assessment JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS is_joint_application BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS co_borrower_id UUID REFERENCES public.clients(id);

-- Enable RLS on new tables
ALTER TABLE public.loan_application_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loan_guarantors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loan_collateral ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can access their tenant's loan application documents"
ON public.loan_application_documents FOR ALL
USING (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can access their tenant's loan guarantors"
ON public.loan_guarantors FOR ALL
USING (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can access their tenant's loan collateral"
ON public.loan_collateral FOR ALL
USING (tenant_id IN (SELECT tenant_id FROM public.profiles WHERE user_id = auth.uid()));

-- Add comments
COMMENT ON TABLE public.loan_application_documents IS 'Documents uploaded for loan applications';
COMMENT ON TABLE public.loan_guarantors IS 'Guarantors for loan applications';
COMMENT ON TABLE public.loan_collateral IS 'Collateral items for loan applications';