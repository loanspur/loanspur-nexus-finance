-- Add enhanced loan product settings for interest calculations and amortization
-- Following MiFos X patterns for comprehensive product configuration

-- Add new columns to loan_products table for enhanced settings
ALTER TABLE loan_products 
ADD COLUMN IF NOT EXISTS days_in_year_type TEXT DEFAULT '365' CHECK (days_in_year_type IN ('360', '365', 'actual')),
ADD COLUMN IF NOT EXISTS days_in_month_type TEXT DEFAULT 'actual' CHECK (days_in_month_type IN ('30', 'actual')),
ADD COLUMN IF NOT EXISTS amortization_method TEXT DEFAULT 'equal_installments' CHECK (amortization_method IN ('equal_installments', 'equal_principal')),
ADD COLUMN IF NOT EXISTS interest_recalculation_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS compounding_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS reschedule_strategy_method TEXT DEFAULT 'reduce_emi' CHECK (reschedule_strategy_method IN ('reduce_emi', 'reduce_term', 'reschedule_next_repayments')),
ADD COLUMN IF NOT EXISTS pre_closure_interest_calculation_rule TEXT DEFAULT 'till_pre_close_date' CHECK (pre_closure_interest_calculation_rule IN ('till_pre_close_date', 'till_rest_frequency_date')),
ADD COLUMN IF NOT EXISTS advance_payments_adjustment_type TEXT DEFAULT 'reduce_emi' CHECK (advance_payments_adjustment_type IN ('reduce_emi', 'reduce_term', 'reduce_principal'));

-- Add corresponding columns to loans table to persist these settings from creation
ALTER TABLE loans 
ADD COLUMN IF NOT EXISTS creation_days_in_year_type TEXT DEFAULT '365',
ADD COLUMN IF NOT EXISTS creation_days_in_month_type TEXT DEFAULT 'actual', 
ADD COLUMN IF NOT EXISTS creation_amortization_method TEXT DEFAULT 'equal_installments',
ADD COLUMN IF NOT EXISTS creation_interest_recalculation_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS creation_compounding_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS creation_reschedule_strategy_method TEXT DEFAULT 'reduce_emi',
ADD COLUMN IF NOT EXISTS creation_pre_closure_interest_calculation_rule TEXT DEFAULT 'till_pre_close_date',
ADD COLUMN IF NOT EXISTS creation_advance_payments_adjustment_type TEXT DEFAULT 'reduce_emi';

-- Update existing records with default values
UPDATE loan_products 
SET days_in_year_type = '365',
    days_in_month_type = 'actual',
    amortization_method = 'equal_installments'
WHERE days_in_year_type IS NULL;

UPDATE loans 
SET creation_days_in_year_type = '365',
    creation_days_in_month_type = 'actual', 
    creation_amortization_method = 'equal_installments'
WHERE creation_days_in_year_type IS NULL;