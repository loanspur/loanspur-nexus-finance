-- Add fund_id to loan_products table to link loan products with funds
ALTER TABLE public.loan_products 
ADD COLUMN fund_id UUID REFERENCES public.funds(id);

-- Add fund_id to loan_applications table to link applications with funds  
ALTER TABLE public.loan_applications 
ADD COLUMN fund_id UUID REFERENCES public.funds(id);

-- Add a comment explaining the fund relationship
COMMENT ON COLUMN public.loan_products.fund_id IS 'Links loan product to a fund source for disbursements';
COMMENT ON COLUMN public.loan_applications.fund_id IS 'Links loan application to a fund source for disbursements';