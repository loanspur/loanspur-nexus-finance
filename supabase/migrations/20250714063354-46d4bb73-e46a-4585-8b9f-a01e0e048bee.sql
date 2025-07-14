-- Add charge time type and payment by columns to fee_structures table
ALTER TABLE public.fee_structures 
ADD COLUMN charge_time_type TEXT NOT NULL DEFAULT 'upfront',
ADD COLUMN charge_payment_by TEXT NOT NULL DEFAULT 'regular';

-- Add check constraints for valid values
ALTER TABLE public.fee_structures 
ADD CONSTRAINT check_charge_time_type 
CHECK (charge_time_type IN ('upfront', 'monthly', 'quarterly', 'annually', 'on_maturity', 'on_disbursement', 'on_transaction', 'on_withdrawal', 'on_deposit', 'late_payment', 'early_settlement'));

ALTER TABLE public.fee_structures 
ADD CONSTRAINT check_charge_payment_by 
CHECK (charge_payment_by IN ('regular', 'transfer', 'client', 'system', 'automatic', 'manual'));