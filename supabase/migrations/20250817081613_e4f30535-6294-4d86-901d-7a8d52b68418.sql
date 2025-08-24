-- Fix function search path security issues for the new accounting trigger functions
ALTER FUNCTION create_loan_disbursement_journal_entry() SET search_path = 'public';
ALTER FUNCTION create_loan_payment_journal_entry() SET search_path = 'public';
ALTER FUNCTION create_savings_transaction_journal_entry() SET search_path = 'public';