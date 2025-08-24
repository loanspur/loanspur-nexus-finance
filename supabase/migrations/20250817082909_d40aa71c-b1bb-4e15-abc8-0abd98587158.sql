-- Add office_id to journal_entries table to track transactions per branch/office
ALTER TABLE journal_entries ADD COLUMN office_id UUID REFERENCES offices(id);

-- Add index for better performance on office-based queries
CREATE INDEX idx_journal_entries_office_id ON journal_entries(office_id);

-- Update existing journal entries to inherit office from related transactions
-- For loan-related journal entries, get office from loan's client
UPDATE journal_entries 
SET office_id = (
    SELECT c.office_id 
    FROM loans l 
    JOIN clients c ON l.client_id = c.id 
    WHERE l.id = journal_entries.reference_id
)
WHERE reference_type = 'loan_disbursement' AND reference_id IS NOT NULL;

UPDATE journal_entries 
SET office_id = (
    SELECT c.office_id 
    FROM loans l 
    JOIN clients c ON l.client_id = c.id 
    WHERE l.id = journal_entries.reference_id
)
WHERE reference_type = 'loan_payment' AND reference_id IS NOT NULL;

-- For savings-related journal entries, get office from savings account's client
UPDATE journal_entries 
SET office_id = (
    SELECT c.office_id 
    FROM savings_accounts sa 
    JOIN clients c ON sa.client_id = c.id 
    WHERE sa.id = journal_entries.reference_id
)
WHERE reference_type = 'savings_transaction' AND reference_id IS NOT NULL;