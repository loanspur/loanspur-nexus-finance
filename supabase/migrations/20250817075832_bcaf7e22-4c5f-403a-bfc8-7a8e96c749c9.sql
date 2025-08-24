-- Enable real-time for accounting tables
ALTER TABLE public.journal_entries REPLICA IDENTITY FULL;
ALTER TABLE public.journal_entry_lines REPLICA IDENTITY FULL; 
ALTER TABLE public.chart_of_accounts REPLICA IDENTITY FULL;
ALTER TABLE public.account_balances REPLICA IDENTITY FULL;

-- Add tables to realtime publication if not already added
DO $$
BEGIN
    -- Add journal_entries if not exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'journal_entries'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.journal_entries;
    END IF;
    
    -- Add journal_entry_lines if not exists  
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'journal_entry_lines'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.journal_entry_lines;
    END IF;
    
    -- Add chart_of_accounts if not exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'chart_of_accounts'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.chart_of_accounts;
    END IF;
    
    -- Add account_balances if not exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'account_balances'  
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.account_balances;
    END IF;
END $$;