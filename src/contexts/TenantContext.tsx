import React, { createContext, useContext, useEffect, useState } from 'react';
import { getCurrentSubdomain, getTenantBySubdomain, TenantInfo } from '@/utils/tenant';

interface TenantContextType {
  currentTenant: TenantInfo | null;
  loading: boolean;
  error: string | null;
  isSubdomainTenant: boolean;
  subdomain: string | null;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function useTenant() {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
}

interface TenantProviderProps {
  children: React.ReactNode;
}

export function TenantProvider({ children }: TenantProviderProps) {
  const [currentTenant, setCurrentTenant] = useState<TenantInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subdomain, setSubdomain] = useState<string | null>(null);

  useEffect(() => {
    async function loadTenant() {
      setLoading(true);
      setError(null);
      
      const currentSubdomain = getCurrentSubdomain();
      setSubdomain(currentSubdomain);
      
      if (currentSubdomain) {
        try {
          const tenant = await getTenantBySubdomain(currentSubdomain);
          if (tenant) {
            setCurrentTenant(tenant);
          } else {
            setError(`Tenant not found for subdomain: ${currentSubdomain}`);
          }
        } catch (err) {
          setError('Failed to load tenant information');
          console.error('Error loading tenant:', err);
        }
      } else {
        // No subdomain - main domain access
        setCurrentTenant(null);
      }
      
      setLoading(false);
    }

    loadTenant();
  }, []);

  const isSubdomainTenant = subdomain !== null;

  return (
    <TenantContext.Provider
      value={{
        currentTenant,
        loading,
        error,
        isSubdomainTenant,
        subdomain
      }}
    >
      {children}
    </TenantContext.Provider>
  );
}