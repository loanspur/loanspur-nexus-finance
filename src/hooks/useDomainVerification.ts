import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { generateDNSVerificationRecord, verifyDNSRecord } from '@/utils/ssl-verification';

export interface DomainVerification {
  id: string;
  tenant_id: string;
  domain: string;
  verification_token: string;
  dns_record_type: string;
  dns_record_name: string;
  dns_record_value: string;
  is_verified: boolean;
  verified_at?: string;
  ssl_certificate_issued: boolean;
  ssl_certificate_issued_at?: string;
  created_at: string;
  updated_at: string;
}

export const useDomainVerifications = (tenantId?: string) => {
  return useQuery({
    queryKey: ['domain-verifications', tenantId],
    queryFn: async () => {
      let query = supabase.from('domain_verifications').select('*');
      
      if (tenantId) {
        query = query.eq('tenant_id', tenantId);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as DomainVerification[];
    },
    enabled: !!tenantId,
  });
};

export const useCreateDomainVerification = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ tenantId, domain }: { tenantId: string; domain: string }) => {
      // Generate DNS verification record
      const dnsRecord = generateDNSVerificationRecord(domain, tenantId);
      
      const verificationData = {
        tenant_id: tenantId,
        domain,
        verification_token: dnsRecord.token,
        dns_record_type: dnsRecord.type,
        dns_record_name: dnsRecord.name,
        dns_record_value: dnsRecord.value,
        is_verified: false,
        ssl_certificate_issued: false,
      };

      const { data, error } = await supabase
        .from('domain_verifications')
        .insert([verificationData])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['domain-verifications'] });
      toast({
        title: "Success",
        description: "Domain verification created. Please add the DNS record to verify ownership.",
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

export const useVerifyDomain = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (verificationId: string) => {
      // First get the verification record
      const { data: verification, error: fetchError } = await supabase
        .from('domain_verifications')
        .select('*')
        .eq('id', verificationId)
        .single();

      if (fetchError || !verification) throw fetchError || new Error('Verification not found');

      // Check DNS record
      const isVerified = await verifyDNSRecord(verification.domain, verification.dns_record_value);

      if (!isVerified) {
        throw new Error('DNS record not found or incorrect. Please ensure the DNS record is properly configured.');
      }

      // Update verification status
      const { data, error } = await supabase
        .from('domain_verifications')
        .update({ 
          is_verified: true, 
          verified_at: new Date().toISOString() 
        })
        .eq('id', verificationId)
        .select()
        .single();
      
      if (error) throw error;

      // Also update the tenant's domain field and custom_domain_verified status
      await supabase
        .from('tenants')
        .update({ 
          domain: verification.domain,
          custom_domain_verified: true 
        })
        .eq('id', verification.tenant_id);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['domain-verifications'] });
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      toast({
        title: "Success",
        description: "Domain verified successfully! SSL certificate will be issued shortly.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Verification Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useCheckSSLStatus = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (tenantId: string) => {
      // This would call an edge function to check SSL certificate status
      const { data, error } = await supabase.functions.invoke('check-ssl-status', {
        body: { tenantId }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      queryClient.invalidateQueries({ queryKey: ['domain-verifications'] });
      
      if (data.ssl_certificate_issued) {
        toast({
          title: "SSL Certificate Active",
          description: "Your SSL certificate has been successfully issued and is active.",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to check SSL status: ${error.message}`,
        variant: "destructive",
      });
    },
  });
};