import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SSLCheckRequest {
  tenantId: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tenantId }: SSLCheckRequest = await req.json();

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get tenant information
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', tenantId)
      .single();

    if (tenantError || !tenant) {
      throw new Error('Tenant not found');
    }

    // Get domain verifications for this tenant
    const { data: verifications, error: verificationError } = await supabase
      .from('domain_verifications')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_verified', true);

    if (verificationError) {
      throw new Error('Failed to fetch domain verifications');
    }

    const sslResults = [];

    // Check wildcard SSL for subdomain
    if (tenant.subdomain) {
      // Production domain
      const subdomainUrl = `https://${tenant.subdomain}.loanspurcbs.com`;
      try {
        const response = await fetch(subdomainUrl, { 
          method: 'HEAD',
          signal: AbortSignal.timeout(10000) // 10 second timeout
        });
        
        sslResults.push({
          domain: `${tenant.subdomain}.loanspurcbs.com`,
          type: 'subdomain',
          ssl_active: response.ok,
          status_code: response.status,
          checked_at: new Date().toISOString()
        });
      } catch (error) {
        sslResults.push({
          domain: `${tenant.subdomain}.loanspurcbs.com`,
          type: 'subdomain',
          ssl_active: false,
          error: (error as Error).message,
          checked_at: new Date().toISOString()
        });
      }

      // Development domain
      const devSubdomainUrl = `https://${tenant.subdomain}.loanspur.online`;
      try {
        const response = await fetch(devSubdomainUrl, { 
          method: 'HEAD',
          signal: AbortSignal.timeout(10000) // 10 second timeout
        });
        
        sslResults.push({
          domain: `${tenant.subdomain}.loanspur.online`,
          type: 'subdomain',
          ssl_active: response.ok,
          status_code: response.status,
          checked_at: new Date().toISOString()
        });
      } catch (error) {
        sslResults.push({
          domain: `${tenant.subdomain}.loanspur.online`,
          type: 'subdomain',
          ssl_active: false,
          error: (error as Error).message,
          checked_at: new Date().toISOString()
        });
      }
    }

    // Check SSL for custom domains
    if (verifications && verifications.length > 0) {
      for (const verification of verifications) {
        try {
          const response = await fetch(`https://${verification.domain}`, { 
            method: 'HEAD',
            signal: AbortSignal.timeout(10000) // 10 second timeout
          });
          
          const sslActive = response.ok;
          
          // Update domain verification with SSL status
          if (sslActive && !verification.ssl_certificate_issued) {
            await supabase
              .from('domain_verifications')
              .update({ 
                ssl_certificate_issued: true,
                ssl_certificate_issued_at: new Date().toISOString()
              })
              .eq('id', verification.id);
          }
          
          sslResults.push({
            domain: verification.domain,
            type: 'custom',
            ssl_active: sslActive,
            status_code: response.status,
            checked_at: new Date().toISOString()
          });
        } catch (error) {
          sslResults.push({
            domain: verification.domain,
            type: 'custom',
            ssl_active: false,
            error: error.message,
            checked_at: new Date().toISOString()
          });
        }
      }
    }

    // Update tenant SSL status
    const overallSSLStatus = sslResults.every(result => result.ssl_active) ? 'active' : 'partial';
    await supabase
      .from('tenants')
      .update({ 
        ssl_status: overallSSLStatus,
        ssl_verified_at: new Date().toISOString()
      })
      .eq('id', tenantId);

    // Log the SSL check activity
    await supabase
      .from('audit_trails')
      .insert({
        tenant_id: tenantId,
        table_name: 'tenants',
        record_id: tenantId,
        action: 'SSL_CHECK',
        new_values: {
          ssl_results: sslResults,
          overall_status: overallSSLStatus,
          checked_at: new Date().toISOString()
        }
      });

    return new Response(
      JSON.stringify({ 
        success: true,
        ssl_status: overallSSLStatus,
        ssl_results: sslResults,
        ssl_certificate_issued: sslResults.some(result => result.ssl_active)
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );

  } catch (error: any) {
    console.error("Error in check-ssl-status function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false
      }),
      {
        status: 500,
        headers: { 
          "Content-Type": "application/json", 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);