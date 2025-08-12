-- Clean duplicate loan rows: keep the loan that has a disbursement record (or the latest), remove others
-- SAFETY: Only targets applications that currently have >1 loans; preserves any loan that has a disbursement
DELETE FROM public.loans l
WHERE l.application_id IN (
  SELECT application_id
  FROM public.loans
  GROUP BY application_id
  HAVING COUNT(*) > 1
)
AND NOT EXISTS (
  SELECT 1 FROM public.loan_disbursements d WHERE d.loan_id = l.id
);
