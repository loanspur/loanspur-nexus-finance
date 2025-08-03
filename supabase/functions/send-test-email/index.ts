import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const RESEND_EMAIL_FROM = Deno.env.get("RESEND_EMAIL_FROM");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendTestEmailRequest {
  testEmail: string;
  fromName?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { testEmail, fromName = "LoanSpur" }: SendTestEmailRequest = await req.json();

    if (!testEmail) {
      throw new Error("Test email address is required");
    }

    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY environment variable is not set");
    }

    if (!RESEND_EMAIL_FROM) {
      throw new Error("RESEND_EMAIL_FROM environment variable is not set");
    }

    // Initialize Resend
    const resend = new Resend(RESEND_API_KEY);

    // Send test email
    const emailResponse = await resend.emails.send({
      from: `${fromName} <${RESEND_EMAIL_FROM}>`,
      to: [testEmail],
      subject: "Test Email - Email Configuration Verification",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #1e40af; margin: 0;">${fromName}</h1>
            <p style="color: #64748b; margin: 5px 0;">Email Configuration Test</p>
          </div>
          
          <div style="background: #f8fafc; border-radius: 8px; padding: 30px;">
            <h2 style="color: #334155; margin-bottom: 20px;">Email Configuration Test</h2>
            <p style="color: #64748b; margin-bottom: 20px;">
              This is a test email to verify your Resend email configuration is working correctly.
            </p>
            
            <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h3 style="color: #334155; margin-top: 0;">Configuration Details:</h3>
              <ul style="color: #64748b; margin: 0; padding-left: 20px;">
                <li><strong>Provider:</strong> Resend</li>
                <li><strong>From Email:</strong> ${RESEND_EMAIL_FROM}</li>
                <li><strong>From Name:</strong> ${fromName}</li>
                <li><strong>Test Date:</strong> ${new Date().toISOString()}</li>
              </ul>
            </div>
            
            <p style="color: #16a34a; font-weight: 600;">
              ✅ If you received this email, your configuration is working correctly!
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; color: #94a3b8; font-size: 12px;">
            <p>This is an automated test email. Please do not reply to this message.</p>
          </div>
        </div>
      `,
    });

    if (emailResponse.error) {
      console.error("Resend error:", emailResponse.error);
      throw new Error(`Failed to send test email: ${emailResponse.error.message}`);
    }

    console.log("Test email sent successfully:", emailResponse.data);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Test email sent successfully",
        emailId: emailResponse.data?.id
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
    console.error("Error in send-test-email function:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || "Failed to send test email" 
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