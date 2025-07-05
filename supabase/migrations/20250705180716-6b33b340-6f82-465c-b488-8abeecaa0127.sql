-- Update account balances table with additional functionality
-- Add computed balance field and improve constraints

-- Add computed balance function
CREATE OR REPLACE FUNCTION calculate_account_balance(p_account_id UUID, p_date DATE DEFAULT CURRENT_DATE)
RETURNS NUMERIC AS $$
DECLARE
  balance NUMERIC := 0;
BEGIN
  -- Calculate balance from journal entries
  SELECT COALESCE(SUM(
    CASE 
      WHEN chart_of_accounts.account_type IN ('asset', 'expense') 
      THEN journal_entry_lines.debit_amount - journal_entry_lines.credit_amount
      ELSE journal_entry_lines.credit_amount - journal_entry_lines.debit_amount
    END
  ), 0) INTO balance
  FROM journal_entry_lines
  JOIN journal_entries ON journal_entry_lines.journal_entry_id = journal_entries.id
  JOIN chart_of_accounts ON journal_entry_lines.account_id = chart_of_accounts.id
  WHERE journal_entry_lines.account_id = p_account_id
    AND journal_entries.transaction_date <= p_date
    AND journal_entries.status = 'posted';
    
  RETURN balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add function to automatically update account balances
CREATE OR REPLACE FUNCTION update_account_balance_from_journal_entry()
RETURNS TRIGGER AS $$
DECLARE
  account_record RECORD;
  balance_date DATE;
BEGIN
  -- Get the transaction date
  IF TG_OP = 'DELETE' THEN
    SELECT transaction_date INTO balance_date FROM journal_entries WHERE id = OLD.journal_entry_id;
  ELSE
    SELECT transaction_date INTO balance_date FROM journal_entries WHERE id = NEW.journal_entry_id;
  END IF;

  -- Update balances for affected accounts
  FOR account_record IN 
    SELECT DISTINCT account_id FROM (
      SELECT OLD.account_id AS account_id WHERE TG_OP IN ('UPDATE', 'DELETE')
      UNION
      SELECT NEW.account_id AS account_id WHERE TG_OP IN ('UPDATE', 'INSERT')
    ) accounts
  LOOP
    -- Insert or update account balance
    INSERT INTO account_balances (
      tenant_id,
      account_id,
      balance_date,
      closing_balance
    )
    SELECT 
      c.tenant_id,
      account_record.account_id,
      balance_date,
      calculate_account_balance(account_record.account_id, balance_date)
    FROM chart_of_accounts c
    WHERE c.id = account_record.account_id
    ON CONFLICT (tenant_id, account_id, balance_date)
    DO UPDATE SET
      closing_balance = calculate_account_balance(account_record.account_id, balance_date),
      updated_at = now();
  END LOOP;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add trigger to automatically update account balances when journal entries change
DROP TRIGGER IF EXISTS update_account_balances_on_journal_change ON journal_entry_lines;
CREATE TRIGGER update_account_balances_on_journal_change
  AFTER INSERT OR UPDATE OR DELETE ON journal_entry_lines
  FOR EACH ROW
  EXECUTE FUNCTION update_account_balance_from_journal_entry();

-- Add function to get current account balance
CREATE OR REPLACE FUNCTION get_current_account_balance(p_account_id UUID)
RETURNS NUMERIC AS $$
BEGIN
  RETURN calculate_account_balance(p_account_id, CURRENT_DATE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update chart_of_accounts to sync balance field
CREATE OR REPLACE FUNCTION sync_chart_account_balance()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the balance field in chart_of_accounts when account_balances changes
  UPDATE chart_of_accounts 
  SET balance = NEW.closing_balance,
      updated_at = now()
  WHERE id = NEW.account_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add trigger to sync chart_of_accounts balance
DROP TRIGGER IF EXISTS sync_chart_balance ON account_balances;
CREATE TRIGGER sync_chart_balance
  AFTER INSERT OR UPDATE ON account_balances
  FOR EACH ROW
  EXECUTE FUNCTION sync_chart_account_balance();