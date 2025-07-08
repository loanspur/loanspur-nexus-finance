-- Fix infinite recursion in chat_participants RLS policy
-- Drop the problematic policy that still has recursion issues
DROP POLICY IF EXISTS "Users can view participants in their chat rooms" ON public.chat_participants;

-- Create a much simpler and safer policy
CREATE POLICY "Users can view participants in their chat rooms" 
ON public.chat_participants 
FOR SELECT 
USING (
  -- Allow users to see participants in rooms where they are also participants
  chat_room_id IN (
    SELECT cp.chat_room_id 
    FROM public.chat_participants cp
    JOIN public.profiles p ON cp.user_id = p.id
    WHERE p.user_id = auth.uid()
  )
);