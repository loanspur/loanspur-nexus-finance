import * as z from "zod";

export const loanProductSchema = z.object({
  // Basic Information
  name: z.string().min(1, "Product name is required"),
  short_name: z.string().min(1, "Short name is required"),
  description: z.string().optional(),
  currency_code: z.string().min(1, "Currency is required"),
  start_date: z.string().min(1, "Start date is required"),
  end_date: z.string().optional(),
  fund_type: z.string().min(1, "Fund type is required"),
  
  // Loan Terms
  min_principal: z.string().min(1, "Minimum principal is required"),
  max_principal: z.string().min(1, "Maximum principal is required"),
  default_principal: z.string().optional(),
  term_unit: z.string().min(1, "Term unit is required"),
  min_term: z.string().min(1, "Minimum term is required"),
  max_term: z.string().min(1, "Maximum term is required"),
  default_term: z.string().optional(),
  
  // Interest & Repayment
  min_nominal_interest_rate: z.string().min(1, "Minimum interest rate is required"),
  max_nominal_interest_rate: z.string().min(1, "Maximum interest rate is required"),
  default_nominal_interest_rate: z.string().optional(),
  
  repayment_frequency: z.string().min(1, "Repayment frequency is required"),
  grace_period: z.string().optional(),
  
  amortization_method: z.string().min(1, "Amortization method is required"),
  interest_calculation_method: z.string().min(1, "Interest calculation method is required"),
  repayment_strategy: z.string().min(1, "Repayment strategy is required"),
  
  // Moratorium & Arrears
  moratorium_period: z.string().optional(),
  moratorium_interest: z.string().optional(),
  days_in_month_type: z.string().min(1, "Days in month type is required"),
  days_in_year_type: z.string().min(1, "Days in year type is required"),
  overdue_days_for_arrears: z.string().min(1, "Days for arrears is required"),
  overdue_days_for_npa: z.string().min(1, "Days for NPA is required"),
  account_moves_out_of_npa_only_on_arrears_completion: z.boolean(),
  
  // Guarantee & Funds
  guarantee_funds_on_hold: z.boolean(),
  minimum_guarantee_from_own_funds: z.string().optional(),
  minimum_guarantee_from_guarantor_funds: z.string().optional(),
  
  // Charges & Penalties
  include_in_borrower_cycle: z.boolean(),
  lock_in_period_frequency: z.string().optional(),
  lock_in_period_frequency_type: z.string().optional(),
  overdue_charge_calculation_method: z.string().optional(),
  overdue_charge_applicable: z.boolean(),
});

export type LoanProductFormData = z.infer<typeof loanProductSchema>;

export const defaultValues: LoanProductFormData = {
  // Basic Information
  name: "",
  short_name: "",
  description: "",
  currency_code: "USD",
  start_date: "",
  end_date: "",
  fund_type: "internal",
  
  // Loan Terms
  min_principal: "",
  max_principal: "",
  default_principal: "",
  term_unit: "months",
  min_term: "",
  max_term: "",
  default_term: "",
  
  // Interest & Repayment
  min_nominal_interest_rate: "",
  max_nominal_interest_rate: "",
  default_nominal_interest_rate: "",
  
  repayment_frequency: "monthly",
  grace_period: "",
  
  amortization_method: "equal_installments",
  interest_calculation_method: "declining_balance",
  repayment_strategy: "penalties_fees_interest_principal",
  
  // Moratorium & Arrears
  moratorium_period: "",
  moratorium_interest: "none",
  days_in_month_type: "actual",
  days_in_year_type: "actual",
  overdue_days_for_arrears: "1",
  overdue_days_for_npa: "90",
  account_moves_out_of_npa_only_on_arrears_completion: true,
  
  // Guarantee & Funds
  guarantee_funds_on_hold: false,
  minimum_guarantee_from_own_funds: "",
  minimum_guarantee_from_guarantor_funds: "",
  
  // Charges & Penalties
  include_in_borrower_cycle: true,
  lock_in_period_frequency: "",
  lock_in_period_frequency_type: "days",
  overdue_charge_calculation_method: "outstanding_principal",
  overdue_charge_applicable: false,
};