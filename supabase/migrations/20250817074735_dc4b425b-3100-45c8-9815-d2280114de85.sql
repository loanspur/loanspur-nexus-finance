-- Fix the handle_loan_overpayment_and_closure function
-- The issue is that the function is not properly updating the outstanding_balance field
-- when calculating if a loan should be closed

CREATE OR REPLACE FUNCTION public.handle_loan_overpayment_and_closure()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  loan_record RECORD;
  overpaid_amount NUMERIC := 0;
  client_savings_account_id UUID;
  loan_principal NUMERIC;
  total_interest_due NUMERIC;
  total_fees_due NUMERIC;
  total_amount_due NUMERIC;
  total_payments_made NUMERIC;
BEGIN
  -- Only process for loan payments
  IF NEW.loan_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get loan details with principal and current status
  SELECT l.*, lp.name as product_name, lp.currency_code
  INTO loan_record
  FROM loans l
  JOIN loan_products lp ON l.loan_product_id = lp.id
  WHERE l.id = NEW.loan_id;

  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  -- Skip if loan is already closed
  IF loan_record.status IN ('closed', 'written_off', 'fully_paid') THEN
    RETURN NEW;
  END IF;

  -- Calculate total amount due for this loan (principal + interest + fees from schedules)
  SELECT 
    COALESCE(SUM(principal_amount), 0) as total_principal,
    COALESCE(SUM(interest_amount), 0) as total_interest,
    COALESCE(SUM(fee_amount), 0) as total_fees
  INTO loan_principal, total_interest_due, total_fees_due
  FROM loan_schedules
  WHERE loan_id = NEW.loan_id;

  total_amount_due := COALESCE(loan_principal, 0) + COALESCE(total_interest_due, 0) + COALESCE(total_fees_due, 0);

  -- Calculate total payments made including this payment
  SELECT COALESCE(SUM(payment_amount), 0)
  INTO total_payments_made
  FROM loan_payments
  WHERE loan_id = NEW.loan_id;

  -- CRITICAL FIX: Always update outstanding balance first
  UPDATE loans
  SET 
    outstanding_balance = GREATEST(0, total_amount_due - total_payments_made),
    updated_at = now()
  WHERE id = NEW.loan_id;

  -- Check if overpayment occurred
  IF total_payments_made > total_amount_due THEN
    overpaid_amount := total_payments_made - total_amount_due;
    
    -- Find client's primary savings account
    SELECT id INTO client_savings_account_id
    FROM savings_accounts
    WHERE client_id = loan_record.client_id
      AND tenant_id = loan_record.tenant_id
      AND status = 'activated'
      AND is_active = true
    ORDER BY created_at ASC
    LIMIT 1;

    -- If client has a savings account, transfer overpaid amount
    IF client_savings_account_id IS NOT NULL THEN
      -- Create savings transaction for overpaid amount
      INSERT INTO savings_transactions (
        tenant_id,
        savings_account_id,
        amount,
        transaction_type,
        transaction_date,
        description,
        reference_number,
        method,
        processed_by
      ) VALUES (
        loan_record.tenant_id,
        client_savings_account_id,
        overpaid_amount,
        'deposit',
        CURRENT_DATE,
        'Overpayment transfer from loan ' || loan_record.loan_number,
        'OVP-' || NEW.id,
        'internal_transfer',
        NEW.processed_by
      );

      -- Update savings account balance
      UPDATE savings_accounts
      SET 
        account_balance = COALESCE(account_balance, 0) + overpaid_amount,
        available_balance = COALESCE(available_balance, 0) + overpaid_amount,
        updated_at = now()
      WHERE id = client_savings_account_id;

      -- Create transaction record for the transfer using savings_deposit type
      INSERT INTO transactions (
        tenant_id,
        client_id,
        loan_id,
        savings_account_id,
        amount,
        transaction_type,
        payment_type,
        payment_status,
        transaction_date,
        transaction_id,
        description,
        processed_by
      ) VALUES (
        loan_record.tenant_id,
        loan_record.client_id,
        NEW.loan_id,
        client_savings_account_id,
        overpaid_amount,
        'savings_deposit',
        'internal_transfer',
        'completed',
        CURRENT_DATE,
        'TXF-' || extract(epoch from now())::bigint,
        'Overpayment transfer: ' || overpaid_amount || ' from loan ' || loan_record.loan_number || ' to savings',
        NEW.processed_by
      );
    END IF;

    -- Auto-close the loan when fully paid (regardless of overpayment transfer)
    UPDATE loans
    SET 
      status = 'closed',
      outstanding_balance = 0,
      updated_at = now()
    WHERE id = NEW.loan_id;

    -- Update all remaining unpaid schedules to paid
    UPDATE loan_schedules
    SET 
      paid_amount = total_amount,
      outstanding_amount = 0,
      payment_status = 'paid'
    WHERE loan_id = NEW.loan_id
      AND payment_status != 'paid';

  END IF;

  RETURN NEW;
END;
$function$;