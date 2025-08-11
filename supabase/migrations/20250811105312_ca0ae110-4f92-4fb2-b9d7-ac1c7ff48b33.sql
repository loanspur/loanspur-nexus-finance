-- 1) Add repayment_strategy to loan_products with default
ALTER TABLE public.loan_products
ADD COLUMN IF NOT EXISTS repayment_strategy text NOT NULL DEFAULT 'penalties_fees_interest_principal';

-- 2) Update validate_savings_account_dates to allow same-day relative to client created_at and enforce sequence/status rules
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

  -- Fetch client created_at if possible and enforce account dates >= client created_at (by date only)
  IF NEW.client_id IS NOT NULL AND to_regclass('public.clients') IS NOT NULL THEN
    EXECUTE 'SELECT created_at FROM public.clients WHERE id = $1' INTO v_client_created_at USING NEW.client_id;
    IF v_client_created_at IS NOT NULL THEN
      IF NEW.created_date IS NOT NULL AND (NEW.created_date::date < v_client_created_at::date) THEN
        RAISE EXCEPTION 'Savings account created_date (%) cannot be before client created_at (%)', NEW.created_date, v_client_created_at;
      END IF;
      IF NEW.approved_date IS NOT NULL AND (NEW.approved_date::date < v_client_created_at::date) THEN
        RAISE EXCEPTION 'Savings account approved_date (%) cannot be before client created_at (%)', NEW.approved_date, v_client_created_at;
      END IF;
      IF NEW.activated_date IS NOT NULL AND (NEW.activated_date::date < v_client_created_at::date) THEN
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

-- 3) Ensure trigger exists on savings_accounts to call the validator
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_validate_savings_account_dates'
  ) THEN
    CREATE TRIGGER trg_validate_savings_account_dates
    BEFORE INSERT OR UPDATE ON public.savings_accounts
    FOR EACH ROW EXECUTE FUNCTION public.validate_savings_account_dates();
  END IF;
END $$;