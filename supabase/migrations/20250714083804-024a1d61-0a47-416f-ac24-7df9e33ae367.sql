-- Add is_overdue_charge field to fee_structures table
ALTER TABLE public.fee_structures 
ADD COLUMN is_overdue_charge BOOLEAN NOT NULL DEFAULT false;

-- Set existing late payment charges as overdue charges
UPDATE public.fee_structures 
SET is_overdue_charge = true 
WHERE charge_time_type IN ('late_payment', 'overdue_payment');