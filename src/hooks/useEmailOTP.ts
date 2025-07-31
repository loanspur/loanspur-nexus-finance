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
      // Call edge function to verify OTP
      const { data: result, error } = await supabase.functions.invoke('verify-otp', {
        body: data
      });

      if (error) {
        throw new Error(error.message || 'Failed to verify OTP');
      }

      if (!result?.success) {
        throw new Error(result?.message || 'Invalid or expired verification code');
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