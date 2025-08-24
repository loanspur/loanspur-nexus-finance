-- Fix missing entry_number in loan disbursement journal entries
-- Update the create_loan_disbursement_journal_entry function to generate entry numbers

CREATE OR REPLACE FUNCTION public.create_loan_disbursement_journal_entry()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  loan_product RECORD;
  client_office_id UUID;
  entry_id UUID;
  entry_number TEXT;
BEGIN
  -- Get loan product accounting setup and client office
  SELECT lp.accounting_type, lp.loan_portfolio_account_id, lp.fund_source_account_id, c.office_id
  INTO loan_product
  FROM loan_products lp
  JOIN clients c ON c.id = NEW.client_id
  WHERE lp.id = NEW.loan_product_id;
  
  -- Store client office for journal entry
  client_office_id := loan_product.office_id;
  
  -- Only create entries if accounting is enabled
  IF loan_product.accounting_type = 'accrual_periodic' OR loan_product.accounting_type = 'accrual_upfront' THEN
    -- Check required accounts are configured
    IF loan_product.loan_portfolio_account_id IS NOT NULL AND loan_product.fund_source_account_id IS NOT NULL THEN
      -- Generate entry number
      entry_number := 'JE-' || EXTRACT(year FROM CURRENT_DATE) || '-' || LPAD((EXTRACT(epoch FROM now()) * 1000000)::bigint::text, 6, '0');
      
      -- Create journal entry with office_id and entry_number
      INSERT INTO journal_entries (
        tenant_id,
        entry_number,
        transaction_date,
        description,
        reference_type,
        reference_id,
        status,
        total_amount,
        office_id
      ) VALUES (
        NEW.tenant_id,
        entry_number,
        COALESCE(NEW.disbursement_date, NEW.created_at::date),
        'Loan disbursement - ' || NEW.loan_number,
        'loan_disbursement',
        NEW.id,
        'posted',
        NEW.principal_amount,
        client_office_id
      ) RETURNING id INTO entry_id;
      
      -- Create journal entry lines
      INSERT INTO journal_entry_lines (
        tenant_id,
        journal_entry_id,
        account_id,
        description,
        debit_amount,
        credit_amount
      ) VALUES 
      (
        NEW.tenant_id,
        entry_id,
        loan_product.loan_portfolio_account_id,
        'Loan disbursement - ' || NEW.loan_number,
        NEW.principal_amount,
        0
      ),
      (
        NEW.tenant_id,
        entry_id,
        loan_product.fund_source_account_id,
        'Loan disbursement - ' || NEW.loan_number,
        0,
        NEW.principal_amount
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;