import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";

export interface Currency {
  id: string;
  code: string;
  name: string;
  symbol: string;
  decimal_places: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TenantCurrencySettings {
  id: string;
  tenant_id: string;
  default_currency_id: string;
  display_format: 'symbol_before' | 'symbol_after' | 'code_before' | 'code_after';
  thousand_separator: string;
  decimal_separator: string;
  show_decimals: boolean;
  created_at: string;
  updated_at: string;
  default_currency?: Currency;
}

export const useCurrencies = () => {
  return useQuery({
    queryKey: ['currencies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('currencies')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data as Currency[];
    },
  });
};

export const useTenantCurrencySettings = () => {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['tenant-currency-settings', profile?.tenant_id],
    queryFn: async () => {
      if (!profile?.tenant_id) return null;

      const { data, error } = await supabase
        .from('tenant_currency_settings')
        .select(`
          *,
          default_currency:currencies(*)
        `)
        .eq('tenant_id', profile.tenant_id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data as TenantCurrencySettings | null;
    },
    enabled: !!profile?.tenant_id,
  });
};

export const useCreateTenantCurrencySettings = () => {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (settings: {
      default_currency_id: string;
      display_format?: 'symbol_before' | 'symbol_after' | 'code_before' | 'code_after';
      thousand_separator?: string;
      decimal_separator?: string;
      show_decimals?: boolean;
    }) => {
      if (!profile?.tenant_id) throw new Error('No tenant ID available');

      const { data, error } = await supabase
        .from('tenant_currency_settings')
        .insert({
          tenant_id: profile.tenant_id,
          ...settings,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-currency-settings'] });
      toast({
        title: "Success",
        description: "Currency settings created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create currency settings",
        variant: "destructive",
      });
    },
  });
};

export const useUpdateTenantCurrencySettings = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...settings }: Partial<TenantCurrencySettings> & { id: string }) => {
      const { data, error } = await supabase
        .from('tenant_currency_settings')
        .update(settings)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-currency-settings'] });
      toast({
        title: "Success",
        description: "Currency settings updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update currency settings",
        variant: "destructive",
      });
    },
  });
};

// Utility function to format currency based on tenant settings
export const formatCurrency = (
  amount: number,
  currencySettings?: TenantCurrencySettings | null,
  defaultCurrency?: Currency
) => {
  if (!currencySettings && !defaultCurrency) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  }

  const currency = currencySettings?.default_currency || defaultCurrency;
  const settings = currencySettings || {
    display_format: 'symbol_before' as const,
    thousand_separator: ',',
    decimal_separator: '.',
    show_decimals: true,
  };

  if (!currency) {
    return amount.toString();
  }

  const decimals = settings.show_decimals ? currency.decimal_places : 0;
  const formatted = amount.toFixed(decimals);
  const [integerPart, decimalPart] = formatted.split('.');

  // Add thousand separators
  const integerWithSeparators = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, settings.thousand_separator);
  
  // Combine integer and decimal parts
  const numberPart = decimals > 0 && decimalPart 
    ? `${integerWithSeparators}${settings.decimal_separator}${decimalPart}`
    : integerWithSeparators;

  // Apply display format
  switch (settings.display_format) {
    case 'symbol_before':
      return `${currency.symbol}${numberPart}`;
    case 'symbol_after':
      return `${numberPart}${currency.symbol}`;
    case 'code_before':
      return `${currency.code} ${numberPart}`;
    case 'code_after':
      return `${numberPart} ${currency.code}`;
    default:
      return `${currency.symbol}${numberPart}`;
  }
};