export interface Fee {
  id: string;
  name: string;
  type: "fixed" | "percentage";
  amount: number;
  category: "loan" | "savings" | "account" | "transaction" | "penalty";
  description?: string;
  isActive: boolean;
  applicableFor: "all" | "new_clients" | "existing_clients";
  chargeTimeType: "upfront" | "monthly" | "quarterly" | "annually" | "on_maturity" | "on_disbursement" | "on_transaction" | "on_withdrawal" | "on_deposit" | "late_payment" | "early_settlement";
  chargePaymentBy: "regular" | "transfer";
  isOverdueCharge?: boolean;
}