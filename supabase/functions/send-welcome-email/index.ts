import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const RESEND_EMAIL_FROM = Deno.env.get("RESEND_EMAIL_FROM");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendWelcomeEmailRequest {
  email: string;
  firstName: string;
  lastName: string;
  tenantName: string;
  subdomain: string;
  loginUrl?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, firstName, lastName, tenantName, subdomain, loginUrl }: SendWelcomeEmailRequest = await req.json();

    if (!email || !firstName || !tenantName || !subdomain) {
      throw new Error("Missing required fields");
    }

    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY environment variable is not set");
    }

    if (!RESEND_EMAIL_FROM) {
      throw new Error("RESEND_EMAIL_FROM environment variable is not set");
    }

    // Initialize Resend
    const resend = new Resend(RESEND_API_KEY);

    // Always link to production domain in emails
    const resolvedLoginUrl = `https://${subdomain}.loanspurcbs.com`;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #1e40af; margin: 0;">LoanSpur</h1>
          <p style="color: #64748b; margin: 5px 0;">Core Banking System</p>
        </div>
        
        <div style="background: #f8fafc; border-radius: 8px; padding: 30px;">
          <h2 style="color: #334155; margin-bottom: 20px;">Welcome to LoanSpur, ${firstName}!</h2>
          
          <p style="color: #64748b; margin-bottom: 20px;">
            Congratulations! Your organization <strong>${tenantName}</strong> has been successfully set up on LoanSpur.
          </p>
          
          <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="color: #1e40af; margin-top: 0;">Your Organization Details:</h3>
            <ul style="color: #64748b; line-height: 1.6;">
              <li><strong>Organization:</strong> ${tenantName}</li>
              <li><strong>Subdomain:</strong> ${subdomain}.loanspurcbs.com</li>
              <li><strong>Admin Email:</strong> ${email}</li>
              <li><strong>Trial Period:</strong> 30 days</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resolvedLoginUrl}" 
               style="background: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              Access Your Dashboard
            </a>
          </div>
          
          <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 15px; margin: 20px 0;">
            <h4 style="color: #92400e; margin-top: 0;">Important Next Steps:</h4>
            <ol style="color: #92400e; margin: 0;">
              <li>Verify your email address if you haven't already</li>
              <li>Complete your organization profile setup</li>
              <li>Add your first users and configure permissions</li>
              <li>Set up your loan products and savings accounts</li>
              <li>Configure your payment integration (M-Pesa, etc.)</li>
            </ol>
          </div>
          
          <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 30px;">
            <h4 style="color: #334155;">Quick Links:</h4>
            <ul style="color: #64748b;">
              <li><a href="${resolvedLoginUrl}" style="color: #1e40af;">Dashboard Login</a></li>
              <li><a href="${resolvedLoginUrl}/tenant/settings" style="color: #1e40af;">Organization Settings</a></li>
              <li><a href="${resolvedLoginUrl}/tenant/users" style="color: #1e40af;">User Management</a></li>
              <li><a href="https://docs.loanspur.com" style="color: #1e40af;">Documentation</a></li>
            </ul>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 30px; color: #94a3b8; font-size: 12px;">
          <p>Need help? Contact our support team at support@loanspur.com</p>
          <p>© 2024 LoanSpur. All rights reserved.</p>
        </div>
      </div>
    `;

    // Send welcome email via Resend
    const emailResponse = await resend.emails.send({
      from: `LoanSpur <${RESEND_EMAIL_FROM}>`,
      to: [email],
      subject: `Welcome to LoanSpur - ${tenantName} is ready!`,
      html: htmlContent,
    });

    if (emailResponse.error) {
      console.error("Resend error:", emailResponse.error);
      throw new Error(`Failed to send welcome email via Resend: ${emailResponse.error.message}`);
    }

    console.log("Welcome email sent successfully via Resend:", emailResponse.data);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Welcome email sent successfully" 
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
    console.error("Error in send-welcome-email function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Failed to send welcome email" 
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