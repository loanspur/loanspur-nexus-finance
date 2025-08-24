-- Remove duplicate loan schedule entries and add unique constraint

-- First, let's identify and remove duplicates, keeping only the first entry for each installment
DELETE FROM loan_schedules 
WHERE id IN (
  SELECT id 
  FROM (
    SELECT id,
           ROW_NUMBER() OVER (
             PARTITION BY loan_id, installment_number 
             ORDER BY created_at, id
           ) as row_num
    FROM loan_schedules
  ) t
  WHERE row_num > 1
);

-- Add unique constraint to prevent future duplicates
ALTER TABLE loan_schedules 
ADD CONSTRAINT unique_loan_installment 
UNIQUE (loan_id, installment_number);