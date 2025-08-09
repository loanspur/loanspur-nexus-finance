import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface UserInvitationRequest {
  email: string;
  firstName: string;
  lastName: string;
  role: 'tenant_admin' | 'loan_officer' | 'client';
  tenantId: string;
  tenantName: string;
  tenantSubdomain: string;
  invitedBy: string;
  metadata?: any;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      email, 
      firstName, 
      lastName, 
      role, 
      tenantId, 
      tenantName, 
      tenantSubdomain,
      invitedBy,
      metadata 
    }: UserInvitationRequest = await req.json();

    if (!email || !firstName || !lastName || !role || !tenantId || !tenantName) {
      throw new Error("All user details are required");
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Generate a secure invitation token
    const invitationToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

    // Store invitation in database
    const { error: insertError } = await supabase
      .from('user_invitations')
      .insert({
        email,
        first_name: firstName,
        last_name: lastName,
        role,
        tenant_id: tenantId,
        invitation_token: invitationToken,
        expires_at: expiresAt,
        invited_by: invitedBy
      });

    if (insertError) {
      console.error("Database error:", insertError);
      throw new Error('Failed to create invitation');
    }

    // Initialize Resend
    const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
    
    // Fetch tenant data to get domain and subdomain
    const { data: tenantData, error: tenantError } = await supabase
      .from('tenants')
      .select('domain, subdomain')
      .eq('id', tenantId)
      .single();
    
    if (tenantError) {
      console.error("Error fetching tenant data:", tenantError);
      throw new Error('Failed to fetch tenant information');
    }
    
    // Generate invitation URL using custom domain first, then subdomain, then fallback
    let baseUrl;
    if (tenantData.domain) {
      // Use custom domain if available
      baseUrl = `https://${tenantData.domain}`;
    } else if (tenantData.subdomain) {
      // Fall back to production subdomain
      baseUrl = `https://${tenantData.subdomain}.loanspurcbs.com`;
    } else {
      // Final fallback to production root
      baseUrl = `https://loanspurcbs.com`;
    }
    
    const invitationUrl = `${baseUrl}/auth/accept-invitation?token=${invitationToken}`;
    
    console.log(`Generated invitation URL: ${invitationUrl} (using ${tenantData.domain ? 'custom domain' : tenantData.subdomain ? 'subdomain' : 'fallback'})`);

    const roleDisplayName = role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());

    // Send invitation email
    const emailResponse = await resend.emails.send({
      from: Deno.env.get('RESEND_EMAIL_FROM') || 'LoanSpur CBS <noreply@resend.dev>',
      to: [email],
      subject: `You're invited to join ${tenantName} - LoanSpur CBS`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #1e40af; text-align: center; margin-bottom: 30px;">LoanSpur CBS</h1>
          
          <div style="background-color: #f8fafc; padding: 30px; border-radius: 8px; border-left: 4px solid #1e40af;">
            <h2 style="color: #334155; margin-top: 0;">You're Invited!</h2>
            <p style="color: #475569; line-height: 1.6;">
              Hello ${firstName},
            </p>
            <p style="color: #475569; line-height: 1.6;">
              You have been invited to join <strong>${tenantName}</strong> as a <strong>${roleDisplayName}</strong> on the LoanSpur Core Banking System.
            </p>
            
            <div style="background-color: #e0f2fe; padding: 20px; border-radius: 6px; margin: 20px 0;">
              <h3 style="color: #0277bd; margin-top: 0;">Your Account Details:</h3>
              <ul style="color: #475569; list-style: none; padding: 0;">
                <li style="margin: 8px 0;"><strong>Organization:</strong> ${tenantName}</li>
                <li style="margin: 8px 0;"><strong>Email:</strong> ${email}</li>
                <li style="margin: 8px 0;"><strong>Role:</strong> ${roleDisplayName}</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${invitationUrl}" style="background-color: #1e40af; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                Accept Invitation
              </a>
            </div>
            
            <p style="color: #475569; line-height: 1.6;">
              After clicking the link above, you'll be able to set your password and access your account.
            </p>
            
            <p style="color: #64748b; font-size: 14px; margin-top: 30px;">
              This invitation will expire in 7 days. If you have any questions, please contact your administrator.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; color: #94a3b8; font-size: 12px;">
            <p>© 2024 LoanSpur CBS. All rights reserved.</p>
          </div>
        </div>
      `,
    });

    console.log("User invitation sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Invitation sent successfully",
        invitationToken 
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
    console.error("Error in send-user-invitation function:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        message: error.message || "Failed to send invitation" 
      }),
      {
        status: 400,
        headers: { 
          "Content-Type": "application/json", 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);