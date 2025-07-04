import { useState } from "react";
import { format } from "date-fns";
import { Send, ArrowLeft, Users, User, X, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useChat, type ChatRoom } from "@/hooks/useChat";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface ChatWindowProps {
  onClose?: () => void;
}

export const ChatWindow = ({ onClose }: ChatWindowProps) => {
  const [messageText, setMessageText] = useState("");
  const { chatRooms, currentRoom, messages, loading, sendMessage, joinRoom } = useChat();
  const { profile } = useAuth();

  const handleSendMessage = async () => {
    if (!currentRoom || !messageText.trim()) return;
    
    await sendMessage(currentRoom.id, messageText);
    setMessageText("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getRoomDisplayName = (room: ChatRoom) => {
    if (room.type === 'direct') {
      const otherParticipant = room.participants?.find(p => p.user_id !== profile?.id);
      if (otherParticipant?.profile) {
        return `${otherParticipant.profile.first_name} ${otherParticipant.profile.last_name}`.trim() || otherParticipant.profile.email;
      }
    }
    return room.name || 'Chat Room';
  };

  const getRoomAvatar = (room: ChatRoom) => {
    if (room.type === 'direct') {
      const otherParticipant = room.participants?.find(p => p.user_id !== profile?.id);
      return otherParticipant?.profile?.avatar_url || '';
    }
    return '';
  };

  const getInitials = (firstName?: string, lastName?: string, email?: string) => {
    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    }
    return email?.charAt(0).toUpperCase() || 'U';
  };

  if (loading) {
    return (
      <div className="w-full h-96 flex items-center justify-center">
        <div className="text-sm text-muted-foreground">Loading chats...</div>
      </div>
    );
  }

  return (
    <div className="w-full h-96 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          {currentRoom && (
            <Button variant="ghost" size="sm" onClick={() => joinRoom(null!)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <h3 className="font-semibold">
            {currentRoom ? getRoomDisplayName(currentRoom) : 'Messages'}
          </h3>
        </div>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {!currentRoom ? (
        /* Chat Rooms List */
        <ScrollArea className="flex-1">
          {chatRooms.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <MessageCircle className="h-12 w-12 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No conversations yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Start a conversation with your team members
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {chatRooms.map((room) => (
                <div
                  key={room.id}
                  className="p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => joinRoom(room)}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={getRoomAvatar(room)} />
                      <AvatarFallback>
                        {room.type === 'group' ? (
                          <Users className="h-4 w-4" />
                        ) : (
                          <User className="h-4 w-4" />
                        )}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium truncate">
                          {getRoomDisplayName(room)}
                        </h4>
                        {room.last_message_at && (
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(room.last_message_at), 'MMM dd')}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-sm text-muted-foreground">
                          {room.type === 'direct' ? 'Direct message' : `${room.participants?.length || 0} members`}
                        </p>
                        {room.unread_count && room.unread_count > 0 && (
                          <Badge variant="destructive" className="text-xs">
                            {room.unread_count}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      ) : (
        /* Messages View */
        <>
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((message) => {
                const isOwnMessage = message.sender_id === profile?.id;
                return (
                  <div
                    key={message.id}
                    className={cn(
                      "flex gap-3",
                      isOwnMessage && "flex-row-reverse"
                    )}
                  >
                    {!isOwnMessage && (
                      <Avatar className="h-8 w-8 mt-1">
                        <AvatarImage src={message.sender?.avatar_url || ''} />
                        <AvatarFallback className="text-xs">
                          {getInitials(
                            message.sender?.first_name,
                            message.sender?.last_name,
                            message.sender?.email
                          )}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    
                    <div className={cn("flex-1 max-w-[80%]", isOwnMessage && "flex flex-col items-end")}>
                      {!isOwnMessage && (
                        <div className="text-xs font-medium mb-1">
                          {message.sender?.first_name && message.sender?.last_name
                            ? `${message.sender.first_name} ${message.sender.last_name}`
                            : message.sender?.email
                          }
                        </div>
                      )}
                      
                      <div
                        className={cn(
                          "rounded-lg px-3 py-2 text-sm break-words",
                          isOwnMessage
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        )}
                      >
                        {message.message_text}
                      </div>
                      
                      <div className="text-xs text-muted-foreground mt-1">
                        {format(new Date(message.created_at), 'HH:mm')}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>

          {/* Message Input */}
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Input
                placeholder="Type a message..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!messageText.trim()}
                size="sm"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};