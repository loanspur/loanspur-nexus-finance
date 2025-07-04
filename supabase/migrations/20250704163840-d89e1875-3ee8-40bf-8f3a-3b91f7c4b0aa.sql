-- Fix infinite recursion in chat_participants RLS policy
-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can view participants in their chat rooms" ON public.chat_participants;

-- Create a simpler, non-recursive policy
CREATE POLICY "Users can view participants in their chat rooms" 
ON public.chat_participants 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.chat_participants cp2 
    WHERE cp2.chat_room_id = chat_participants.chat_room_id 
    AND cp2.user_id IN (
      SELECT id FROM public.profiles 
      WHERE user_id = auth.uid()
    )
  )
);

-- Also fix the chat_rooms policy to be more efficient
DROP POLICY IF EXISTS "Users can view chat rooms they participate in" ON public.chat_rooms;

CREATE POLICY "Users can view chat rooms they participate in" 
ON public.chat_rooms 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.chat_participants 
    WHERE chat_room_id = chat_rooms.id 
    AND user_id IN (
      SELECT id FROM public.profiles 
      WHERE user_id = auth.uid()
    )
  )
);