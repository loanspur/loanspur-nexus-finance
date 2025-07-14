-- Add comprehensive loan product configuration fields
ALTER TABLE public.loan_products 
ADD COLUMN IF NOT EXISTS require_guarantor BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS require_collateral BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS require_business_plan BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS require_financial_statements BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS require_bank_statements BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS require_income_proof BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS min_credit_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_debt_to_income_ratio DECIMAL(5,2) DEFAULT 100.00,
ADD COLUMN IF NOT EXISTS allow_joint_applications BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS require_insurance BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS auto_calculate_repayment BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS application_steps JSONB DEFAULT '["basic", "documents", "financial", "review"]'::jsonb,
ADD COLUMN IF NOT EXISTS required_documents JSONB DEFAULT '["id_copy", "income_proof"]'::jsonb;

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