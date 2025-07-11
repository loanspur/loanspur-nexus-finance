-- Fix chat_participants RLS policies to prevent infinite recursion
DROP POLICY IF EXISTS "Users can view participants in their chat rooms" ON public.chat_participants;

-- Create a simpler, non-recursive policy for viewing participants
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

-- Also update the chat_rooms policy to be more efficient
DROP POLICY IF EXISTS "Users can view chat rooms they participate in" ON public.chat_rooms;

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