import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VerifyResetRequest {
  email: string;
  token: string;
  newPassword: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, token, newPassword }: VerifyResetRequest = await req.json();

    if (!email || !token || !newPassword) {
      throw new Error("Email, token, and new password are required");
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Verify the token
    const { data: tokenRecord, error: tokenError } = await supabase
      .from('password_reset_tokens')
      .select('*')
      .eq('email', email)
      .eq('token', token)
      .eq('used', false)
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (tokenError) {
      console.error("Database error:", tokenError);
      throw new Error('Failed to verify reset token');
    }

    if (!tokenRecord) {
      throw new Error('Invalid or expired reset token');
    }

    // Get the user by email
    const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
    
    if (userError) {
      console.error("Error fetching users:", userError);
      throw new Error('Failed to find user');
    }

    const user = userData.users.find(u => u.email === email);
    if (!user) {
      throw new Error('User not found');
    }

    // Update the user's password
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      { password: newPassword }
    );

    if (updateError) {
      console.error("Error updating password:", updateError);
      throw new Error('Failed to update password');
    }

    // Mark token as used
    const { error: markUsedError } = await supabase
      .from('password_reset_tokens')
      .update({ used: true })
      .eq('id', tokenRecord.id);

    if (markUsedError) {
      console.warn('Failed to mark token as used:', markUsedError);
    }

    console.log("Password reset successfully for:", email);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Password reset successfully" 
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
    console.error("Error in verify-password-reset-otp function:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        message: error.message || "Failed to reset password" 
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