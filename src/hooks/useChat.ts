import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";

export interface ChatRoom {
  id: string;
  tenant_id: string;
  name?: string;
  type: 'direct' | 'group' | 'announcement';
  description?: string;
  is_active: boolean;
  last_message_at?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  participants?: ChatParticipant[];
  unread_count?: number;
}

export interface ChatParticipant {
  id: string;
  chat_room_id: string;
  user_id: string;
  role: 'admin' | 'moderator' | 'member';
  joined_at: string;
  last_read_at?: string;
  is_muted: boolean;
  profile?: {
    first_name: string;
    last_name: string;
    email: string;
    avatar_url?: string;
  };
}

export interface ChatMessage {
  id: string;
  chat_room_id: string;
  sender_id: string;
  message_text: string;
  message_type: 'text' | 'image' | 'file' | 'system';
  file_url?: string;
  file_name?: string;
  file_size?: number;
  reply_to_message_id?: string;
  is_edited: boolean;
  edited_at?: string;
  created_at: string;
  updated_at: string;
  sender?: {
    first_name: string;
    last_name: string;
    email: string;
    avatar_url?: string;
  };
}

export const useChat = () => {
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [currentRoom, setCurrentRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();
  const { toast } = useToast();

  const fetchChatRooms = async () => {
    if (!profile) return;

    try {
      const { data, error } = await supabase
        .from('chat_rooms')
        .select(`
          *,
          participants:chat_participants(*)
        `)
        .eq('is_active', true)
        .order('last_message_at', { ascending: false, nullsFirst: false });

      if (error) throw error;

      const roomsWithTyping = (data || []).map(room => ({
        ...room,
        type: room.type as ChatRoom['type'],
        participants: room.participants?.map((p: any) => ({
          ...p,
          role: p.role as ChatParticipant['role'],
        })),
      }));

      setChatRooms(roomsWithTyping);
    } catch (error: any) {
      console.error('Error fetching chat rooms:', error);
      toast({
        title: "Error",
        description: "Failed to load chat rooms",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (roomId: string) => {
    if (!profile) return;

    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('chat_room_id', roomId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const messagesWithTyping = (data || []).map(message => ({
        ...message,
        message_type: message.message_type as ChatMessage['message_type'],
      }));

      setMessages(messagesWithTyping);
    } catch (error: any) {
      console.error('Error fetching messages:', error);
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive",
      });
    }
  };

  const sendMessage = async (roomId: string, messageText: string) => {
    if (!profile || !messageText.trim()) return;

    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          chat_room_id: roomId,
          sender_id: profile.id,
          message_text: messageText.trim(),
        });

      if (error) throw error;

      // Update room's last message time
      await supabase
        .from('chat_rooms')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', roomId);

    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    }
  };

  const createDirectChat = async (recipientId: string) => {
    if (!profile?.tenant_id) return;

    try {
      // Check if direct chat already exists between these two users
      const { data: existingRooms } = await supabase
        .from('chat_rooms')
        .select(`
          id,
          participants:chat_participants(user_id)
        `)
        .eq('type', 'direct')
        .eq('tenant_id', profile.tenant_id);

      const directRoom = existingRooms?.find(room => {
        const participantIds = room.participants?.map((p: any) => p.user_id) || [];
        return participantIds.includes(profile.id) && participantIds.includes(recipientId);
      });

      if (directRoom) {
        return directRoom.id;
      }

      // Create new direct chat room
      const { data: newRoom, error: roomError } = await supabase
        .from('chat_rooms')
        .insert({
          tenant_id: profile.tenant_id,
          type: 'direct',
          created_by: profile.id,
        })
        .select()
        .single();

      if (roomError) throw roomError;

      // Add participants
      const { error: participantsError } = await supabase
        .from('chat_participants')
        .insert([
          { chat_room_id: newRoom.id, user_id: profile.id, role: 'admin' },
          { chat_room_id: newRoom.id, user_id: recipientId, role: 'member' },
        ]);

      if (participantsError) throw participantsError;

      fetchChatRooms(); // Refresh rooms
      return newRoom.id;

    } catch (error: any) {
      console.error('Error creating direct chat:', error);
      toast({
        title: "Error",
        description: "Failed to create chat",
        variant: "destructive",
      });
    }
  };

  const joinRoom = (room: ChatRoom) => {
    setCurrentRoom(room);
    fetchMessages(room.id);
  };

  useEffect(() => {
    if (profile) {
      fetchChatRooms();
    }
  }, [profile]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!profile) return;

    const messagesChannel = supabase
      .channel('chat_messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_messages',
        },
        (payload) => {
          console.log('Message update:', payload);
          if (currentRoom && payload.new && (payload.new as any).chat_room_id === currentRoom.id) {
            fetchMessages(currentRoom.id);
          }
          fetchChatRooms(); // Update room list
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
    };
  }, [profile, currentRoom]);

  return {
    chatRooms,
    currentRoom,
    messages,
    loading,
    sendMessage,
    createDirectChat,
    joinRoom,
    refetch: fetchChatRooms,
  };
};