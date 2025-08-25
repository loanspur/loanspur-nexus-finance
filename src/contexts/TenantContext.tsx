import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getCurrentSubdomain } from '@/utils/tenant';
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";

interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  domain: string;
  status: 'active' | 'suspended' | 'cancelled'; 
  settings: any;
  created_at: string;
  updated_at: string;
}

interface TenantContextType {
  currentTenant: Tenant | null;
  loading: boolean;
  error: string | null;
  isSubdomainTenant: boolean;
  refreshTenant: () => Promise<void>;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubdomainTenant, setIsSubdomainTenant] = useState(false);

  const fetchTenant = async (subdomain: string) => {
    try {
      setLoading(true);
      setError(null);

      // Enhanced subdomain validation
      if (!subdomain || subdomain.length < 2) {
        setError('Invalid subdomain');
        setIsSubdomainTenant(false);
        return;
      }

      // Check if subdomain is reserved
      const reservedSubdomains = ['www', 'api', 'admin', 'mail', 'ftp', 'smtp', 'pop', 'imap'];
      if (reservedSubdomains.includes(subdomain.toLowerCase())) {
        setError('Reserved subdomain');
        setIsSubdomainTenant(false);
        return;
      }

      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .select('*')
        .eq('subdomain', subdomain.toLowerCase())
        .eq('status', 'active')
        .single();

      if (tenantError) {
        console.error('Tenant fetch error:', tenantError);
        setError(tenantError.message);
        setIsSubdomainTenant(false);
        return;
      }

      if (!tenant) {
        setError('Tenant not found');
        setIsSubdomainTenant(false);
        return;
      }

      setCurrentTenant(tenant);
      setIsSubdomainTenant(true);
      
      // Debug logging
      if (import.meta.env.DEV) {
        console.log('Tenant loaded:', {
          subdomain,
          tenant: tenant.name,
          isSubdomainTenant: true
        });
      }

    } catch (err) {
      console.error('Error fetching tenant:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setIsSubdomainTenant(false);
    } finally {
      setLoading(false);
    }
  };

  const refreshTenant = async () => {
    const subdomain = getCurrentSubdomain();
    if (subdomain) {
      await fetchTenant(subdomain);
    }
  };

  useEffect(() => {
    const subdomain = getCurrentSubdomain();
    
    // Debug logging
    if (import.meta.env.DEV) {
      console.log('TenantContext - Subdomain detected:', subdomain);
    }

    if (subdomain) {
      setIsSubdomainTenant(true);
      fetchTenant(subdomain);
    } else {
      setIsSubdomainTenant(false);
      setLoading(false);
    }
  }, []);

  // Listen for subdomain changes (for development/testing)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'current_subdomain') {
        const newSubdomain = e.newValue;
        if (newSubdomain) {
          fetchTenant(newSubdomain);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <TenantContext.Provider value={{
      currentTenant,
      loading,
      error,
      isSubdomainTenant,
      refreshTenant
    }}>
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};

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

export interface NotificationEvent {
  type: string;
  payload: any;
  timestamp: string;
  tenant_id: string;
}

export interface NotificationTemplate {
  id: string;
  name: string;
  description: string;
  event_type: string;
  title_template: string;
  message_template: string;
  variables: string[];
  is_active: boolean;
  priority: 'low' | 'normal' | 'high' | 'urgent';
}

// Event bus for internal notifications
class NotificationEventBus {
  private listeners: Map<string, Function[]> = new Map();

  subscribe(eventType: string, callback: Function) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType)!.push(callback);
  }

  unsubscribe(eventType: string, callback: Function) {
    const callbacks = this.listeners.get(eventType);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  emit(eventType: string, payload: any) {
    const callbacks = this.listeners.get(eventType);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(payload);
        } catch (error) {
          console.error('Error in notification event callback:', error);
        }
      });
    }
  }
}

