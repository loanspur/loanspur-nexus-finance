import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VerifyOTPRequest {
  email: string;
  otpCode: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, otpCode }: VerifyOTPRequest = await req.json();

    if (!email || !otpCode) {
      throw new Error("Email and OTP code are required");
    }

    // Initialize Supabase client with service role key
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Check if OTP exists and is valid
    const { data: otpRecord, error } = await supabase
      .from('email_otps')
      .select('*')
      .eq('email', email)
      .eq('otp_code', otpCode)
      .eq('used', false)
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Database error:", error);
      throw new Error('Failed to verify OTP');
    }

    if (!otpRecord) {
      throw new Error('Invalid or expired verification code');
    }

    // Mark OTP as used
    const { error: updateError } = await supabase
      .from('email_otps')
      .update({ used: true })
      .eq('id', otpRecord.id);

    if (updateError) {
      console.warn('Failed to mark OTP as used:', updateError);
    }

    console.log("OTP verified successfully for email:", email);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "OTP verified successfully" 
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
    console.error("Error in verify-otp function:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        message: error.message || "Failed to verify OTP" 
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