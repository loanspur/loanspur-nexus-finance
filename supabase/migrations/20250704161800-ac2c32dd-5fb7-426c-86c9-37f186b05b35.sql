-- Create notifications table for in-app communication
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error', 'announcement')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  is_read BOOLEAN NOT NULL DEFAULT false,
  is_global BOOLEAN NOT NULL DEFAULT false,
  action_url TEXT,
  action_label TEXT,
  metadata JSONB DEFAULT '{}',
  expires_at TIMESTAMP WITH TIME ZONE,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create notification preferences table
CREATE TABLE public.notification_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL,
  email_enabled BOOLEAN NOT NULL DEFAULT true,
  in_app_enabled BOOLEAN NOT NULL DEFAULT true,
  push_enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, notification_type)
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- RLS policies for notifications
CREATE POLICY "Users can view their own notifications or global ones" 
ON public.notifications 
FOR SELECT 
USING (
  is_global = true OR 
  recipient_id IN (
    SELECT id FROM public.profiles 
    WHERE user_id = auth.uid()
  ) OR
  tenant_id IN (
    SELECT tenant_id FROM public.profiles 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can create notifications for their tenant" 
ON public.notifications 
FOR INSERT 
WITH CHECK (
  tenant_id IN (
    SELECT tenant_id FROM public.profiles 
    WHERE user_id = auth.uid()
  ) AND
  sender_id IN (
    SELECT id FROM public.profiles 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own notifications" 
ON public.notifications 
FOR UPDATE 
USING (
  recipient_id IN (
    SELECT id FROM public.profiles 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Super admins can manage all notifications" 
ON public.notifications 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE user_id = auth.uid() AND role = 'super_admin'
));

-- RLS policies for notification preferences
CREATE POLICY "Users can manage their own notification preferences" 
ON public.notification_preferences 
FOR ALL 
USING (user_id IN (
  SELECT id FROM public.profiles 
  WHERE user_id = auth.uid()
));

-- Add triggers for updated_at
CREATE TRIGGER update_notifications_updated_at
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Set replica identity for realtime updates
ALTER TABLE public.notifications REPLICA IDENTITY FULL;

-- Insert some sample notifications
INSERT INTO public.notifications (tenant_id, recipient_id, sender_id, title, message, type, priority, is_global) 
SELECT 
  t.id,
  NULL,
  NULL,
  'Welcome to the System',
  'Welcome to our microfinance platform! Get started by exploring the dashboard.',
  'announcement',
  'normal',
  true
FROM public.tenants t
LIMIT 1;

INSERT INTO public.notifications (tenant_id, title, message, type, priority, is_global) 
VALUES 
  ((SELECT id FROM public.tenants LIMIT 1), 'System Maintenance', 'Scheduled maintenance will occur tonight at 2 AM EAT', 'warning', 'high', true),
  ((SELECT id FROM public.tenants LIMIT 1), 'New Feature Available', 'M-Pesa integration is now live! Configure your credentials in settings.', 'info', 'normal', true);