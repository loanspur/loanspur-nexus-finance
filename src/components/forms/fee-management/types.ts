export interface Fee {
  id: string;
  name: string;
  type: "fixed" | "percentage";
  amount: number;
  category: "loan" | "savings" | "account" | "transaction" | "penalty";
  description?: string;
  isActive: boolean;
  applicableFor: "all" | "new_clients" | "existing_clients";
  chargeTimeType?: "upfront" | "monthly" | "annually" | "on_maturity" | "on_disbursement";
  chargePaymentBy?: "client" | "system" | "automatic" | "manual";
}