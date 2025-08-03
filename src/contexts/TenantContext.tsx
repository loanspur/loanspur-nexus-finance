import React, { createContext, useContext, useEffect, useState } from 'react';
import { getCurrentSubdomain, getTenantBySubdomain, TenantInfo } from '@/utils/tenant';
import { useAuth } from '@/hooks/useAuth';

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
  const { profile } = useAuth();

  useEffect(() => {
    async function loadTenant() {
      setLoading(true);
      setError(null);
      
      // Check if super admin has selected a tenant for switching
      const isSuperAdmin = profile?.role === 'super_admin';
      let selectedTenantData = null;
      
      if (isSuperAdmin) {
        const storedTenant = sessionStorage.getItem('superadmin_selected_tenant');
        if (storedTenant) {
          try {
            selectedTenantData = JSON.parse(storedTenant);
          } catch (e) {
            sessionStorage.removeItem('superadmin_selected_tenant');
          }
        }
      }
      
      // If super admin has selected a tenant, use that instead of subdomain
      if (selectedTenantData) {
        const tenantInfo: TenantInfo = {
          id: selectedTenantData.id,
          name: selectedTenantData.name,
          slug: selectedTenantData.slug,
          subdomain: selectedTenantData.subdomain || selectedTenantData.slug,
          logo_url: null,
          status: 'active' as const
        };
        setCurrentTenant(tenantInfo);
        setSubdomain(selectedTenantData.subdomain || selectedTenantData.slug);
        setLoading(false);
        return;
      }
      
      // Regular subdomain-based tenant loading
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
    
    // Listen for tenant switching changes
    const handleStorageChange = () => {
      loadTenant();
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom events for same-tab changes
    const handleTenantSwitch = () => {
      loadTenant();
    };
    
    window.addEventListener('tenantSwitched', handleTenantSwitch);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('tenantSwitched', handleTenantSwitch);
    };
  }, [profile?.role]);

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