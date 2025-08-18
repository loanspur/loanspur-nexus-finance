-- Fix function search path security issues
CREATE OR REPLACE FUNCTION harmonize_all_existing_loans()
RETURNS TABLE(
  loan_id UUID,
  old_interest_rate NUMERIC,
  new_interest_rate NUMERIC,
  old_outstanding NUMERIC,
  new_outstanding NUMERIC,
  status TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  loan_record RECORD;
  normalized_rate NUMERIC;
  calculated_outstanding NUMERIC;
  total_scheduled NUMERIC;
  total_paid NUMERIC;
BEGIN
  -- Loop through all active loans
  FOR loan_record IN 
    SELECT l.*, lp.repayment_frequency, lp.interest_calculation_method, lp.default_nominal_interest_rate
    FROM public.loans l
    JOIN public.loan_products lp ON l.loan_product_id = lp.id
    WHERE l.status NOT IN ('closed', 'written_off')
  LOOP
    -- Normalize interest rate (handle various formats)
    IF loan_record.interest_rate <= 0.01 THEN
      -- Very small decimal (0.0067 for 0.67%)
      normalized_rate := loan_record.interest_rate * 100;
    ELSIF loan_record.interest_rate <= 1 THEN
      -- Decimal format (0.067 for 6.7% or 0.12 for 12%)
      normalized_rate := loan_record.interest_rate * 100;
    ELSIF loan_record.interest_rate > 100 THEN
      -- Likely error: 1200 instead of 12%
      normalized_rate := loan_record.interest_rate / 100;
    ELSE
      -- Already in percentage form (6.7% or 12%)
      normalized_rate := loan_record.interest_rate;
    END IF;

    -- Calculate total scheduled amount from loan schedules
    SELECT COALESCE(SUM(total_amount), 0) INTO total_scheduled
    FROM public.loan_schedules
    WHERE loan_id = loan_record.id;

    -- Calculate total paid amount from loan payments
    SELECT COALESCE(SUM(payment_amount), 0) INTO total_paid
    FROM public.loan_payments
    WHERE loan_id = loan_record.id;

    -- Calculate accurate outstanding balance
    calculated_outstanding := GREATEST(0, total_scheduled - total_paid);

    -- Update loan with harmonized values
    UPDATE public.loans
    SET 
      interest_rate = normalized_rate / 100, -- Store as decimal
      outstanding_balance = calculated_outstanding,
      updated_at = now()
    WHERE id = loan_record.id;

    -- Update loan schedules outstanding amounts
    UPDATE public.loan_schedules
    SET 
      outstanding_amount = GREATEST(0, total_amount - COALESCE(paid_amount, 0)),
      payment_status = CASE
        WHEN COALESCE(paid_amount, 0) >= total_amount THEN 'paid'
        WHEN COALESCE(paid_amount, 0) > 0 THEN 'partial'
        ELSE 'unpaid'
      END
    WHERE loan_id = loan_record.id;

    -- Return harmonization results
    RETURN QUERY SELECT 
      loan_record.id,
      loan_record.interest_rate,
      normalized_rate,
      loan_record.outstanding_balance,
      calculated_outstanding,
      'harmonized'::TEXT;
  END LOOP;

  RETURN;
END;
$$;