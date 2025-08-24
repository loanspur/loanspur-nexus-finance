-- Harden security: set fixed search_path on functions flagged by linter

-- 1) SQL functions without search_path
CREATE OR REPLACE FUNCTION public.get_current_user_profile_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT id FROM public.profiles WHERE user_id = auth.uid();
$function$;

CREATE OR REPLACE FUNCTION public.get_user_chat_room_ids()
RETURNS TABLE(chat_room_id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT cp.chat_room_id 
  FROM public.chat_participants cp
  JOIN public.profiles p ON cp.user_id = p.id
  WHERE p.user_id = auth.uid();
$function$;

CREATE OR REPLACE FUNCTION public.get_user_tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT tenant_id FROM public.profiles WHERE user_id = auth.uid();
$function$;

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT role FROM public.profiles WHERE user_id = auth.uid();
$function$;

CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT role FROM public.profiles WHERE user_id = auth.uid();
$function$;

-- 2) PL/pgSQL functions without search_path
CREATE OR REPLACE FUNCTION public.calculate_account_balance(p_account_id uuid, p_date date DEFAULT CURRENT_DATE)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.update_account_balance_from_journal_entry()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
$function$;

CREATE OR REPLACE FUNCTION public.get_current_account_balance(p_account_id uuid)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN calculate_account_balance(p_account_id, CURRENT_DATE);
END;
$function$;

CREATE OR REPLACE FUNCTION public.sync_chart_account_balance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Update the balance field in chart_of_accounts when account_balances changes
  UPDATE chart_of_accounts 
  SET balance = NEW.closing_balance,
      updated_at = now()
  WHERE id = NEW.account_id;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.log_audit_trail()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  current_user_id UUID;
  current_tenant_id UUID;
  mapped_action audit_action;
BEGIN
  -- Get current user and tenant from profiles
  SELECT p.id, p.tenant_id INTO current_user_id, current_tenant_id
  FROM profiles p WHERE p.user_id = auth.uid();

  -- Skip if no user context (system operations)
  IF current_tenant_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Map TG_OP to audit_action enum values
  CASE TG_OP
    WHEN 'INSERT' THEN mapped_action := 'CREATE';
    WHEN 'UPDATE' THEN mapped_action := 'UPDATE';
    WHEN 'DELETE' THEN mapped_action := 'DELETE';
    ELSE mapped_action := 'UPDATE'; -- Default fallback
  END CASE;

  -- Log the change
  INSERT INTO audit_trails (
    tenant_id,
    user_id,
    table_name,
    record_id,
    action,
    old_values,
    new_values
  ) VALUES (
    current_tenant_id,
    current_user_id,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    mapped_action,
    CASE WHEN TG_OP != 'INSERT' THEN row_to_json(OLD) ELSE NULL END,
    CASE WHEN TG_OP != 'DELETE' THEN row_to_json(NEW) ELSE NULL END
  );

  RETURN COALESCE(NEW, OLD);
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;

-- 3) Already-secured functions are left untouched
