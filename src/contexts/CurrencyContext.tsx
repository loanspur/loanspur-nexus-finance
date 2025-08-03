import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface CurrencyContextType {
  currency: string;
  currencySymbol: string;
  formatAmount: (amount: number) => string;
  isLoading: boolean;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

const currencySymbols: Record<string, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  KES: "KSh",
  UGX: "USh",
  TZS: "TSh",
  NGN: "₦",
  GHS: "₵",
  ZAR: "R",
  INR: "₹",
  AUD: "A$",
  CAD: "C$",
};

interface CurrencyProviderProps {
  children: React.ReactNode;
}

export const CurrencyProvider = ({ children }: CurrencyProviderProps) => {
  const { profile } = useAuth();
  const [currency, setCurrency] = useState("USD");
  const [currencySymbol, setCurrencySymbol] = useState("$");

  // Fetch tenant currency
  const { data: tenant, isLoading } = useQuery({
    queryKey: ['tenant-currency', profile?.tenant_id],
    queryFn: async () => {
      if (!profile?.tenant_id) return null;
      const { data, error } = await supabase
        .from('tenants')
        .select('currency_code')
        .eq('id', profile.tenant_id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.tenant_id,
  });

  useEffect(() => {
    if (tenant?.currency_code) {
      setCurrency(tenant.currency_code);
      setCurrencySymbol(currencySymbols[tenant.currency_code] || tenant.currency_code);
    }
  }, [tenant]);

  const formatAmount = (amount: number): string => {
    if (isNaN(amount)) return `${currencySymbol}0.00`;
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const contextValue: CurrencyContextType = {
    currency,
    currencySymbol,
    formatAmount,
    isLoading,
  };

  return (
    <CurrencyContext.Provider value={contextValue}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};