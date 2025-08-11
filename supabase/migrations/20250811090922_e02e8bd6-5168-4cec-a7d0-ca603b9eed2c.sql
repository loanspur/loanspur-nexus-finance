-- Add closure fields to savings_accounts for UI-driven account closure
ALTER TABLE public.savings_accounts
  ADD COLUMN IF NOT EXISTS closed_date date,
  ADD COLUMN IF NOT EXISTS close_reason text;