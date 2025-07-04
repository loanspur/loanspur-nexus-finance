import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";

export interface Notification {
  id: string;
  tenant_id: string;
  recipient_id?: string;
  sender_id?: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'announcement';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  is_read: boolean;
  is_global: boolean;
  action_url?: string;
  action_label?: string;
  metadata?: any;
  expires_at?: string;
  read_at?: string;
  created_at: string;
  updated_at: string;
  sender?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();
  const { toast } = useToast();

  const fetchNotifications = async () => {
    if (!profile) return;

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .or(`is_global.eq.true,recipient_id.eq.${profile.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const validNotifications = (data || []).filter(notification => {
        // Filter out expired notifications
        if (notification.expires_at) {
          return new Date(notification.expires_at) > new Date();
        }
        return true;
      }).map(notification => ({
        ...notification,
        type: notification.type as Notification['type'],
        priority: notification.priority as Notification['priority'],
      }));

      setNotifications(validNotifications);
      setUnreadCount(validNotifications.filter(n => !n.is_read).length);
    } catch (error: any) {
      console.error('Error fetching notifications:', error);
      toast({
        title: "Error",
        description: "Failed to load notifications",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ 
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, is_read: true, read_at: new Date().toISOString() }
            : notification
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error: any) {
      console.error('Error marking notification as read:', error);
      toast({
        title: "Error",
        description: "Failed to mark notification as read",
        variant: "destructive",
      });
    }
  };

  const markAllAsRead = async () => {
    if (!profile) return;

    try {
      const unreadNotifications = notifications.filter(n => !n.is_read);
      
      const { error } = await supabase
        .from('notifications')
        .update({ 
          is_read: true,
          read_at: new Date().toISOString()
        })
        .in('id', unreadNotifications.map(n => n.id));

      if (error) throw error;

      setNotifications(prev => 
        prev.map(notification => ({ 
          ...notification, 
          is_read: true,
          read_at: notification.read_at || new Date().toISOString()
        }))
      );
      setUnreadCount(0);
    } catch (error: any) {
      console.error('Error marking all notifications as read:', error);
      toast({
        title: "Error",
        description: "Failed to mark all notifications as read",
        variant: "destructive",
      });
    }
  };

  const createNotification = async (notification: {
    title: string;
    message: string;
    type?: Notification['type'];
    priority?: Notification['priority'];
    recipient_id?: string;
    is_global?: boolean;
    action_url?: string;
    action_label?: string;
    expires_at?: string;
  }) => {
    if (!profile?.tenant_id) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          tenant_id: profile.tenant_id,
          sender_id: profile.id,
          ...notification,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Notification sent successfully",
      });
    } catch (error: any) {
      console.error('Error creating notification:', error);
      toast({
        title: "Error",
        description: "Failed to send notification",
        variant: "destructive",
      });
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      setUnreadCount(prev => {
        const notification = notifications.find(n => n.id === notificationId);
        return notification && !notification.is_read ? Math.max(0, prev - 1) : prev;
      });
    } catch (error: any) {
      console.error('Error deleting notification:', error);
      toast({
        title: "Error",
        description: "Failed to delete notification",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (profile) {
      fetchNotifications();
    }
  }, [profile]);

  // Set up real-time subscription
  useEffect(() => {
    if (!profile) return;

    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
        },
        (payload) => {
          console.log('Notification update:', payload);
          fetchNotifications(); // Refetch to get the latest data
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile]);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    createNotification,
    deleteNotification,
    refetch: fetchNotifications,
  };
};