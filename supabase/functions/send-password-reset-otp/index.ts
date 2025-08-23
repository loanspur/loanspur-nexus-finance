import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PasswordResetRequest {
  email: string;
  tenantSubdomain?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, tenantSubdomain }: PasswordResetRequest = await req.json();

    if (!email) {
      throw new Error("Email is required");
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store OTP in database (expires in 10 minutes)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    
    const { error: insertError } = await supabase
      .from('password_reset_tokens')
      .insert({
        email,
        token: otpCode,
        expires_at: expiresAt,
      });

    if (insertError) {
      console.error("Database error:", insertError);
      throw new Error('Failed to generate reset code');
    }

    // Initialize Resend
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const resendEmailFrom = Deno.env.get('RESEND_EMAIL_FROM') || 'LoanSpur CBS <noreply@resend.dev>';
    
    if (!resendApiKey) {
      console.error("RESEND_API_KEY environment variable is not set");
      throw new Error('Email service not configured');
    }
    
    const resend = new Resend(resendApiKey);
    
    // Determine the correct domain for reset link
    const baseUrl = tenantSubdomain 
      ? `https://${tenantSubdomain}.loanspurcbs.com` 
      : 'https://loanspurcbs.com';

    const resetUrl = `${baseUrl}/auth/reset-password?token=${otpCode}&email=${encodeURIComponent(email)}`;

    // Send email
    const emailResponse = await resend.emails.send({
      from: resendEmailFrom,
      to: [email],
      subject: "Reset Your Password - LoanSpur CBS",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #1e40af; text-align: center; margin-bottom: 30px;">LoanSpur CBS</h1>
          
          <div style="background-color: #f8fafc; padding: 30px; border-radius: 8px; border-left: 4px solid #1e40af;">
            <h2 style="color: #334155; margin-top: 0;">Password Reset Request</h2>
            <p style="color: #475569; line-height: 1.6;">
              We received a request to reset your password. Use the verification code below to reset your password:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <div style="background-color: #1e40af; color: white; padding: 15px 30px; border-radius: 6px; font-size: 24px; font-weight: bold; letter-spacing: 2px; display: inline-block;">
                ${otpCode}
              </div>
            </div>
            
            <p style="color: #475569; line-height: 1.6;">
              Or click the link below to reset your password directly:
            </p>
            
            <div style="text-align: center; margin: 20px 0;">
              <a href="${resetUrl}" style="background-color: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Reset Password
              </a>
            </div>
            
            <p style="color: #64748b; font-size: 14px; margin-top: 30px;">
              This code will expire in 10 minutes. If you didn't request this password reset, please ignore this email.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; color: #94a3b8; font-size: 12px;">
            <p>© 2024 LoanSpur CBS. All rights reserved.</p>
          </div>
        </div>
      `,
    });

    console.log("Password reset email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Password reset code sent successfully" 
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
    console.error("Error in send-password-reset-otp function:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        message: error.message || "Failed to send password reset code" 
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