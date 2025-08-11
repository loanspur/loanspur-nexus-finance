-- Fix ambiguous balance_date usage in account balance sync by ensuring EXCLUDED.balance_date is used on conflict
-- and tighten variable usage inside the trigger function
CREATE OR REPLACE FUNCTION public.update_account_balance_from_journal_entry()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_account_id uuid;
  v_balance_date DATE;
BEGIN
  -- Get the transaction date from the journal entry
  IF TG_OP = 'DELETE' THEN
    SELECT transaction_date INTO v_balance_date FROM journal_entries WHERE id = OLD.journal_entry_id;
  ELSE
    SELECT transaction_date INTO v_balance_date FROM journal_entries WHERE id = NEW.journal_entry_id;
  END IF;

  -- Update balances for affected accounts
  FOR v_account_id IN 
    SELECT DISTINCT account_id FROM (
      SELECT OLD.account_id AS account_id WHERE TG_OP IN ('UPDATE', 'DELETE')
      UNION
      SELECT NEW.account_id AS account_id WHERE TG_OP IN ('UPDATE', 'INSERT')
    ) t
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
      v_account_id,
      v_balance_date,
      calculate_account_balance(v_account_id, v_balance_date)
    FROM chart_of_accounts c
    WHERE c.id = v_account_id
    ON CONFLICT (tenant_id, account_id, balance_date)
    DO UPDATE SET
      closing_balance = calculate_account_balance(EXCLUDED.account_id, EXCLUDED.balance_date),
      updated_at = now();
  END LOOP;

  RETURN COALESCE(NEW, OLD);
END;
$function$;
