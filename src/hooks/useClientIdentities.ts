import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTenant } from "@/contexts/TenantContext";

export interface ClientIdentity {
  id: string;
  tenant_id: string;
  client_id: string;
  identifier_type: 'email' | 'phone' | 'passport' | 'driving_license' | 'national_id';
  identifier_value: string;
  description?: string;
  is_verified: boolean;
  verified_at?: string;
  verified_by?: string;
  created_at: string;
  updated_at: string;
}

export const useClientIdentities = (clientId: string) => {
  const [identities, setIdentities] = useState<ClientIdentity[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { currentTenant } = useTenant();

  const fetchIdentities = async () => {
    if (!clientId || !currentTenant?.id) return;
    
    try {
      setLoading(true);
      const { data, error } = await (supabase as any)
        .from('client_identities')
        .select('*')
        .eq('client_id', clientId)
        .eq('tenant_id', currentTenant.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setIdentities(data || []);
    } catch (error) {
      console.error('Error fetching client identities:', error);
      toast({
        title: "Error",
        description: "Failed to load client identities",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createIdentity = async (identityData: Omit<ClientIdentity, 'id' | 'tenant_id' | 'client_id' | 'created_at' | 'updated_at'>) => {
    if (!currentTenant?.id) return null;

    try {
      const { data, error } = await (supabase as any)
        .from('client_identities')
        .insert({
          ...identityData,
          tenant_id: currentTenant.id,
          client_id: clientId
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          toast({
            title: "Error",
            description: `This ${identityData.identifier_type} is already registered to another client`,
            variant: "destructive"
          });
          return null;
        }
        throw error;
      }

      setIdentities(prev => [data, ...prev]);
      toast({
        title: "Success",
        description: "Identity added successfully"
      });
      return data;
    } catch (error) {
      console.error('Error creating identity:', error);
      toast({
        title: "Error",
        description: "Failed to add identity",
        variant: "destructive"
      });
      return null;
    }
  };

  const updateIdentity = async (id: string, updates: Partial<ClientIdentity>) => {
    try {
      const { data, error } = await (supabase as any)
        .from('client_identities')
        .update(updates)
        .eq('id', id)
        .eq('tenant_id', currentTenant?.id)
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          toast({
            title: "Error",
            description: `This ${updates.identifier_type} is already registered to another client`,
            variant: "destructive"
          });
          return null;
        }
        throw error;
      }

      setIdentities(prev => prev.map(identity => 
        identity.id === id ? data : identity
      ));
      toast({
        title: "Success",
        description: "Identity updated successfully"
      });
      return data;
    } catch (error) {
      console.error('Error updating identity:', error);
      toast({
        title: "Error",
        description: "Failed to update identity",
        variant: "destructive"
      });
      return null;
    }
  };

  const deleteIdentity = async (id: string) => {
    try {
      const { error } = await (supabase as any)
        .from('client_identities')
        .delete()
        .eq('id', id)
        .eq('tenant_id', currentTenant?.id);

      if (error) throw error;

      setIdentities(prev => prev.filter(identity => identity.id !== id));
      toast({
        title: "Success",
        description: "Identity deleted successfully"
      });
      return true;
    } catch (error) {
      console.error('Error deleting identity:', error);
      toast({
        title: "Error",
        description: "Failed to delete identity",
        variant: "destructive"
      });
      return false;
    }
  };

  useEffect(() => {
    fetchIdentities();
  }, [clientId, currentTenant?.id]);

  return {
    identities,
    loading,
    createIdentity,
    updateIdentity,
    deleteIdentity,
    refetch: fetchIdentities
  };
};