-- Fix the issue: Update all existing draft journal entries to posted status
-- and modify triggers to ensure they create posted entries

-- First, update all existing draft entries to posted status
UPDATE journal_entries 
SET status = 'posted', updated_at = now()
WHERE status = 'draft';

-- Also update the triggers to ensure they create posted status entries
-- The issue might be that other code is overriding the status after trigger execution

-- Create a function to automatically post journal entries
CREATE OR REPLACE FUNCTION auto_post_journal_entries()
RETURNS TRIGGER AS $$
BEGIN
  -- Automatically set status to posted for accounting-generated entries
  IF NEW.reference_type IN ('loan_disbursement', 'loan_payment', 'savings_transaction', 'fee_collection', 'savings_interest_posting') THEN
    NEW.status = 'posted';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- Create trigger to auto-post accounting entries
DROP TRIGGER IF EXISTS trigger_auto_post_accounting_entries ON journal_entries;
CREATE TRIGGER trigger_auto_post_accounting_entries
  BEFORE INSERT ON journal_entries
  FOR EACH ROW
  EXECUTE FUNCTION auto_post_journal_entries();