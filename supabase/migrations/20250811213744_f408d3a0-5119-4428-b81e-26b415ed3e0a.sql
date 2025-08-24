-- Add missing loan application fields for enhanced workflow
-- Safely add columns if they don't exist
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'loan_applications' AND column_name = 'linked_savings_account_id'
  ) THEN
    ALTER TABLE public.loan_applications
      ADD COLUMN linked_savings_account_id uuid NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'loan_applications' AND column_name = 'selected_charges'
  ) THEN
    ALTER TABLE public.loan_applications
      ADD COLUMN selected_charges jsonb NOT NULL DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- Add FK to savings_accounts when column exists and constraint not present
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'loan_applications' AND column_name = 'linked_savings_account_id'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint 
      WHERE conname = 'loan_applications_linked_savings_account_id_fkey'
    ) THEN
      ALTER TABLE public.loan_applications
        ADD CONSTRAINT loan_applications_linked_savings_account_id_fkey
        FOREIGN KEY (linked_savings_account_id)
        REFERENCES public.savings_accounts(id)
        ON UPDATE CASCADE ON DELETE SET NULL;
    END IF;
  END IF;
END $$;

-- Ensure RLS policies still apply; no changes needed since these are additional columns only.
