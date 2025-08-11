import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface CurrencyContextType {
  currency: string;
  currencySymbol: string;
  decimalPlaces: number;
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
  const [decimalPlaces, setDecimalPlaces] = useState(2);

  // Fetch tenant currency
  const { data: tenant, isLoading } = useQuery({
    queryKey: ['tenant-currency', profile?.tenant_id],
    queryFn: async () => {
      if (!profile?.tenant_id) return null;
      const { data, error } = await supabase
        .from('tenants')
.select('currency_code, currency_decimal_places')
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
  if (typeof tenant?.currency_decimal_places === 'number') {
    setDecimalPlaces(tenant.currency_decimal_places ?? 2);
  }
}, [tenant]);

// Realtime updates for tenant currency/decimals
useEffect(() => {
  if (!profile?.tenant_id) return;
  const channel = supabase
    .channel('schema-db-changes')
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'tenants',
      filter: `id=eq.${profile.tenant_id}`,
    }, (payload) => {
      const newRec: any = payload.new;
      if (newRec?.currency_code) {
        setCurrency(newRec.currency_code);
        setCurrencySymbol(currencySymbols[newRec.currency_code] || newRec.currency_code);
      }
      if (typeof newRec?.currency_decimal_places === 'number') {
        setDecimalPlaces(newRec.currency_decimal_places ?? 2);
      }
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [profile?.tenant_id]);

const formatAmount = (amount: number): string => {
  const dps = typeof decimalPlaces === 'number' ? decimalPlaces : 2;
  if (isNaN(amount)) {
    const zero = (0).toLocaleString('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: dps,
      maximumFractionDigits: dps,
    });
    return zero;
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: dps,
    maximumFractionDigits: dps,
  }).format(amount);
};

  const contextValue: CurrencyContextType = {
    currency,
    currencySymbol,
    decimalPlaces,
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