-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE public.user_role AS ENUM ('super_admin', 'tenant_admin', 'loan_officer', 'client');
CREATE TYPE public.tenant_status AS ENUM ('active', 'suspended', 'cancelled');
CREATE TYPE public.pricing_tier AS ENUM ('starter', 'professional', 'enterprise', 'scale');
CREATE TYPE public.payment_status AS ENUM ('pending', 'completed', 'failed', 'cancelled');
CREATE TYPE public.loan_status AS ENUM ('pending', 'approved', 'active', 'closed', 'overdue', 'written_off');
CREATE TYPE public.payment_type AS ENUM ('cash', 'bank_transfer', 'mpesa', 'mobile_money', 'cheque');
CREATE TYPE public.transaction_type AS ENUM ('loan_repayment', 'savings_deposit', 'loan_disbursement', 'savings_withdrawal', 'fee_payment');