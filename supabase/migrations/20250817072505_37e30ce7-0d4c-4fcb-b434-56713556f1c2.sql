-- Create function to handle loan overpayment and auto-close loans
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
  SELECT COALESCE(SUM(payment_amount), 0) + NEW.payment_amount
  INTO total_payments_made
  FROM loan_payments
  WHERE loan_id = NEW.loan_id
    AND id != NEW.id; -- Exclude current payment to avoid double counting

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
        'Loan overpayment transfer from loan ' || loan_record.loan_number,
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

      -- Create transaction record for the transfer
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
        'transfer',
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
      closed_date = CURRENT_DATE,
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

  ELSE
    -- Update loan outstanding balance for partial payments
    UPDATE loans
    SET 
      outstanding_balance = GREATEST(0, total_amount_due - total_payments_made),
      updated_at = now()
    WHERE id = NEW.loan_id;
  END IF;

  RETURN NEW;
END;
$function$;

-- Create trigger to automatically handle overpayments and loan closure
DROP TRIGGER IF EXISTS trigger_handle_loan_overpayment_closure ON loan_payments;
CREATE TRIGGER trigger_handle_loan_overpayment_closure
  AFTER INSERT ON loan_payments
  FOR EACH ROW
  EXECUTE FUNCTION handle_loan_overpayment_and_closure();

-- Enable real-time updates for relevant tables
ALTER TABLE loans REPLICA IDENTITY FULL;
ALTER TABLE savings_accounts REPLICA IDENTITY FULL;
ALTER TABLE savings_transactions REPLICA IDENTITY FULL;
ALTER TABLE transactions REPLICA IDENTITY FULL;

-- Add tables to realtime publication
DO $$
BEGIN
  -- Add loans table to realtime
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'loans'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE loans;
  END IF;
  
  -- Add savings_accounts table to realtime
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'savings_accounts'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE savings_accounts;
  END IF;
  
  -- Add savings_transactions table to realtime
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'savings_transactions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE savings_transactions;
  END IF;
END $$;