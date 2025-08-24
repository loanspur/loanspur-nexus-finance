-- Harden validate_loan_client_date to avoid referencing non-existent NEW.* fields
-- by using JSONB extraction and safe casting. This fixes errors like:
-- "record 'new' has no field 'disbursed_on_date'" when the trigger runs on tables
-- that don't have those columns.

CREATE OR REPLACE FUNCTION public.validate_loan_client_date()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_client_created_at timestamp with time zone;
  v_open_date date;
  v_payload jsonb;
  v_date_text text;
BEGIN
  -- Convert NEW record to JSONB so we can safely access optional fields
  v_payload := to_jsonb(NEW);

  -- Try to resolve an open date from common fields if present
  v_date_text := COALESCE(
    v_payload->>'disbursed_on_date',
    v_payload->>'submitted_on_date',
    v_payload->>'approved_on_date',
    v_payload->>'created_date'
  );

  -- Safely cast to date when possible (handles timestamps too by taking YYYY-MM-DD)
  IF v_date_text IS NOT NULL THEN
    BEGIN
      v_open_date := left(v_date_text, 10)::date;
    EXCEPTION WHEN others THEN
      v_open_date := NULL; -- If parsing fails, skip validation
    END;
  END IF;

  -- Fetch client created_at if possible and enforce that loan dates are not before client creation
  IF (v_payload ? 'client_id') AND to_regclass('public.clients') IS NOT NULL THEN
    EXECUTE 'SELECT created_at FROM public.clients WHERE id = $1' INTO v_client_created_at USING (v_payload->>'client_id')::uuid;
    IF v_client_created_at IS NOT NULL AND v_open_date IS NOT NULL THEN
      IF v_open_date::timestamp < v_client_created_at THEN
        RAISE EXCEPTION 'Loan date (%) cannot be before client created_at (%)', v_open_date, v_client_created_at;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;