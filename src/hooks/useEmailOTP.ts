import { useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SendOTPRequest {
  email: string;
  type: 'registration' | 'verification';
  tenantName?: string;
}

interface VerifyOTPRequest {
  email: string;
  otpCode: string;
}

export const useEmailOTP = () => {
  const { toast } = useToast();

  const sendOTP = useMutation({
    mutationFn: async (data: SendOTPRequest) => {
      const { data: result, error } = await supabase.functions.invoke('send-otp-email', {
        body: data
      });

      if (error) {
        throw new Error(error.message || 'Failed to send OTP');
      }

      return result;
    },
    onSuccess: () => {
      toast({
        title: "Verification Code Sent",
        description: "Please check your email for the verification code.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Send Code",
        description: error.message || "Could not send verification code. Please try again.",
        variant: "destructive",
      });
    },
  });

  const verifyOTP = useMutation({
    mutationFn: async (data: VerifyOTPRequest): Promise<boolean> => {
      // Check if OTP exists and is valid
      const { data: otpRecord, error } = await supabase
        .from('email_otps')
        .select('*')
        .eq('email', data.email)
        .eq('otp_code', data.otpCode)
        .eq('used', false)
        .gte('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
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

      return true;
    },
    onSuccess: () => {
      toast({
        title: "Email Verified",
        description: "Your email has been successfully verified.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Verification Failed",
        description: error.message || "Invalid verification code. Please try again.",
        variant: "destructive",
      });
    },
  });

  return {
    sendOTP,
    verifyOTP,
  };
};