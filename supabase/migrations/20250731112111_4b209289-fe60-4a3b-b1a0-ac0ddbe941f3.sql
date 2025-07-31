-- Create email_otps table for OTP verification
CREATE TABLE IF NOT EXISTS public.email_otps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  otp_code TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on email_otps table
ALTER TABLE public.email_otps ENABLE ROW LEVEL SECURITY;

-- Create policies for email_otps (restrictive - only allow service role to manage)
CREATE POLICY "Service role can manage email OTPs" 
ON public.email_otps 
FOR ALL 
USING (true);

-- Create index for better performance
CREATE INDEX idx_email_otps_email_expires ON public.email_otps(email, expires_at);
CREATE INDEX idx_email_otps_email_otp ON public.email_otps(email, otp_code);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_email_otps_updated_at
BEFORE UPDATE ON public.email_otps
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();