// Global event bus instance
const eventBus = new NotificationEventBus();

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [recentEvents, setRecentEvents] = useState<NotificationEvent[]>([]);
  const { profile } = useAuth();
  const { toast } = useToast();

  const fetchNotifications = async () => {
    if (!profile) return;

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select(`
          *,
          sender:profiles!notifications_sender_id_fkey(
            first_name,
            last_name,
            email
          )
        `)
        .or(`is_global.eq.true,recipient_id.eq.${profile.id}`)
        .eq('tenant_id', profile.tenant_id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const validNotifications = (data || []).filter(notification => {
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

  const fetchTemplates = async () => {
    if (!profile) return;

    try {
      const { data, error } = await supabase
        .from('notification_templates')
        .select('*')
        .eq('tenant_id', profile.tenant_id)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setTemplates(data || []);
    } catch (error: any) {
      console.error('Error fetching notification templates:', error);
    }
  };

  const subscribeToEvent = (eventType: string, callback: Function) => {
    eventBus.subscribe(eventType, callback);
    return () => eventBus.unsubscribe(eventType, callback);
  };

  const emitEvent = (eventType: string, payload: any) => {
    const event: NotificationEvent = {
      type: eventType,
      payload,
      timestamp: new Date().toISOString(),
      tenant_id: profile?.tenant_id || '',
    };

    // Add to recent events for debugging
    setRecentEvents(prev => [event, ...prev.slice(0, 9)]);

    // Emit to event bus
    eventBus.emit(eventType, event);

    // Process event and create notification if template exists
    processEventForNotification(event);
  };

  const processEventForNotification = async (event: NotificationEvent) => {
    if (!profile) return;

    try {
      // Find matching template
      const template = templates.find(t => t.event_type === event.type);
      if (!template) return;

      // Process template variables
      const title = processTemplate(template.title_template, event.payload);
      const message = processTemplate(template.message_template, event.payload);

      // Create notification
      await createNotification({
        title,
        message,
        type: 'info',
        priority: template.priority,
        is_global: false,
        metadata: {
          event_type: event.type,
          template_id: template.id,
          event_payload: event.payload,
        },
      });
    } catch (error) {
      console.error('Error processing event for notification:', error);
    }
  };

  const processTemplate = (template: string, data: any): string => {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return data[key] || match;
    });
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

      // Emit read event
      emitEvent('notification:read', { notification_id: notificationId });
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

      // Emit bulk read event
      emitEvent('notification:bulk_read', { 
        count: unreadNotifications.length,
        notification_ids: unreadNotifications.map(n => n.id)
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
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          tenant_id: profile.tenant_id,
          sender_id: profile.id,
          ...notification,
        })
        .select()
        .single();

      if (error) throw error;

      // Add to local state
      setNotifications(prev => [data, ...prev]);
      if (!data.is_read) {
        setUnreadCount(prev => prev + 1);
      }

      // Emit creation event
      emitEvent('notification:created', { notification: data });

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

      // Emit deletion event
      emitEvent('notification:deleted', { notification_id: notificationId });
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
      fetchTemplates();
    }
  }, [profile]);

  // Set up real-time subscription with event emission
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
          filter: `tenant_id=eq.${profile.tenant_id}`,
        },
        (payload) => {
          console.log('Notification created:', payload);
          emitEvent('notification:realtime_created', payload.new);
          fetchNotifications();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `tenant_id=eq.${profile.tenant_id}`,
        },
        (payload) => {
          console.log('Notification updated:', payload);
          emitEvent('notification:realtime_updated', payload.new);
          fetchNotifications();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'notifications',
          filter: `tenant_id=eq.${profile.tenant_id}`,
        },
        (payload) => {
          console.log('Notification deleted:', payload);
          emitEvent('notification:realtime_deleted', payload.old);
          fetchNotifications();
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
    templates,
    recentEvents,
    markAsRead,
    markAllAsRead,
    createNotification,
    deleteNotification,
    subscribeToEvent,
    emitEvent,
    refetch: fetchNotifications,
  };
};