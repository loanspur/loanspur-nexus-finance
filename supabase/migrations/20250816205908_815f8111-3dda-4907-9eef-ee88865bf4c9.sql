-- Regenerate schedule for LN-1755091667828 with correct 10-day term
DO $$
DECLARE
    loan_uuid UUID;
    loan_principal NUMERIC;
    loan_term INTEGER;
    loan_interest_rate NUMERIC;
    repay_frequency TEXT;
BEGIN
    -- Get the loan and product details
    SELECT l.id, l.principal_amount, l.requested_term, l.nominal_interest_rate, lp.repayment_frequency
    INTO loan_uuid, loan_principal, loan_term, loan_interest_rate, repay_frequency
    FROM loans l
    JOIN loan_products lp ON l.loan_product_id = lp.id
    WHERE l.loan_number = 'LN-1755091667828';
    
    IF loan_uuid IS NULL THEN
        RAISE EXCEPTION 'Loan LN-1755091667828 not found';
    END IF;
    
    -- Delete existing schedule
    DELETE FROM loan_schedules WHERE loan_id = loan_uuid;
    
    RAISE NOTICE 'Deleted existing schedule for loan LN-1755091667828';
    RAISE NOTICE 'Loan details - Term: % days, Principal: %, Interest Rate: %, Frequency: %', 
        loan_term, loan_principal, loan_interest_rate, repay_frequency;
END $$;