import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Types
export interface TenantPaymentMethod {
  id: string;
  tenant_id: string;
  payment_type: string;
  provider: string;
  provider_payment_method_id?: string;
  is_default: boolean;
  is_active: boolean;
  metadata: any;
  created_at: string;
  updated_at: string;
}

export interface TenantPaymentHistory {
  id: string;
  tenant_id: string;
  invoice_id?: string;
  payment_method_id?: string;
  amount: number;
  currency: string;
  payment_provider?: string;
  provider_transaction_id?: string;
  payment_status: string;
  payment_type: string;
  payment_reference?: string;
  processing_fee: number;
  metadata: any;
  processed_at?: string;
  created_at: string;
}

export interface TenantDomain {
  id: string;
  tenant_id: string;
  domain_name: string;
  domain_type: string;
  verification_status: string;
  verification_token?: string;
  ssl_status: string;
  dns_records: any;
  is_primary: boolean;
  is_active: boolean;
  verified_at?: string;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

export interface TenantAddon {
  id: string;
  tenant_id: string;
  addon_name: string;
  addon_type: string;
  quantity: number;
  unit_price: number;
  billing_cycle: string;
  is_active: boolean;
  activated_at: string;
  deactivated_at?: string;
  created_at: string;
  updated_at: string;
}

export interface TenantMpesaConfig {
  id: string;
  tenant_id: string;
  config_type: string;
  consumer_key?: string;
  consumer_secret?: string;
  business_short_code?: string;
  passkey?: string;
  callback_url?: string;
  validation_url?: string;
  confirmation_url?: string;
  result_url?: string;
  timeout_url?: string;
  environment: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Tenant Payment Methods hooks
export const useTenantPaymentMethods = (tenantId: string) => {
  return useQuery({
    queryKey: ['tenant-payment-methods', tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tenant_payment_methods')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as TenantPaymentMethod[];
    },
    enabled: !!tenantId,
  });
};

export const useCreateTenantPaymentMethod = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (paymentMethod: Omit<TenantPaymentMethod, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('tenant_payment_methods')
        .insert([paymentMethod])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tenant-payment-methods', variables.tenant_id] });
      toast({
        title: "Success",
        description: "Payment method added successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

// Tenant Domains hooks
export const useTenantDomains = (tenantId: string) => {
  return useQuery({
    queryKey: ['tenant-domains', tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tenant_domains')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as TenantDomain[];
    },
    enabled: !!tenantId,
  });
};

export const useCreateTenantDomain = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (domain: Omit<TenantDomain, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('tenant_domains')
        .insert([domain])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tenant-domains', variables.tenant_id] });
      toast({
        title: "Success",
        description: "Domain added successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

// Tenant Addons hooks
export const useTenantAddons = (tenantId: string) => {
  return useQuery({
    queryKey: ['tenant-addons', tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tenant_addons')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as TenantAddon[];
    },
    enabled: !!tenantId,
  });
};

export const useCreateTenantAddon = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (addon: Omit<TenantAddon, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('tenant_addons')
        .insert([addon])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tenant-addons', variables.tenant_id] });
      toast({
        title: "Success",
        description: "Add-on created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

// Tenant M-Pesa Configuration hooks
export const useTenantMpesaConfig = (tenantId: string) => {
  return useQuery({
    queryKey: ['tenant-mpesa-config', tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tenant_mpesa_config')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('config_type');
      
      if (error) throw error;
      return data as TenantMpesaConfig[];
    },
    enabled: !!tenantId,
  });
};

export const useCreateTenantMpesaConfig = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (config: Omit<TenantMpesaConfig, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('tenant_mpesa_config')
        .insert([config])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tenant-mpesa-config', variables.tenant_id] });
      toast({
        title: "Success",
        description: "M-Pesa configuration saved successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

// Tenant Payment History hooks
export const useTenantPaymentHistory = (tenantId: string) => {
  return useQuery({
    queryKey: ['tenant-payment-history', tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tenant_payment_history')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as TenantPaymentHistory[];
    },
    enabled: !!tenantId,
  });
};

// Update tenant mutation
export const useUpdateTenant = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ tenantId, updates }: { tenantId: string; updates: any }) => {
      const { data, error } = await supabase
        .from('tenants')
        .update(updates)
        .eq('id', tenantId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tenant-details', data.id] });
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      toast({
        title: "Success",
        description: "Tenant updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

// Delete tenant mutation
export const useDeleteTenant = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (tenantId: string) => {
      const { error } = await supabase
        .from('tenants')
        .delete()
        .eq('id', tenantId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      toast({
        title: "Success",
        description: "Tenant deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};