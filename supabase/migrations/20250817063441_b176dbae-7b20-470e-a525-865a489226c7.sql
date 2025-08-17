-- Fix security warnings by setting search path for new functions
DROP FUNCTION IF EXISTS public.validate_loan_repayment_status();
DROP FUNCTION IF EXISTS public.validate_transaction_loan_status();

-- Recreate with proper search path
CREATE OR REPLACE FUNCTION public.validate_loan_repayment_status()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
$$;

CREATE OR REPLACE FUNCTION public.validate_transaction_loan_status()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
$$;