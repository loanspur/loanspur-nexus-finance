-- Add method column to savings_transactions to store payment type used
ALTER TABLE public.savings_transactions
ADD COLUMN IF NOT EXISTS method text;