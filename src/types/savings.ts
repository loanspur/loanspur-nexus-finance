// Comprehensive Savings System Types
// Phase 4: Advanced Features

export interface SavingsProduct {
  id: string;
  tenant_id: string;
  mifos_product_id?: number;
  
  // Product Details
  name: string;
  short_name: string;
  description: string;
  product_type: 'savings' | 'fixed_deposit' | 'recurring_deposit' | 'goal_savings';
  
  // Account Parameters
  min_balance: number;
  max_balance?: number;
  interest_rate: number;
  interest_calculation_period: 'daily' | 'monthly' | 'quarterly' | 'yearly';
  interest_posting_period: 'monthly' | 'quarterly' | 'yearly';
  
  // Fees & Charges
  annual_fee?: number;
  withdrawal_fee?: number;
  transfer_fee?: number;
  dormant_fee?: number;
  minimum_balance_fee?: number;
  
  // Features
  allow_overdraft: boolean;
  overdraft_limit?: number;
  overdraft_interest_rate?: number;
  allow_withdrawals: boolean;
  allow_deposits: boolean;
  allow_transfers: boolean;
  
  // Fixed Deposit Specific
  min_deposit_amount?: number;
  max_deposit_amount?: number;
  min_deposit_term?: number;
  max_deposit_term?: number;
  early_withdrawal_penalty?: number;
  
  // Goal Savings Specific
  goal_target_amount?: number;
  goal_deadline?: string;
  goal_reminder_frequency?: 'daily' | 'weekly' | 'monthly';
  
  status: 'active' | 'inactive' | 'draft';
  created_at: string;
  updated_at: string;
}

export interface SavingsAccount {
  id: string;
  tenant_id: string;
  client_id: string;
  product_id: string;
  mifos_account_id?: number;
  
  // Account Details
  account_number: string;
  account_name: string;
  account_type: 'savings' | 'fixed_deposit' | 'recurring_deposit' | 'goal_savings';
  
  // Balance Information
  current_balance: number;
  available_balance: number;
  hold_balance: number;
  interest_earned: number;
  total_deposits: number;
  total_withdrawals: number;
  
  // Interest Calculation
  interest_rate: number;
  last_interest_calculation: string;
  next_interest_calculation: string;
  interest_accrued: number;
  
  // Account Status
  status: 'active' | 'inactive' | 'dormant' | 'closed' | 'matured';
  opened_date: string;
  maturity_date?: string;
  closed_date?: string;
  
  // Goal Savings Specific
  goal_target_amount?: number;
  goal_deadline?: string;
  goal_progress_percentage?: number;
  
  // Fixed Deposit Specific
  deposit_amount?: number;
  deposit_term?: number;
  interest_payout_frequency?: 'monthly' | 'quarterly' | 'at_maturity';
  
  created_at: string;
  updated_at: string;
}

export interface SavingsTransaction {
  id: string;
  tenant_id: string;
  account_id: string;
  mifos_transaction_id?: number;
  
  // Transaction Details
  transaction_type: 'deposit' | 'withdrawal' | 'transfer' | 'interest' | 'fee' | 'adjustment';
  amount: number;
  running_balance: number;
  description: string;
  reference_number: string;
  
  // Transaction Status
  status: 'pending' | 'completed' | 'failed' | 'reversed';
  transaction_date: string;
  posted_date: string;
  
  // Additional Details
  payment_method?: 'cash' | 'bank_transfer' | 'mobile_money' | 'check' | 'card';
  payment_reference?: string;
  reversal_reason?: string;
  
  // Audit
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface SavingsGoal {
  id: string;
  tenant_id: string;
  client_id: string;
  account_id: string;
  
  // Goal Details
  goal_name: string;
  target_amount: number;
  current_amount: number;
  deadline: string;
  description?: string;
  
  // Progress Tracking
  progress_percentage: number;
  days_remaining: number;
  monthly_target: number;
  
  // Notifications
  reminder_frequency: 'daily' | 'weekly' | 'monthly';
  last_reminder_sent?: string;
  next_reminder_date?: string;
  
  status: 'active' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}