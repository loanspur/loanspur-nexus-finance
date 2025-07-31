import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TenantRegistrationData {
  // Tenant Details
  tenantName: string;
  
  // Admin User Details
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  
  // Organization Details
  contactPersonPhone?: string;
  country: string;
  timezone: string;
  currency: string;
  city?: string;
  stateProvince?: string;
  postalCode?: string;
}

interface TenantRegistrationResult {
  tenant: any;
  user: any;
}

export const useTenantRegistration = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: TenantRegistrationData): Promise<TenantRegistrationResult> => {
      // Generate unique slug and subdomain from tenant name
      const slug = data.tenantName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const subdomain = slug;
      
      // Check if subdomain is already taken
      const { data: existingTenant } = await supabase
        .from('tenants')
        .select('id')
        .eq('subdomain', subdomain)
        .single();

      if (existingTenant) {
        throw new Error(`Organization name "${data.tenantName}" is already taken. Please choose a different name.`);
      }

      // Step 1: Create tenant
      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .insert([{
          name: data.tenantName,
          slug: slug,
          subdomain: subdomain,
          domain: null,
          logo_url: null,
          theme_colors: { primary: "#1e40af", secondary: "#64748b" },
          pricing_tier: "starter", // Default to starter for free trial
          status: 'active',
          trial_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days trial
          subscription_ends_at: null,
          mifos_base_url: null,
          mifos_tenant_identifier: null,
          mifos_username: null,
          mifos_password: null,
          contact_person_name: `${data.firstName} ${data.lastName}`,
          contact_person_email: data.email,
          contact_person_phone: data.contactPersonPhone || null,
          billing_cycle: 'monthly',
          auto_billing: false, // Start with manual billing for trial
          payment_terms: 30,
          billing_address: {},
          dns_settings: {},
          mpesa_settings: {},
          addons: [],
          country: data.country,
          timezone: data.timezone,
          currency_code: data.currency,
          city: data.city || null,
          state_province: data.stateProvince || null,
          postal_code: data.postalCode || null,
        }])
        .select()
        .single();

      if (tenantError) {
        throw new Error(`Failed to create organization: ${tenantError.message}`);
      }

      // Step 2: Create admin user account
      const redirectUrl = `${window.location.origin}/`;
      
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            first_name: data.firstName,
            last_name: data.lastName,
            role: 'tenant_admin',
            tenant_id: tenant.id,
          }
        }
      });

      if (signUpError) {
        // If user creation fails, we should clean up the tenant
        await supabase.from('tenants').delete().eq('id', tenant.id);
        throw new Error(`Failed to create admin user: ${signUpError.message}`);
      }

      // Step 3: Ensure profile is created with correct tenant_id
      // The trigger should handle this, but let's add a fallback
      if (authData.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            user_id: authData.user.id,
            email: data.email,
            first_name: data.firstName,
            last_name: data.lastName,
            role: 'tenant_admin',
            tenant_id: tenant.id,
          });

        if (profileError) {
          console.warn('Warning: Could not ensure profile creation:', profileError);
        }
      }

      return {
        tenant,
        user: authData.user,
      };
    },
    onSuccess: (result) => {
      toast({
        title: "Success!",
        description: `Organization "${result.tenant.name}" has been created successfully. Please check your email to verify your account.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Registration Failed",
        description: error.message || "Failed to create organization. Please try again.",
        variant: "destructive",
      });
    },
  });
};