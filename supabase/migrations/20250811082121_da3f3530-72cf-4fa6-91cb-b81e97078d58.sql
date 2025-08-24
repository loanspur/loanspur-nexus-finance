-- Add currency decimal places setting to tenants
ALTER TABLE public.tenants
ADD COLUMN IF NOT EXISTS currency_decimal_places integer NOT NULL DEFAULT 2;

-- Ensure value stays within a sane range using a trigger (0-6)
CREATE OR REPLACE FUNCTION public.validate_currency_decimal_places()
RETURNS trigger AS $$
BEGIN
  IF NEW.currency_decimal_places IS NULL THEN
    NEW.currency_decimal_places := 2;
  END IF;
  IF NEW.currency_decimal_places < 0 OR NEW.currency_decimal_places > 6 THEN
    RAISE EXCEPTION 'currency_decimal_places must be between 0 and 6';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_validate_currency_decimal_places ON public.tenants;
CREATE TRIGGER trg_validate_currency_decimal_places
BEFORE INSERT OR UPDATE ON public.tenants
FOR EACH ROW
EXECUTE FUNCTION public.validate_currency_decimal_places();
