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

export interface NotificationTemplate {
  id: string;
  name: string;
  type: 'sms' | 'email' | 'whatsapp' | 'in_app';
  trigger_event: string;
  subject?: string;
  message: string;
  is_active: boolean;
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
        .select(`
          *,
          sender:profiles!sender_id(first_name, last_name, email)
        `)
        .or(`is_global.eq.true,recipient_id.eq.${profile.id}`)
        .order('created_at', { ascending: false })
        .limit(50);

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
          read_at: new Date().toISOString(),
        })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, is_read: true, read_at: new Date().toISOString() } : n
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
      const { error } = await supabase
        .from('notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .or(`is_global.eq.true,recipient_id.eq.${profile.id}`)
        .eq('is_read', false);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
      );
      setUnreadCount(0);

      toast({
        title: "Success",
        description: "All notifications marked as read",
      });
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
    metadata?: any;
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

  // Event-driven notification creation
  const createEventNotification = async (event: {
    type: 'loan_approved' | 'loan_rejected' | 'loan_disbursed' | 'payment_received' | 'overdue_payment' | 'client_registered' | 'system_alert';
    title: string;
    message: string;
    recipient_id?: string;
    metadata?: any;
  }) => {
    const notificationData = {
      title: event.title,
      message: event.message,
      type: getNotificationTypeForEvent(event.type),
      priority: getPriorityForEvent(event.type),
      recipient_id: event.recipient_id,
      is_global: !event.recipient_id,
      metadata: event.metadata,
      action_url: getActionUrlForEvent(event.type, event.metadata),
      action_label: getActionLabelForEvent(event.type),
    };

    await createNotification(notificationData);
  };

  const getNotificationTypeForEvent = (eventType: string): Notification['type'] => {
    switch (eventType) {
      case 'loan_approved':
      case 'loan_disbursed':
      case 'payment_received':
      case 'client_registered':
        return 'success';
      case 'loan_rejected':
        return 'error';
      case 'overdue_payment':
        return 'warning';
      case 'system_alert':
        return 'info';
      default:
        return 'info';
    }
  };

  const getPriorityForEvent = (eventType: string): Notification['priority'] => {
    switch (eventType) {
      case 'overdue_payment':
      case 'system_alert':
        return 'high';
      case 'loan_approved':
      case 'loan_disbursed':
        return 'normal';
      default:
        return 'normal';
    }
  };

  const getActionUrlForEvent = (eventType: string, metadata?: any): string | undefined => {
    switch (eventType) {
      case 'loan_approved':
      case 'loan_rejected':
      case 'loan_disbursed':
        return metadata?.loan_id ? `/tenant/loans/${metadata.loan_id}` : undefined;
      case 'payment_received':
        return metadata?.transaction_id ? `/tenant/transactions/${metadata.transaction_id}` : undefined;
      case 'client_registered':
        return metadata?.client_id ? `/tenant/clients/${metadata.client_id}` : undefined;
      default:
        return undefined;
    }
  };

  const getActionLabelForEvent = (eventType: string): string | undefined => {
    switch (eventType) {
      case 'loan_approved':
      case 'loan_rejected':
      case 'loan_disbursed':
        return 'View Loan';
      case 'payment_received':
        return 'View Transaction';
      case 'client_registered':
        return 'View Client';
      default:
        return undefined;
    }
  };

  useEffect(() => {
    if (profile) {
      fetchNotifications();
    }
  }, [profile]);

  // Set up real-time subscription for new notifications
  useEffect(() => {
    if (!profile) return;

    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${profile.id}`,
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          setNotifications(prev => [newNotification, ...prev]);
          setUnreadCount(prev => prev + 1);

          // Show toast for high priority notifications
          if (newNotification.priority === 'high' || newNotification.priority === 'urgent') {
            toast({
              title: newNotification.title,
              description: newNotification.message,
              variant: newNotification.type === 'error' ? 'destructive' : 'default',
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${profile.id}`,
        },
        (payload) => {
          const updatedNotification = payload.new as Notification;
          setNotifications(prev =>
            prev.map(n =>
              n.id === updatedNotification.id ? updatedNotification : n
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile, toast]);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    createNotification,
    createEventNotification,
    deleteNotification,
    refresh: fetchNotifications,
  };
};