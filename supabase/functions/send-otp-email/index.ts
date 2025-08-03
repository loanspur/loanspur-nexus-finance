import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const RESEND_EMAIL_FROM = Deno.env.get("RESEND_EMAIL_FROM");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendOTPRequest {
  email: string;
  type: 'registration' | 'verification';
  tenantName?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, type, tenantName }: SendOTPRequest = await req.json();

    if (!email) {
      throw new Error("Email is required");
    }

    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY environment variable is not set");
    }

    if (!RESEND_EMAIL_FROM) {
      throw new Error("RESEND_EMAIL_FROM environment variable is not set");
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store OTP in database (expires in 10 minutes)
    const supabaseResponse = await fetch(
      `${Deno.env.get('SUPABASE_URL')}/rest/v1/email_otps`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          'apikey': Deno.env.get('SUPABASE_ANON_KEY') || '',
        },
        body: JSON.stringify({
          email,
          otp_code: otp,
          expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes
          used: false
        })
      }
    );

    if (!supabaseResponse.ok) {
      const error = await supabaseResponse.text();
      console.error("Database error:", error);
      throw new Error("Failed to store OTP");
    }

    // Initialize Resend
    const resend = new Resend(RESEND_API_KEY);

    // Send email with OTP using Resend
    const subject = type === 'registration' 
      ? `Verify your email for ${tenantName || 'LoanSpur'} registration`
      : 'Email verification code';

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #1e40af; margin: 0;">LoanSpur</h1>
          <p style="color: #64748b; margin: 5px 0;">Core Banking System</p>
        </div>
        
        <div style="background: #f8fafc; border-radius: 8px; padding: 30px; text-align: center;">
          <h2 style="color: #334155; margin-bottom: 20px;">Email Verification</h2>
          <p style="color: #64748b; margin-bottom: 30px;">
            ${type === 'registration' 
              ? `Complete your registration for ${tenantName || 'your organization'} by entering this verification code:`
              : 'Please use the following verification code:'
            }
          </p>
          
          <div style="background: white; border: 2px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0; display: inline-block;">
            <span style="font-size: 32px; font-weight: bold; color: #1e40af; letter-spacing: 4px;">${otp}</span>
          </div>
          
          <p style="color: #64748b; font-size: 14px; margin-top: 20px;">
            This code will expire in 10 minutes.
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 30px; color: #94a3b8; font-size: 12px;">
          <p>If you didn't request this verification code, please ignore this email.</p>
        </div>
      </div>
    `;

    // Send email via Resend
    const emailResponse = await resend.emails.send({
      from: `LoanSpur <${RESEND_EMAIL_FROM}>`,
      to: [email],
      subject: subject,
      html: htmlContent,
    });

    if (emailResponse.error) {
      console.error("Resend error:", emailResponse.error);
      throw new Error(`Failed to send email via Resend: ${emailResponse.error.message}`);
    }

    console.log("Email sent successfully via Resend:", emailResponse.data);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "OTP sent successfully" 
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
    console.error("Error in send-otp-email function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Failed to send OTP email" 
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