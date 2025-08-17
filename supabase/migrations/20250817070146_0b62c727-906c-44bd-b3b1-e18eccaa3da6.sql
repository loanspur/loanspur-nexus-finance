-- Add loan_payment_reversal and savings_reversal to journal_entries reference_type constraint
ALTER TABLE journal_entries DROP CONSTRAINT IF EXISTS journal_entries_reference_type_check;
ALTER TABLE journal_entries ADD CONSTRAINT journal_entries_reference_type_check 
  CHECK (reference_type IN ('loan_disbursement', 'loan_payment', 'loan_payment_reversal', 'savings_deposit', 'savings_withdrawal', 'savings_reversal', 'fee_collection', 'manual'));