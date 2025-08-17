-- Add product snapshot fields to loans table to preserve loan product details at creation
ALTER TABLE public.loans 
ADD COLUMN loan_product_snapshot JSONB;

-- Add comment to explain the purpose
COMMENT ON COLUMN public.loans.loan_product_snapshot IS 'Snapshot of loan product configuration at loan creation time to preserve original terms';

-- Add trigger to prevent loan repayments on closed loans
CREATE OR REPLACE FUNCTION public.validate_loan_repayment_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if the loan is closed
  IF NEW.loan_id IS NOT NULL THEN
    DECLARE
      loan_status TEXT;
    BEGIN
      SELECT status INTO loan_status 
      FROM public.loans 
      WHERE id = NEW.loan_id;
      
      IF loan_status IN ('closed', 'written_off', 'fully_paid') THEN
        RAISE EXCEPTION 'Cannot process repayments on closed loans (status: %)', loan_status;
      END IF;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for loan_payments table
CREATE TRIGGER validate_loan_payment_status_trigger
  BEFORE INSERT ON public.loan_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_loan_repayment_status();

-- Create trigger for transactions table (loan repayments)  
CREATE OR REPLACE FUNCTION public.validate_transaction_loan_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if this is a loan repayment transaction
  IF NEW.transaction_type = 'loan_repayment' AND NEW.loan_id IS NOT NULL THEN
    DECLARE
      loan_status TEXT;
    BEGIN
      SELECT status INTO loan_status 
      FROM public.loans 
      WHERE id = NEW.loan_id;
      
      IF loan_status IN ('closed', 'written_off', 'fully_paid') THEN
        RAISE EXCEPTION 'Cannot process loan repayments on closed loans (status: %)', loan_status;
      END IF;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_transaction_loan_status_trigger
  BEFORE INSERT ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_transaction_loan_status();