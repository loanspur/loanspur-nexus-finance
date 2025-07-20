-- Add application_id column to loans table to establish proper relationship
ALTER TABLE public.loans 
ADD COLUMN application_id UUID REFERENCES public.loan_applications(id);

-- Create index for better performance
CREATE INDEX idx_loans_application_id ON public.loans(application_id);

-- Update existing loans to link them to their applications if possible
-- This might not be possible for existing data, but it sets up the structure