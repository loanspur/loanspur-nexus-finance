import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "@/hooks/use-toast";

export interface NotificationTemplate {
  id: string;
  tenant_id: string;
  name: string;
  type: 'sms' | 'email' | 'whatsapp' | 'in_app';
  trigger_event: string;
  subject?: string;
  message: string;
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface NotificationHistory {
  id: string;
  tenant_id: string;
  template_id?: string;
  recipient_id?: string;
  recipient_contact: string;
  type: 'sms' | 'email' | 'whatsapp' | 'in_app';
  subject?: string;
  message: string;
  status: 'pending' | 'sent' | 'failed' | 'delivered';
  sent_at?: string;
  delivered_at?: string;
  error_message?: string;
  campaign_id?: string;
  created_at: string;
}

export interface NotificationCampaign {
  id: string;
  tenant_id: string;
  name: string;
  type: 'sms' | 'email' | 'whatsapp' | 'in_app';
  target_audience: string;
  subject?: string;
  message: string;
  scheduled_at?: string;
  sent_at?: string;
  total_recipients: number;
  successful_sends: number;
  failed_sends: number;
  status: 'draft' | 'scheduled' | 'sending' | 'completed' | 'failed';
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export const useNotifications = () => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);

  // Template Management
  const fetchTemplates = async (): Promise<NotificationTemplate[]> => {
    if (!profile?.tenant_id) return [];
    
    const { data, error } = await supabase
      .from('notification_templates')
      .select('*')
      .eq('tenant_id', profile.tenant_id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching templates:', error);
      toast({
        title: "Error",
        description: "Failed to fetch notification templates",
        variant: "destructive",
      });
      return [];
    }

    return (data || []) as NotificationTemplate[];
  };

  const createTemplate = async (template: Omit<NotificationTemplate, 'id' | 'tenant_id' | 'created_at' | 'updated_at' | 'created_by'>): Promise<NotificationTemplate | null> => {
    if (!profile?.tenant_id || !profile?.id) return null;
    
    setLoading(true);
    
    const { data, error } = await supabase
      .from('notification_templates')
      .insert({
        ...template,
        tenant_id: profile.tenant_id,
        created_by: profile.id
      })
      .select()
      .single();

    setLoading(false);

    if (error) {
      console.error('Error creating template:', error);
      toast({
        title: "Error",
        description: "Failed to create notification template",
        variant: "destructive",
      });
      return null;
    }

    toast({
      title: "Success",
      description: "Notification template created successfully",
    });

    return data as NotificationTemplate;
  };

  const updateTemplate = async (id: string, updates: Partial<NotificationTemplate>): Promise<boolean> => {
    setLoading(true);
    
    const { error } = await supabase
      .from('notification_templates')
      .update(updates)
      .eq('id', id);

    setLoading(false);

    if (error) {
      console.error('Error updating template:', error);
      toast({
        title: "Error",
        description: "Failed to update notification template",
        variant: "destructive",
      });
      return false;
    }

    toast({
      title: "Success",
      description: "Notification template updated successfully",
    });

    return true;
  };

  // Campaign Management
  const fetchCampaigns = async (): Promise<NotificationCampaign[]> => {
    if (!profile?.tenant_id) return [];
    
    const { data, error } = await supabase
      .from('notification_campaigns')
      .select('*')
      .eq('tenant_id', profile.tenant_id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching campaigns:', error);
      toast({
        title: "Error",
        description: "Failed to fetch notification campaigns",
        variant: "destructive",
      });
      return [];
    }

    return (data || []) as NotificationCampaign[];
  };

  const createCampaign = async (campaign: Omit<NotificationCampaign, 'id' | 'tenant_id' | 'created_at' | 'updated_at' | 'created_by' | 'total_recipients' | 'successful_sends' | 'failed_sends'>): Promise<NotificationCampaign | null> => {
    if (!profile?.tenant_id || !profile?.id) return null;
    
    setLoading(true);
    
    const { data, error } = await supabase
      .from('notification_campaigns')
      .insert({
        ...campaign,
        tenant_id: profile.tenant_id,
        created_by: profile.id
      })
      .select()
      .single();

    setLoading(false);

    if (error) {
      console.error('Error creating campaign:', error);
      toast({
        title: "Error",
        description: "Failed to create notification campaign",
        variant: "destructive",
      });
      return null;
    }

    toast({
      title: "Success",
      description: "Notification campaign created successfully",
    });

    return data as NotificationCampaign;
  };

  // History Management
  const fetchHistory = async (): Promise<NotificationHistory[]> => {
    if (!profile?.tenant_id) return [];
    
    const { data, error } = await supabase
      .from('notification_history')
      .select(`
        *,
        notification_templates(name),
        clients(first_name, last_name)
      `)
      .eq('tenant_id', profile.tenant_id)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Error fetching history:', error);
      toast({
        title: "Error",
        description: "Failed to fetch notification history",
        variant: "destructive",
      });
      return [];
    }

    return (data || []) as NotificationHistory[];
  };

  const sendNotification = async (
    type: 'sms' | 'email' | 'whatsapp' | 'in_app',
    recipient: string,
    message: string,
    subject?: string,
    recipientId?: string,
    templateId?: string
  ): Promise<boolean> => {
    if (!profile?.tenant_id) return false;
    
    setLoading(true);
    
    // Create notification history entry
    const { error } = await supabase
      .from('notification_history')
      .insert({
        tenant_id: profile.tenant_id,
        template_id: templateId,
        recipient_id: recipientId,
        recipient_contact: recipient,
        type,
        subject,
        message,
        status: 'sent',
        sent_at: new Date().toISOString()
      });

    setLoading(false);

    if (error) {
      console.error('Error sending notification:', error);
      toast({
        title: "Error",
        description: "Failed to send notification",
        variant: "destructive",
      });
      return false;
    }

    toast({
      title: "Success",
      description: "Notification sent successfully",
    });

    return true;
  };

  return {
    loading,
    fetchTemplates,
    createTemplate,
    updateTemplate,
    fetchCampaigns,
    createCampaign,
    fetchHistory,
    sendNotification
  };
};