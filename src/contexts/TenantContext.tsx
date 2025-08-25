import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getCurrentSubdomain } from '@/utils/tenant';

interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  domain: string;
  is_active: boolean;
  settings: any;
  created_at: string;
  updated_at: string;
}

interface TenantContextType {
  currentTenant: Tenant | null;
  loading: boolean;
  error: string | null;
  isSubdomainTenant: boolean;
  refreshTenant: () => Promise<void>;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubdomainTenant, setIsSubdomainTenant] = useState(false);

  const fetchTenant = async (subdomain: string) => {
    try {
      setLoading(true);
      setError(null);

      // Enhanced subdomain validation
      if (!subdomain || subdomain.length < 2) {
        setError('Invalid subdomain');
        setIsSubdomainTenant(false);
        return;
      }

      // Check if subdomain is reserved
      const reservedSubdomains = ['www', 'api', 'admin', 'mail', 'ftp', 'smtp', 'pop', 'imap'];
      if (reservedSubdomains.includes(subdomain.toLowerCase())) {
        setError('Reserved subdomain');
        setIsSubdomainTenant(false);
        return;
      }

      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .select('*')
        .eq('subdomain', subdomain.toLowerCase())
        .eq('is_active', true)
        .single();

      if (tenantError) {
        console.error('Tenant fetch error:', tenantError);
        setError(tenantError.message);
        setIsSubdomainTenant(false);
        return;
      }

      if (!tenant) {
        setError('Tenant not found');
        setIsSubdomainTenant(false);
        return;
      }

      setCurrentTenant(tenant);
      setIsSubdomainTenant(true);
      
      // Debug logging
      if (import.meta.env.DEV) {
        console.log('Tenant loaded:', {
          subdomain,
          tenant: tenant.name,
          isSubdomainTenant: true
        });
      }

    } catch (err) {
      console.error('Error fetching tenant:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setIsSubdomainTenant(false);
    } finally {
      setLoading(false);
    }
  };

  const refreshTenant = async () => {
    const subdomain = getCurrentSubdomain();
    if (subdomain) {
      await fetchTenant(subdomain);
    }
  };

  useEffect(() => {
    const subdomain = getCurrentSubdomain();
    
    // Debug logging
    if (import.meta.env.DEV) {
      console.log('TenantContext - Subdomain detected:', subdomain);
    }

    if (subdomain) {
      setIsSubdomainTenant(true);
      fetchTenant(subdomain);
    } else {
      setIsSubdomainTenant(false);
      setLoading(false);
    }
  }, []);

  // Listen for subdomain changes (for development/testing)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'current_subdomain') {
        const newSubdomain = e.newValue;
        if (newSubdomain) {
          fetchTenant(newSubdomain);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <TenantContext.Provider value={{
      currentTenant,
      loading,
      error,
      isSubdomainTenant,
      refreshTenant
    }}>
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};