-- Create security definer function to get user's chat room IDs
CREATE OR REPLACE FUNCTION public.get_user_chat_room_ids()
RETURNS TABLE(chat_room_id UUID)
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT cp.chat_room_id 
  FROM public.chat_participants cp
  JOIN public.profiles p ON cp.user_id = p.id
  WHERE p.user_id = auth.uid();
$$;

-- Drop and recreate the chat_participants policy using the function
DROP POLICY IF EXISTS "Users can view participants in their chat rooms" ON public.chat_participants;

CREATE POLICY "Users can view participants in their chat rooms" 
ON public.chat_participants 
FOR SELECT 
USING (chat_room_id IN (SELECT chat_room_id FROM public.get_user_chat_room_ids()));

-- Also fix the chat_rooms policy
DROP POLICY IF EXISTS "Users can view chat rooms they participate in" ON public.chat_rooms;

CREATE POLICY "Users can view chat rooms they participate in" 
ON public.chat_rooms 
FOR SELECT 
USING (id IN (SELECT chat_room_id FROM public.get_user_chat_room_ids()));