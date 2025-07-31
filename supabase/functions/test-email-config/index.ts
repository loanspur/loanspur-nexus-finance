import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface TestEmailRequest {
  configId: string;
  testEmail: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { configId, testEmail }: TestEmailRequest = await req.json();

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get email configuration
    const { data: config, error: configError } = await supabase
      .from('email_configurations')
      .select('*')
      .eq('id', configId)
      .single();

    if (configError || !config) {
      throw new Error('Email configuration not found');
    }

    if (!config.is_active) {
      throw new Error('Email configuration is disabled');
    }

    let emailSent = false;

    // Handle different email providers
    switch (config.provider) {
      case 'resend':
        if (!config.api_key_encrypted) {
          throw new Error('Resend API key not configured');
        }
        
        const resend = new Resend(config.api_key_encrypted);
        const resendResponse = await resend.emails.send({
          from: config.from_name ? `${config.from_name} <${config.from_email}>` : config.from_email,
          to: [testEmail],
          subject: "Test Email - Configuration Verification",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">Email Configuration Test</h2>
              <p>This is a test email to verify your email configuration is working correctly.</p>
              <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <h3 style="margin-top: 0;">Configuration Details:</h3>
                <ul style="margin: 0; padding-left: 20px;">
                  <li><strong>Provider:</strong> ${config.provider}</li>
                  <li><strong>From Email:</strong> ${config.from_email}</li>
                  <li><strong>From Name:</strong> ${config.from_name || 'Not set'}</li>
                  <li><strong>Test Date:</strong> ${new Date().toISOString()}</li>
                </ul>
              </div>
              <p>If you received this email, your configuration is working correctly!</p>
              <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
              <p style="color: #666; font-size: 12px;">
                This is an automated test email. Please do not reply to this message.
              </p>
            </div>
          `,
        });

        if (resendResponse.error) {
          throw new Error(`Resend error: ${resendResponse.error.message}`);
        }
        emailSent = true;
        break;

      case 'sendgrid':
        // Implement SendGrid logic here
        throw new Error('SendGrid integration not yet implemented');

      case 'smtp':
        // Implement SMTP logic here
        throw new Error('SMTP integration not yet implemented');

      default:
        throw new Error(`Unsupported email provider: ${config.provider}`);
    }

    // Log the test email activity
    await supabase
      .from('audit_trails')
      .insert({
        tenant_id: config.tenant_id,
        table_name: 'email_configurations',
        record_id: config.id,
        action: 'TEST',
        new_values: {
          test_email: testEmail,
          provider: config.provider,
          success: emailSent,
          timestamp: new Date().toISOString()
        }
      });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Test email sent successfully',
        provider: config.provider
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
    console.error("Error in test-email-config function:", error);
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