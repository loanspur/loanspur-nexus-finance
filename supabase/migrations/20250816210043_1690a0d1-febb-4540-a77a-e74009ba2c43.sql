-- Fix loan schedule for LN-1755091667828 to respect 10-day term
DO $$
DECLARE
    loan_uuid UUID;
    loan_principal NUMERIC;
    loan_term INTEGER;
    loan_interest_rate NUMERIC;
    repay_frequency TEXT;
    schedule_count INTEGER;
BEGIN
    -- Get the loan details using correct column name
    SELECT l.id, l.principal_amount, l.term_months, l.interest_rate, lp.repayment_frequency
    INTO loan_uuid, loan_principal, loan_term, loan_interest_rate, repay_frequency
    FROM loans l
    JOIN loan_products lp ON l.loan_product_id = lp.id
    WHERE l.loan_number = 'LN-1755091667828';
    
    IF loan_uuid IS NULL THEN
        RAISE EXCEPTION 'Loan LN-1755091667828 not found';
    END IF;
    
    -- Check current schedule count
    SELECT COUNT(*) INTO schedule_count 
    FROM loan_schedules 
    WHERE loan_id = loan_uuid;
    
    -- Delete existing schedule
    DELETE FROM loan_schedules WHERE loan_id = loan_uuid;
    
    RAISE NOTICE 'Deleted % existing schedule entries for loan LN-1755091667828', schedule_count;
    RAISE NOTICE 'Loan details - Term: % days, Principal: %, Interest Rate: %, Frequency: %', 
        loan_term, loan_principal, loan_interest_rate, repay_frequency;
    RAISE NOTICE 'Schedule will now be regenerated with exactly % daily installments', loan_term;
END $$;