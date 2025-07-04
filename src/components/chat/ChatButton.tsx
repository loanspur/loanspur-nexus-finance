import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useChat } from "@/hooks/useChat";
import { ChatWindow } from "./ChatWindow";

export const ChatButton = () => {
  const [open, setOpen] = useState(false);
  const { chatRooms } = useChat();

  // Calculate total unread messages across all rooms
  const unreadCount = chatRooms.reduce((total, room) => total + (room.unread_count || 0), 0);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <MessageCircle className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <ChatWindow onClose={() => setOpen(false)} />
      </PopoverContent>
    </Popover>
  );
};