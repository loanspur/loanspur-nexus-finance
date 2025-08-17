-- Create enhanced function to calculate account balance with period details
CREATE OR REPLACE FUNCTION public.calculate_account_balance_with_periods(
  p_account_id uuid, 
  p_date date DEFAULT CURRENT_DATE,
  p_period_start date DEFAULT NULL
)
RETURNS TABLE(
  opening_balance numeric,
  period_debits numeric,
  period_credits numeric,
  closing_balance numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  period_start_date date;
BEGIN
  -- If no period start provided, use beginning of current month
  IF p_period_start IS NULL THEN
    period_start_date := date_trunc('month', p_date)::date;
  ELSE
    period_start_date := p_period_start;
  END IF;

  -- Calculate opening balance (from beginning of time to period start - 1 day)
  WITH opening_calc AS (
    SELECT COALESCE(SUM(
      CASE 
        WHEN chart_of_accounts.account_type IN ('asset', 'expense') 
        THEN journal_entry_lines.debit_amount - journal_entry_lines.credit_amount
        ELSE journal_entry_lines.credit_amount - journal_entry_lines.debit_amount
      END
    ), 0) as opening_amt
    FROM journal_entry_lines
    JOIN journal_entries ON journal_entry_lines.journal_entry_id = journal_entries.id
    JOIN chart_of_accounts ON journal_entry_lines.account_id = chart_of_accounts.id
    WHERE journal_entry_lines.account_id = p_account_id
      AND journal_entries.transaction_date < period_start_date
      AND journal_entries.status = 'posted'
  ),
  period_calc AS (
    -- Calculate period debits and credits
    SELECT 
      COALESCE(SUM(journal_entry_lines.debit_amount), 0) as period_debits_amt,
      COALESCE(SUM(journal_entry_lines.credit_amount), 0) as period_credits_amt
    FROM journal_entry_lines
    JOIN journal_entries ON journal_entry_lines.journal_entry_id = journal_entries.id
    WHERE journal_entry_lines.account_id = p_account_id
      AND journal_entries.transaction_date >= period_start_date
      AND journal_entries.transaction_date <= p_date
      AND journal_entries.status = 'posted'
  ),
  closing_calc AS (
    -- Calculate closing balance (from beginning to end date)
    SELECT COALESCE(SUM(
      CASE 
        WHEN chart_of_accounts.account_type IN ('asset', 'expense') 
        THEN journal_entry_lines.debit_amount - journal_entry_lines.credit_amount
        ELSE journal_entry_lines.credit_amount - journal_entry_lines.debit_amount
      END
    ), 0) as closing_amt
    FROM journal_entry_lines
    JOIN journal_entries ON journal_entry_lines.journal_entry_id = journal_entries.id
    JOIN chart_of_accounts ON journal_entry_lines.account_id = chart_of_accounts.id
    WHERE journal_entry_lines.account_id = p_account_id
      AND journal_entries.transaction_date <= p_date
      AND journal_entries.status = 'posted'
  )
  SELECT 
    opening_calc.opening_amt,
    period_calc.period_debits_amt,
    period_calc.period_credits_amt,
    closing_calc.closing_amt
  FROM opening_calc, period_calc, closing_calc;
END;
$function$