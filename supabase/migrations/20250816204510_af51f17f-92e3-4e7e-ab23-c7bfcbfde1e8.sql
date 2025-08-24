-- Fix loan schedule for LN-1755091667828 with correct daily frequency
-- This will regenerate the schedule with proper daily payments

DO $$
DECLARE
    loan_record RECORD;
    schedule_params RECORD;
    total_payments INTEGER;
    payments_per_year INTEGER := 365; -- Daily payments
    periodic_rate NUMERIC;
    remaining_balance NUMERIC;
    current_payment_date DATE;
    i INTEGER;
    principal_amount NUMERIC;
    interest_amount NUMERIC;
    total_amount NUMERIC;
    schedule_entry_id UUID;
BEGIN
    -- Get loan details with product information
    SELECT 
        l.id,
        l.principal_amount,
        l.interest_rate / 100.0 as interest_rate, -- Convert percentage to decimal
        l.term_months,
        l.disbursement_date,
        lp.repayment_frequency,
        lp.interest_calculation_method
    INTO loan_record
    FROM loans l
    JOIN loan_products lp ON l.loan_product_id = lp.id
    WHERE l.loan_number = 'LN-1755091667828';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Loan LN-1755091667828 not found';
    END IF;
    
    -- Delete existing schedule
    DELETE FROM loan_schedules WHERE loan_id = loan_record.id;
    
    -- Calculate schedule parameters
    total_payments := CEIL((loan_record.term_months / 12.0) * payments_per_year);
    periodic_rate := loan_record.interest_rate / payments_per_year;
    remaining_balance := loan_record.principal_amount;
    current_payment_date := loan_record.disbursement_date + INTERVAL '1 day';
    
    RAISE NOTICE 'Generating % daily payments for loan %, interest rate: %, period rate: %', 
        total_payments, loan_record.id, loan_record.interest_rate, periodic_rate;
    
    -- Generate new schedule with daily payments
    FOR i IN 1..total_payments LOOP
        -- Calculate principal and interest based on flat rate method
        IF loan_record.interest_calculation_method = 'flat' THEN
            principal_amount := loan_record.principal_amount / total_payments;
            interest_amount := (loan_record.principal_amount * loan_record.interest_rate * loan_record.term_months) / (12.0 * total_payments);
        ELSE
            -- Default to equal principal with reducing interest
            principal_amount := loan_record.principal_amount / total_payments;
            interest_amount := remaining_balance * periodic_rate;
        END IF;
        
        -- Round amounts
        principal_amount := ROUND(principal_amount, 2);
        interest_amount := ROUND(interest_amount, 2);
        total_amount := principal_amount + interest_amount;
        
        -- Insert schedule entry
        INSERT INTO loan_schedules (
            loan_id,
            installment_number,
            due_date,
            principal_amount,
            interest_amount,
            fee_amount,
            total_amount,
            paid_amount,
            outstanding_amount,
            payment_status
        ) VALUES (
            loan_record.id,
            i,
            current_payment_date,
            principal_amount,
            interest_amount,
            0,
            total_amount,
            0,
            total_amount,
            'unpaid'
        );
        
        remaining_balance := remaining_balance - principal_amount;
        current_payment_date := current_payment_date + INTERVAL '1 day';
    END LOOP;
    
    RAISE NOTICE 'Generated % schedule entries for daily payments', total_payments;
END $$;