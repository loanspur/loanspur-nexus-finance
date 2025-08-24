-- Add custom_date to allowed charge_time_type values for fee_structures
ALTER TABLE public.fee_structures DROP CONSTRAINT IF EXISTS check_charge_time_type;

ALTER TABLE public.fee_structures
ADD CONSTRAINT check_charge_time_type
CHECK (
  charge_time_type = ANY (
    ARRAY[
      'upfront'::text,
      'monthly'::text,
      'quarterly'::text,
      'annually'::text,
      'on_maturity'::text,
      'on_disbursement'::text,
      'on_transaction'::text,
      'on_withdrawal'::text,
      'on_deposit'::text,
      'late_payment'::text,
      'early_settlement'::text,
      'custom_date'::text
    ]
  )
);

-- No change to charge_payment_by constraint (already allows regular and transfer)