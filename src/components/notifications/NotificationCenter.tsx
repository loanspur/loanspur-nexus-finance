import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell, Mail, MessageSquare, Settings } from 'lucide-react';
import { Notification, NotificationTemplate } from '@/types/notifications';

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      // TODO: Implement API calls to load notifications
      
      // Mock data for demonstration
      const mockNotifications: Notification[] = [
        {
          id: '1',
          tenant_id: 'tenant-1',
          template_id: 'template-1',
          recipient_type: 'client',
          recipient_id: 'client-1',
          recipient_email: 'client@example.com',
          subject: 'Loan Application Approved',
          body: 'Congratulations! Your loan application has been approved.',
          notification_type: 'email',
          status: 'sent',
          priority: 'high',
          retry_count: 0,
          sent_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: '2',
          tenant_id: 'tenant-1',
          template_id: 'template-2',
          recipient_type: 'client',
          recipient_id: 'client-2',
          recipient_phone: '+254700000000',
          body: 'Your loan payment is due in 3 days. Amount: KES 15,000',
          notification_type: 'sms',
          status: 'delivered',
          priority: 'medium',
          retry_count: 0,
          delivered_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      ];
      
      const mockTemplates: NotificationTemplate[] = [
        {
          id: 'template-1',
          tenant_id: 'tenant-1',
          name: 'Loan Approval Notification',
          description: 'Sent when a loan application is approved',
          notification_type: 'email',
          category: 'loan',
          subject: 'Loan Application Approved',
          body: 'Dear {{client_name}}, your loan application for {{loan_amount}} has been approved.',
          variables: ['client_name', 'loan_amount'],
          is_active: true,
          priority: 'high',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      ];
      
      setNotifications(mockNotifications);
      setTemplates(mockTemplates);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const getNotificationTypeIcon = (type: string) => {
    switch (type) {
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'sms':
        return <MessageSquare className="h-4 w-4" />;
      case 'push':
        return <Bell className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'outline',
      sent: 'default',
      delivered: 'secondary',
      failed: 'destructive',
      read: 'outline',
    };
    return <Badge variant={variants[status as keyof typeof variants]}>{status}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const variants = {
      low: 'outline',
      medium: 'default',
      high: 'secondary',
      urgent: 'destructive',
    };
    return <Badge variant={variants[priority as keyof typeof variants]}>{priority}</Badge>;
  };

  if (loading) {
    return <div>Loading notifications...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Notification Center</h2>
        <div className="space-x-2">
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Preferences
          </Button>
          <Button>Create Template</Button>
        </div>
      </div>

      <Tabs defaultValue="notifications" className="space-y-4">
        <TabsList>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="schedules">Schedules</TabsTrigger>
        </TabsList>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Notifications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {notifications.map((notification) => (
                  <div key={notification.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      {getNotificationTypeIcon(notification.notification_type)}
                      <div>
                        <p className="font-medium">{notification.subject || notification.body}</p>
                        <p className="text-sm text-muted-foreground">
                          {notification.recipient_type}: {notification.recipient_email || notification.recipient_phone}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(notification.status)}
                      {getPriorityBadge(notification.priority)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Templates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {templates.map((template) => (
                  <div key={template.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{template.name}</p>
                      <p className="text-sm text-muted-foreground">{template.description}</p>
                      <div className="flex items-center space-x-2 mt-2">
                        <Badge variant="outline">{template.notification_type}</Badge>
                        <Badge variant="outline">{template.category}</Badge>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}