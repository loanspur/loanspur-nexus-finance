-- Manual fix for loan LN-1755091667828 schedule after payment
-- The loan has a 20,000 payment but the schedules weren't updated

DO $$
DECLARE
    loan_uuid UUID;
    remaining_payment NUMERIC := 20000.00;
    schedule_record RECORD;
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
        
        DECLARE
            payment_for_schedule NUMERIC;
            new_paid_amount NUMERIC;
            new_outstanding NUMERIC;
            new_status TEXT;
        BEGIN
            -- Calculate payment allocation for this schedule
            payment_for_schedule := LEAST(remaining_payment, schedule_record.total_amount);
            new_paid_amount := COALESCE(schedule_record.paid_amount, 0) + payment_for_schedule;
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
            
            -- Subtract from remaining payment
            remaining_payment := remaining_payment - payment_for_schedule;
            
            RAISE NOTICE 'Updated schedule % - Paid: %, Outstanding: %, Status: %', 
                schedule_record.installment_number, new_paid_amount, new_outstanding, new_status;
        END;
    END LOOP;
    
    RAISE NOTICE 'Loan schedule update completed. Remaining payment: %', remaining_payment;
END $$;