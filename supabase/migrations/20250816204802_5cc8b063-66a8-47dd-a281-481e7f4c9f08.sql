-- Manually allocate the known 20,000 payment to the daily schedule for LN-1755091667828
DO $$
DECLARE
    loan_uuid UUID;
    remaining_payment NUMERIC := 20000.00;
    schedule_record RECORD;
    payment_for_schedule NUMERIC;
    new_paid_amount NUMERIC;
    new_outstanding NUMERIC;
    new_status TEXT;
    updated_count INTEGER := 0;
BEGIN
    -- Get the loan ID
    SELECT id INTO loan_uuid FROM loans WHERE loan_number = 'LN-1755091667828';
    
    IF loan_uuid IS NULL THEN
        RAISE EXCEPTION 'Loan LN-1755091667828 not found';
    END IF;
    
    -- Process each schedule in order and allocate the payment
    FOR schedule_record IN 
        SELECT * FROM loan_schedules 
        WHERE loan_id = loan_uuid 
        ORDER BY installment_number 
    LOOP
        IF remaining_payment <= 0 THEN
            EXIT;
        END IF;
        
        payment_for_schedule := LEAST(remaining_payment, schedule_record.total_amount);
        new_paid_amount := payment_for_schedule;
        new_outstanding := GREATEST(0, schedule_record.total_amount - new_paid_amount);
        
        -- Determine payment status
        IF new_outstanding <= 0.01 THEN
            new_status := 'paid';
        ELSIF new_paid_amount > 0 THEN
            new_status := 'partial';
        ELSE
            new_status := 'unpaid';
        END IF;
        
        -- Update the schedule
        UPDATE loan_schedules 
        SET 
            paid_amount = new_paid_amount,
            outstanding_amount = new_outstanding,
            payment_status = new_status
        WHERE id = schedule_record.id;
        
        updated_count := updated_count + 1;
        remaining_payment := remaining_payment - payment_for_schedule;
        
        IF updated_count <= 10 THEN
            RAISE NOTICE 'Updated schedule % - Paid: %, Outstanding: %, Status: %', 
                schedule_record.installment_number, new_paid_amount, new_outstanding, new_status;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Payment allocation completed. Updated % schedules. Remaining payment: %', 
        updated_count, remaining_payment;
END $$;