import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  subdomain?: string;
}

interface TenantSwitchingContextType {
  availableTenants: Tenant[];
  selectedTenant: Tenant | null;
  isLoading: boolean;
  switchToTenant: (tenant: Tenant) => void;
  switchToSuperAdmin: () => void;
  refreshTenants: () => Promise<void>;
}

const TenantSwitchingContext = createContext<TenantSwitchingContextType | undefined>(undefined);

interface TenantSwitchingProviderProps {
  children: ReactNode;
}

export const TenantSwitchingProvider = ({ children }: TenantSwitchingProviderProps) => {
  const [availableTenants, setAvailableTenants] = useState<Tenant[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { profile } = useAuth();
  const { toast } = useToast();

  const fetchTenants = async () => {
    if (profile?.role !== 'super_admin') return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('tenants')
        .select('id, name, slug, subdomain')
        .eq('status', 'active')
        .order('name');

      if (error) throw error;
      setAvailableTenants(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to load tenants: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const switchToTenant = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    // Store in sessionStorage for persistence across page reloads
    sessionStorage.setItem('superadmin_selected_tenant', JSON.stringify(tenant));
    
    // Dispatch custom event for same-tab tenant context updates
    window.dispatchEvent(new CustomEvent('tenantSwitched'));
    
    toast({
      title: "Tenant Switched",
      description: `Now viewing as: ${tenant.name}`,
    });
  };

  const switchToSuperAdmin = () => {
    setSelectedTenant(null);
    sessionStorage.removeItem('superadmin_selected_tenant');
    
    // Dispatch custom event for same-tab tenant context updates
    window.dispatchEvent(new CustomEvent('tenantSwitched'));
    
    toast({
      title: "Switched to Super Admin",
      description: "Returned to super admin view",
    });
  };

  const refreshTenants = async () => {
    await fetchTenants();
  };

  // Load tenants and check for stored selection
  useEffect(() => {
    if (profile?.role === 'super_admin') {
      fetchTenants();
      
      // Check for stored tenant selection
      const storedTenant = sessionStorage.getItem('superadmin_selected_tenant');
      if (storedTenant) {
        try {
          setSelectedTenant(JSON.parse(storedTenant));
        } catch (error) {
          sessionStorage.removeItem('superadmin_selected_tenant');
        }
      }
    }
  }, [profile?.role]);

  const value = {
    availableTenants,
    selectedTenant,
    isLoading,
    switchToTenant,
    switchToSuperAdmin,
    refreshTenants,
  };

  return (
    <TenantSwitchingContext.Provider value={value}>
      {children}
    </TenantSwitchingContext.Provider>
  );
};

export const useTenantSwitching = () => {
  const context = useContext(TenantSwitchingContext);
  if (context === undefined) {
    throw new Error('useTenantSwitching must be used within a TenantSwitchingProvider');
  }
  return context;
};