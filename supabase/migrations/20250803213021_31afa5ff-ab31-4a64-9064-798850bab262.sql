-- Create password reset tokens table for OTP-based password reset
CREATE TABLE public.password_reset_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  token TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- Create policy for service role access
CREATE POLICY "Service role can manage password reset tokens" 
ON public.password_reset_tokens 
FOR ALL 
USING (true);

-- Create index for performance
CREATE INDEX idx_password_reset_tokens_email ON public.password_reset_tokens(email);
CREATE INDEX idx_password_reset_tokens_token ON public.password_reset_tokens(token);
CREATE INDEX idx_password_reset_tokens_expires_at ON public.password_reset_tokens(expires_at);

-- Add trigger for updated_at
CREATE TRIGGER update_password_reset_tokens_updated_at
  BEFORE UPDATE ON public.password_reset_tokens
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();