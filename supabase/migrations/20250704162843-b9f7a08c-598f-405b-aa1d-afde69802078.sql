-- Create chat rooms table
CREATE TABLE public.chat_rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT,
  type TEXT NOT NULL DEFAULT 'direct' CHECK (type IN ('direct', 'group', 'announcement')),
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_message_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create chat participants table
CREATE TABLE public.chat_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_room_id UUID NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_read_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_muted BOOLEAN NOT NULL DEFAULT false,
  UNIQUE(chat_room_id, user_id)
);

-- Create chat messages table
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_room_id UUID NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message_text TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system')),
  file_url TEXT,
  file_name TEXT,
  file_size BIGINT,
  reply_to_message_id UUID REFERENCES public.chat_messages(id) ON DELETE SET NULL,
  is_edited BOOLEAN NOT NULL DEFAULT false,
  edited_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create message read receipts table
CREATE TABLE public.message_read_receipts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES public.chat_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  read_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(message_id, user_id)
);

-- Enable RLS on all chat tables
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_read_receipts ENABLE ROW LEVEL SECURITY;

-- RLS policies for chat_rooms
CREATE POLICY "Users can view chat rooms they participate in" 
ON public.chat_rooms 
FOR SELECT 
USING (id IN (
  SELECT chat_room_id FROM public.chat_participants 
  WHERE user_id IN (
    SELECT id FROM public.profiles 
    WHERE user_id = auth.uid()
  )
));

CREATE POLICY "Users can create chat rooms in their tenant" 
ON public.chat_rooms 
FOR INSERT 
WITH CHECK (
  tenant_id IN (
    SELECT tenant_id FROM public.profiles 
    WHERE user_id = auth.uid()
  ) AND
  created_by IN (
    SELECT id FROM public.profiles 
    WHERE user_id = auth.uid()
  )
);

-- RLS policies for chat_participants
CREATE POLICY "Users can view participants in their chat rooms" 
ON public.chat_participants 
FOR SELECT 
USING (chat_room_id IN (
  SELECT chat_room_id FROM public.chat_participants 
  WHERE user_id IN (
    SELECT id FROM public.profiles 
    WHERE user_id = auth.uid()
  )
));

CREATE POLICY "Users can join/leave chat rooms" 
ON public.chat_participants 
FOR ALL 
USING (user_id IN (
  SELECT id FROM public.profiles 
  WHERE user_id = auth.uid()
));

-- RLS policies for chat_messages
CREATE POLICY "Users can view messages in their chat rooms" 
ON public.chat_messages 
FOR SELECT 
USING (chat_room_id IN (
  SELECT chat_room_id FROM public.chat_participants 
  WHERE user_id IN (
    SELECT id FROM public.profiles 
    WHERE user_id = auth.uid()
  )
));

CREATE POLICY "Users can send messages to their chat rooms" 
ON public.chat_messages 
FOR INSERT 
WITH CHECK (
  chat_room_id IN (
    SELECT chat_room_id FROM public.chat_participants 
    WHERE user_id IN (
      SELECT id FROM public.profiles 
      WHERE user_id = auth.uid()
    )
  ) AND
  sender_id IN (
    SELECT id FROM public.profiles 
    WHERE user_id = auth.uid()
  )
);

-- RLS policies for message_read_receipts
CREATE POLICY "Users can manage their own read receipts" 
ON public.message_read_receipts 
FOR ALL 
USING (user_id IN (
  SELECT id FROM public.profiles 
  WHERE user_id = auth.uid()
));

-- Add triggers for updated_at
CREATE TRIGGER update_chat_rooms_updated_at
  BEFORE UPDATE ON public.chat_rooms
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_chat_messages_updated_at
  BEFORE UPDATE ON public.chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for chat messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_participants;

-- Set replica identity for realtime updates
ALTER TABLE public.chat_messages REPLICA IDENTITY FULL;
ALTER TABLE public.chat_participants REPLICA IDENTITY FULL;