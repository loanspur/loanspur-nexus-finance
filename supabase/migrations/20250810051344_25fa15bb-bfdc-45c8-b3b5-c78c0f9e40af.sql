-- Patch: set secure search_path for newly added functions
CREATE OR REPLACE FUNCTION public.validate_savings_account_dates()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_client_created_at timestamp with time zone;
BEGIN
  -- Ensure status is one of allowed values
  IF NEW.status IS NULL OR NEW.status NOT IN ('created','approved','activated','closed') THEN
    RAISE EXCEPTION 'Invalid savings account status: %', NEW.status;
  END IF;

  -- Fetch client created_at if possible and enforce account dates >= client created_at
  IF NEW.client_id IS NOT NULL AND to_regclass('public.clients') IS NOT NULL THEN
    EXECUTE 'SELECT created_at FROM public.clients WHERE id = $1' INTO v_client_created_at USING NEW.client_id;
    IF v_client_created_at IS NOT NULL THEN
      IF NEW.created_date IS NOT NULL AND (NEW.created_date::timestamp < v_client_created_at) THEN
        RAISE EXCEPTION 'Savings account created_date (%) cannot be before client created_at (%)', NEW.created_date, v_client_created_at;
      END IF;
      IF NEW.approved_date IS NOT NULL AND (NEW.approved_date::timestamp < v_client_created_at) THEN
        RAISE EXCEPTION 'Savings account approved_date (%) cannot be before client created_at (%)', NEW.approved_date, v_client_created_at;
      END IF;
      IF NEW.activated_date IS NOT NULL AND (NEW.activated_date::timestamp < v_client_created_at) THEN
        RAISE EXCEPTION 'Savings account activated_date (%) cannot be before client created_at (%)', NEW.activated_date, v_client_created_at;
      END IF;
    END IF;
  END IF;

  -- Enforce sequential dates: created <= approved <= activated
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    IF NEW.approved_date IS NOT NULL AND NEW.created_date IS NOT NULL AND NEW.approved_date < NEW.created_date THEN
      RAISE EXCEPTION 'approved_date (%) must be on or after created_date (%)', NEW.approved_date, NEW.created_date;
    END IF;
    IF NEW.activated_date IS NOT NULL THEN
      IF NEW.created_date IS NOT NULL AND NEW.activated_date < NEW.created_date THEN
        RAISE EXCEPTION 'activated_date (%) must be on or after created_date (%)', NEW.activated_date, NEW.created_date;
      END IF;
      IF NEW.approved_date IS NOT NULL AND NEW.activated_date < NEW.approved_date THEN
        RAISE EXCEPTION 'activated_date (%) must be on or after approved_date (%)', NEW.activated_date, NEW.approved_date;
      END IF;
    END IF;
  END IF;

  -- Status/date coupling checks
  IF NEW.status = 'approved' AND NEW.approved_date IS NULL THEN
    RAISE EXCEPTION 'approved status requires approved_date';
  END IF;
  IF NEW.status = 'activated' AND NEW.activated_date IS NULL THEN
    RAISE EXCEPTION 'activated status requires activated_date';
  END IF;

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.validate_loan_client_date()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_client_created_at timestamp with time zone;
  v_open_date date;
BEGIN
  -- Try common open date fields
  v_open_date := COALESCE(NEW.disbursed_on_date, NEW.submitted_on_date, NEW.approved_on_date, NEW.created_date);

  IF NEW.client_id IS NOT NULL AND to_regclass('public.clients') IS NOT NULL THEN
    EXECUTE 'SELECT created_at FROM public.clients WHERE id = $1' INTO v_client_created_at USING NEW.client_id;
    IF v_client_created_at IS NOT NULL AND v_open_date IS NOT NULL THEN
      IF v_open_date::timestamp < v_client_created_at THEN
        RAISE EXCEPTION 'Loan date (%) cannot be before client created_at (%)', v_open_date, v_client_created_at;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.validate_transaction_date_after_activation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_activated_date date;
  v_account_id uuid;
  v_txn_date date;
BEGIN
  -- Attempt to resolve account reference and date across common schemas
  -- Infer account id
  v_account_id := COALESCE(NEW.savings_account_id, NEW.account_id, NEW.savings_id);
  v_txn_date := COALESCE(NEW.transaction_date, NEW.posted_on, NEW.performed_on, NEW.created_date);

  IF v_account_id IS NOT NULL AND v_txn_date IS NOT NULL AND to_regclass('public.savings_accounts') IS NOT NULL THEN
    EXECUTE 'SELECT activated_date FROM public.savings_accounts WHERE id = $1' INTO v_activated_date USING v_account_id;
    IF v_activated_date IS NOT NULL AND v_txn_date < v_activated_date THEN
      RAISE EXCEPTION 'Transaction date (%) must be on or after savings account activated_date (%)', v_txn_date, v_activated_date;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;