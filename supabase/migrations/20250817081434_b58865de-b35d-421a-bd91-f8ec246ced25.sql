-- Create database triggers to automatically create journal entries for loan and savings transactions

-- Function to create journal entries for loan disbursements
CREATE OR REPLACE FUNCTION create_loan_disbursement_journal_entry()
RETURNS TRIGGER AS $$
DECLARE
  loan_product RECORD;
  entry_id UUID;
BEGIN
  -- Get loan product accounting setup
  SELECT lp.accounting_type, lp.loan_portfolio_account_id, lp.fund_source_account_id
  INTO loan_product
  FROM loan_products lp
  WHERE lp.id = NEW.loan_product_id;
  
  -- Only create entries if accounting is enabled
  IF loan_product.accounting_type = 'accrual_periodic' OR loan_product.accounting_type = 'accrual_upfront' THEN
    -- Check required accounts are configured
    IF loan_product.loan_portfolio_account_id IS NOT NULL AND loan_product.fund_source_account_id IS NOT NULL THEN
      -- Create journal entry
      INSERT INTO journal_entries (
        tenant_id,
        transaction_date,
        description,
        reference_type,
        reference_id,
        status,
        total_amount
      ) VALUES (
        NEW.tenant_id,
        COALESCE(NEW.disbursed_on_date, NEW.created_at::date),
        'Loan disbursement - ' || NEW.loan_number,
        'loan_disbursement',
        NEW.id,
        'posted',
        NEW.principal_amount
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create journal entries for loan payments
CREATE OR REPLACE FUNCTION create_loan_payment_journal_entry()
RETURNS TRIGGER AS $$
DECLARE
  loan_info RECORD;
  entry_id UUID;
BEGIN
  -- Get loan and product information
  SELECT l.loan_number, l.tenant_id, lp.accounting_type, lp.loan_portfolio_account_id, 
         lp.interest_income_account_id, lp.fee_income_account_id, lp.penalty_income_account_id, 
         lp.fund_source_account_id
  INTO loan_info
  FROM loans l
  JOIN loan_products lp ON l.loan_product_id = lp.id
  WHERE l.id = NEW.loan_id;
  
  -- Only create entries if accounting is enabled
  IF loan_info.accounting_type = 'accrual_periodic' OR loan_info.accounting_type = 'accrual_upfront' THEN
    -- Create journal entry
    INSERT INTO journal_entries (
      tenant_id,
      transaction_date,
      description,
      reference_type,
      reference_id,
      status,
      total_amount
    ) VALUES (
      NEW.tenant_id,
      NEW.payment_date,
      'Loan payment - ' || loan_info.loan_number,
      'loan_payment',
      NEW.loan_id,
      'posted',
      NEW.payment_amount
    ) RETURNING id INTO entry_id;
    
    -- Principal payment entry
    IF NEW.principal_amount > 0 AND loan_info.loan_portfolio_account_id IS NOT NULL THEN
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
        COALESCE(loan_info.fund_source_account_id, loan_info.loan_portfolio_account_id),
        'Principal payment - ' || loan_info.loan_number,
        NEW.principal_amount,
        0
      ),
      (
        NEW.tenant_id,
        entry_id,
        loan_info.loan_portfolio_account_id,
        'Principal payment - ' || loan_info.loan_number,
        0,
        NEW.principal_amount
      );
    END IF;
    
    -- Interest payment entry
    IF NEW.interest_amount > 0 AND loan_info.interest_income_account_id IS NOT NULL THEN
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
        COALESCE(loan_info.fund_source_account_id, loan_info.loan_portfolio_account_id),
        'Interest payment - ' || loan_info.loan_number,
        NEW.interest_amount,
        0
      ),
      (
        NEW.tenant_id,
        entry_id,
        loan_info.interest_income_account_id,
        'Interest payment - ' || loan_info.loan_number,
        0,
        NEW.interest_amount
      );
    END IF;
    
    -- Fee payment entry
    IF NEW.fee_amount > 0 AND loan_info.fee_income_account_id IS NOT NULL THEN
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
        COALESCE(loan_info.fund_source_account_id, loan_info.loan_portfolio_account_id),
        'Fee payment - ' || loan_info.loan_number,
        NEW.fee_amount,
        0
      ),
      (
        NEW.tenant_id,
        entry_id,
        loan_info.fee_income_account_id,
        'Fee payment - ' || loan_info.loan_number,
        0,
        NEW.fee_amount
      );
    END IF;
    
    -- Penalty payment entry
    IF NEW.penalty_amount > 0 AND loan_info.penalty_income_account_id IS NOT NULL THEN
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
        COALESCE(loan_info.fund_source_account_id, loan_info.loan_portfolio_account_id),
        'Penalty payment - ' || loan_info.loan_number,
        NEW.penalty_amount,
        0
      ),
      (
        NEW.tenant_id,
        entry_id,
        loan_info.penalty_income_account_id,
        'Penalty payment - ' || loan_info.loan_number,
        0,
        NEW.penalty_amount
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create journal entries for savings transactions
CREATE OR REPLACE FUNCTION create_savings_transaction_journal_entry()
RETURNS TRIGGER AS $$
DECLARE
  savings_info RECORD;
  entry_id UUID;
BEGIN
  -- Get savings account and product information
  SELECT sa.account_number, sp.accounting_method, sp.savings_reference_account_id, 
         sp.savings_control_account_id, sp.interest_on_savings_account_id, 
         sp.income_from_fees_account_id
  INTO savings_info
  FROM savings_accounts sa
  JOIN savings_products sp ON sa.savings_product_id = sp.id
  WHERE sa.id = NEW.savings_account_id;
  
  -- Only create entries if accounting is enabled
  IF savings_info.accounting_method != 'none' THEN
    -- Create journal entry
    INSERT INTO journal_entries (
      tenant_id,
      transaction_date,
      description,
      reference_type,
      reference_id,
      status,
      total_amount
    ) VALUES (
      NEW.tenant_id,
      NEW.transaction_date,
      NEW.transaction_type || ' - ' || savings_info.account_number,
      'savings_transaction',
      NEW.savings_account_id,
      'posted',
      NEW.amount
    ) RETURNING id INTO entry_id;
    
    -- Handle deposits
    IF NEW.transaction_type = 'deposit' THEN
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
        COALESCE(savings_info.savings_reference_account_id, savings_info.savings_control_account_id),
        'Savings deposit - ' || savings_info.account_number,
        NEW.amount,
        0
      ),
      (
        NEW.tenant_id,
        entry_id,
        savings_info.savings_control_account_id,
        'Savings deposit - ' || savings_info.account_number,
        0,
        NEW.amount
      );
    END IF;
    
    -- Handle withdrawals
    IF NEW.transaction_type = 'withdrawal' THEN
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
        savings_info.savings_control_account_id,
        'Savings withdrawal - ' || savings_info.account_number,
        NEW.amount,
        0
      ),
      (
        NEW.tenant_id,
        entry_id,
        COALESCE(savings_info.savings_reference_account_id, savings_info.savings_control_account_id),
        'Savings withdrawal - ' || savings_info.account_number,
        0,
        NEW.amount
      );
    END IF;
    
    -- Handle fees
    IF NEW.transaction_type = 'fee' AND savings_info.income_from_fees_account_id IS NOT NULL THEN
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
        savings_info.savings_control_account_id,
        'Savings fee - ' || savings_info.account_number,
        NEW.amount,
        0
      ),
      (
        NEW.tenant_id,
        entry_id,
        savings_info.income_from_fees_account_id,
        'Savings fee - ' || savings_info.account_number,
        0,
        NEW.amount
      );
    END IF;
    
    -- Handle interest posting
    IF NEW.transaction_type = 'interest_posting' AND savings_info.interest_on_savings_account_id IS NOT NULL THEN
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
        savings_info.interest_on_savings_account_id,
        'Interest posting - ' || savings_info.account_number,
        NEW.amount,
        0
      ),
      (
        NEW.tenant_id,
        entry_id,
        savings_info.savings_control_account_id,
        'Interest posting - ' || savings_info.account_number,
        0,
        NEW.amount
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for automatic journal entry creation
DROP TRIGGER IF EXISTS trigger_loan_disbursement_accounting ON loans;
CREATE TRIGGER trigger_loan_disbursement_accounting
  AFTER UPDATE OF status ON loans
  FOR EACH ROW
  WHEN (NEW.status = 'active' AND OLD.status != 'active')
  EXECUTE FUNCTION create_loan_disbursement_journal_entry();

DROP TRIGGER IF EXISTS trigger_loan_payment_accounting ON loan_payments;
CREATE TRIGGER trigger_loan_payment_accounting
  AFTER INSERT ON loan_payments
  FOR EACH ROW
  EXECUTE FUNCTION create_loan_payment_journal_entry();

DROP TRIGGER IF EXISTS trigger_savings_transaction_accounting ON savings_transactions;
CREATE TRIGGER trigger_savings_transaction_accounting
  AFTER INSERT ON savings_transactions
  FOR EACH ROW
  EXECUTE FUNCTION create_savings_transaction_journal_entry();