import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PasswordResetRequest {
  email: string;
  tenantSubdomain?: string;
}

interface VerifyPasswordResetRequest {
  email: string;
  token: string;
  newPassword: string;
}

interface UserInvitationRequest {
  email: string;
  firstName: string;
  lastName: string;
  role: 'tenant_admin' | 'loan_officer' | 'client';
  tenantId: string;
  tenantName: string;
  tenantSubdomain: string;
  invitedBy: string;
}

export const usePasswordReset = () => {
  const { toast } = useToast();

  const sendPasswordResetOTP = useMutation({
    mutationFn: async (data: PasswordResetRequest) => {
      const { data: result, error } = await supabase.functions.invoke('send-password-reset-otp', {
        body: data
      });

      if (error) {
        throw new Error(error.message || 'Failed to send password reset code');
      }

      return result;
    },
    onSuccess: () => {
      toast({
        title: "Password Reset Code Sent",
        description: "Please check your email for the verification code.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Send Reset Code",
        description: error.message || "Could not send password reset code. Please try again.",
        variant: "destructive",
      });
    },
  });

  const verifyPasswordReset = useMutation({
    mutationFn: async (data: VerifyPasswordResetRequest): Promise<boolean> => {
      const { data: result, error } = await supabase.functions.invoke('verify-password-reset-otp', {
        body: data
      });

      if (error) {
        throw new Error(error.message || 'Failed to reset password');
      }

      if (!result?.success) {
        throw new Error(result?.message || 'Invalid verification code');
      }

      return true;
    },
    onSuccess: () => {
      toast({
        title: "Password Reset Successful",
        description: "Your password has been updated successfully. You can now sign in with your new password.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Password Reset Failed",
        description: error.message || "Failed to reset password. Please try again.",
        variant: "destructive",
      });
    },
  });

  const sendUserInvitation = useMutation({
    mutationFn: async (data: UserInvitationRequest) => {
      const { data: result, error } = await supabase.functions.invoke('send-user-invitation', {
        body: data
      });

      if (error) {
        throw new Error(error.message || 'Failed to send invitation');
      }

      return result;
    },
    onSuccess: () => {
      toast({
        title: "Invitation Sent",
        description: "User invitation has been sent successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Send Invitation",
        description: error.message || "Could not send invitation. Please try again.",
        variant: "destructive",
      });
    },
  });

  return {
    sendPasswordResetOTP,
    verifyPasswordReset,
    sendUserInvitation,
  };
};