-- Enforce one-loan-per-application safely
-- 1) Remove any duplicates keeping the most relevant one
WITH ranked AS (
  SELECT id, application_id, status, created_at,
         ROW_NUMBER() OVER (
           PARTITION BY application_id
           ORDER BY 
             CASE WHEN status = 'active' THEN 0 
                  WHEN status = 'pending_disbursement' THEN 1 
                  ELSE 2 END,
             created_at DESC
         ) AS rn
  FROM public.loans
  WHERE application_id IS NOT NULL
)
DELETE FROM public.loans l
USING ranked r
WHERE l.id = r.id AND r.rn > 1;

-- 2) Create a partial unique index (allows historical rows with NULL application_id)
CREATE UNIQUE INDEX IF NOT EXISTS uniq_loans_application_id
ON public.loans (application_id)
WHERE application_id IS NOT NULL;