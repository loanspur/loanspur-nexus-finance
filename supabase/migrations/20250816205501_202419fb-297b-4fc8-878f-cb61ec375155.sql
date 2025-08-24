-- Regenerate schedule for LN-1755091667828 with correct 10-day term
DO $$
DECLARE
    loan_uuid UUID;
    loan_rec RECORD;
    product_rec RECORD;
BEGIN
    -- Get the loan and product details
    SELECT l.*, lp.default_nominal_interest_rate, lp.repayment_frequency 
    INTO loan_rec, product_rec
    FROM loans l
    JOIN loan_products lp ON l.loan_product_id = lp.id
    WHERE l.loan_number = 'LN-1755091667828';
    
    IF loan_rec.id IS NULL THEN
        RAISE EXCEPTION 'Loan LN-1755091667828 not found';
    END IF;
    
    -- Delete existing schedule
    DELETE FROM loan_schedules WHERE loan_id = loan_rec.id;
    
    RAISE NOTICE 'Deleted existing schedule for loan LN-1755091667828';
    RAISE NOTICE 'Loan term: % days, Principal: %, Interest Rate: %', 
        loan_rec.requested_term, loan_rec.principal_amount, loan_rec.nominal_interest_rate;
END $$;