-- Fix infinite recursion in chat_participants RLS policy by using security definer function
-- Drop the problematic policy that still has recursion issues
DROP POLICY IF EXISTS "Users can view participants in their chat rooms" ON public.chat_participants;

-- Create a security definer function to get user's profile ID
CREATE OR REPLACE FUNCTION public.get_current_user_profile_id()
RETURNS UUID AS $$
  SELECT id FROM public.profiles WHERE user_id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Create a much simpler policy using the security definer function
CREATE POLICY "Users can view participants in their chat rooms" 
ON public.chat_participants 
FOR SELECT 
USING (
  -- Check if user is a participant in the same chat room using a simple EXISTS
  EXISTS (
    SELECT 1 FROM public.chat_participants cp2 
    WHERE cp2.chat_room_id = chat_participants.chat_room_id 
    AND cp2.user_id = public.get_current_user_profile_id()
  )
);