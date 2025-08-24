// Notification System Types
// Phase 4: Advanced Features

export interface NotificationTemplate {
  id: string;
  tenant_id: string;
  
  // Template Details
  name: string;
  description: string;
  notification_type: 'email' | 'sms' | 'push' | 'in_app';
  category: 'loan' | 'savings' | 'payment' | 'system' | 'marketing';
  
  // Content
  subject?: string;
  body: string;
  variables: string[]; // Template variables like {{client_name}}
  
  // Settings
  is_active: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  tenant_id: string;
  template_id: string;
  
  // Recipient
  recipient_type: 'client' | 'staff' | 'group';
  recipient_id: string;
  recipient_email?: string;
  recipient_phone?: string;
  
  // Content
  subject?: string;
  body: string;
  notification_type: 'email' | 'sms' | 'push' | 'in_app';
  
  // Status
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'read';
  sent_at?: string;
  delivered_at?: string;
  read_at?: string;
  
  // Metadata
  priority: 'low' | 'medium' | 'high' | 'urgent';
  retry_count: number;
  error_message?: string;
  
  created_at: string;
  updated_at: string;
}

export interface NotificationPreference {
  id: string;
  tenant_id: string;
  user_id: string;
  
  // Preferences
  email_notifications: boolean;
  sms_notifications: boolean;
  push_notifications: boolean;
  in_app_notifications: boolean;
  
  // Categories
  loan_notifications: boolean;
  savings_notifications: boolean;
  payment_notifications: boolean;
  system_notifications: boolean;
  marketing_notifications: boolean;
  
  // Frequency
  notification_frequency: 'immediate' | 'daily' | 'weekly' | 'monthly';
  
  created_at: string;
  updated_at: string;
}

export interface NotificationSchedule {
  id: string;
  tenant_id: string;
  template_id: string;
  
  // Schedule Details
  name: string;
  description: string;
  schedule_type: 'one_time' | 'recurring' | 'event_based';
  
  // Timing
  start_date: string;
  end_date?: string;
  time_zone: string;
  
  // Recurring Settings
  frequency?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval?: number;
  day_of_week?: number;
  day_of_month?: number;
  
  // Event Based
  trigger_event?: 'loan_application' | 'payment_due' | 'account_created' | 'goal_milestone';
  
  // Recipients
  recipient_filter: string; // JSON filter criteria
  
  status: 'active' | 'paused' | 'completed';
  created_at: string;
  updated_at: string;
}