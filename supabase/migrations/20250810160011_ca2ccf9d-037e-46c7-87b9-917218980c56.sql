-- Enable realtime and ensure full row data for relevant tables
DO $$ BEGIN
  ALTER TABLE public.savings_transactions REPLICA IDENTITY FULL;
EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE public.savings_accounts REPLICA IDENTITY FULL;
EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE public.account_balances REPLICA IDENTITY FULL;
EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE public.chart_of_accounts REPLICA IDENTITY FULL;
EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE public.transactions REPLICA IDENTITY FULL;
EXCEPTION WHEN others THEN NULL; END $$;

-- Add tables to the supabase_realtime publication (idempotent)
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.savings_transactions;
EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.savings_accounts;
EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.account_balances;
EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.chart_of_accounts;
EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;
EXCEPTION WHEN others THEN NULL; END $$;

-- Keep chart_of_accounts.balance in sync when account_balances change
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_sync_chart_account_balance'
  ) THEN
    CREATE TRIGGER trg_sync_chart_account_balance
    AFTER INSERT OR UPDATE ON public.account_balances
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_chart_account_balance();
  END IF;
END $$;