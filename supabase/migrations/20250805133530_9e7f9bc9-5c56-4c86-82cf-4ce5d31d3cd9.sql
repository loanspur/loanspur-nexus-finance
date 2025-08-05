-- Remove the percentage_rate column from fee_structures table since we're now using a single amount field
-- The amount field will now hold either fixed amounts or percentage values based on calculation_type

ALTER TABLE fee_structures DROP COLUMN IF EXISTS percentage_rate;