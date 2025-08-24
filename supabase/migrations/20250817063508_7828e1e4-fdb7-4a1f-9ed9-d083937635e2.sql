-- Fix security warnings by dropping triggers first, then recreating functions with proper search path

-- Drop triggers first
DROP TRIGGER IF EXISTS validate_loan_payment_status_trigger ON public.loan_payments;
DROP TRIGGER IF EXISTS validate_transaction_loan_status_trigger ON public.transactions;

-- Drop functions
DROP FUNCTION IF EXISTS public.validate_loan_repayment_status();
DROP FUNCTION IF EXISTS public.validate_transaction_loan_status();

-- Recreate functions with proper search path
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

-- Recreate triggers
CREATE TRIGGER validate_loan_payment_status_trigger
  BEFORE INSERT ON public.loan_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_loan_repayment_status();

CREATE TRIGGER validate_transaction_loan_status_trigger
  BEFORE INSERT ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_transaction_loan_status();