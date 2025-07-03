import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, MessageSquare, Mail, Smartphone, Send, Users, Calendar, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface NotificationTemplate {
  id: string;
  name: string;
  type: 'sms' | 'email' | 'whatsapp' | 'in_app';
  trigger: string;
  subject?: string;
  message: string;
  is_active: boolean;
  created_at: string;
}

interface NotificationHistory {
  id: string;
  type: 'sms' | 'email' | 'whatsapp' | 'in_app';
  recipient: string;
  subject?: string;
  message: string;
  status: 'sent' | 'failed' | 'pending';
  sent_at: string;
  template_used?: string;
}

// Mock data
const mockTemplates: NotificationTemplate[] = [
  {
    id: "1",
    name: "Loan Approval Notification",
    type: "sms",
    trigger: "loan_approved",
    message: "Congratulations! Your loan application for {amount} has been approved. Disbursement will be processed within 24 hours.",
    is_active: true,
    created_at: "2024-03-01T10:00:00Z"
  },
  {
    id: "2",
    name: "Payment Reminder",
    type: "email",
    trigger: "payment_due",
    subject: "Payment Reminder - Loan #{loan_number}",
    message: "Dear {client_name}, this is a reminder that your loan payment of {amount} is due on {due_date}. Please make your payment to avoid late fees.",
    is_active: true,
    created_at: "2024-03-01T10:00:00Z"
  },
  {
    id: "3",
    name: "Welcome Message",
    type: "whatsapp",
    trigger: "client_created",
    message: "Welcome to LoanSpur! Your client account has been created successfully. Your client ID is {client_id}.",
    is_active: true,
    created_at: "2024-03-01T10:00:00Z"
  }
];

const mockHistory: NotificationHistory[] = [
  {
    id: "1",
    type: "sms",
    recipient: "+254700123456",
    message: "Congratulations! Your loan application for $5,000 has been approved.",
    status: "sent",
    sent_at: "2024-03-15T14:30:00Z",
    template_used: "Loan Approval Notification"
  },
  {
    id: "2",
    type: "email",
    recipient: "john@example.com",
    subject: "Payment Reminder - Loan #LN001",
    message: "Dear John Doe, this is a reminder that your loan payment of $500 is due on March 20, 2024.",
    status: "sent",
    sent_at: "2024-03-15T09:00:00Z",
    template_used: "Payment Reminder"
  },
  {
    id: "3",
    type: "whatsapp",
    recipient: "+254700654321",
    message: "Welcome to LoanSpur! Your client account has been created successfully.",
    status: "failed",
    sent_at: "2024-03-14T16:45:00Z",
    template_used: "Welcome Message"
  }
];

const NotificationsPage = () => {
  const [templates, setTemplates] = useState<NotificationTemplate[]>(mockTemplates);
  const [history, setHistory] = useState<NotificationHistory[]>(mockHistory);
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  // Campaign form state
  const [campaignForm, setCampaignForm] = useState({
    name: "",
    type: "sms" as 'sms' | 'email' | 'whatsapp',
    target_audience: "all_clients",
    subject: "",
    message: "",
    schedule_type: "immediate"
  });

  // Template form state
  const [templateForm, setTemplateForm] = useState({
    name: "",
    type: "sms" as 'sms' | 'email' | 'whatsapp' | 'in_app',
    trigger: "",
    subject: "",
    message: "",
    is_active: true
  });

  const handleCreateTemplate = async () => {
    setIsCreatingTemplate(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newTemplate: NotificationTemplate = {
        id: (templates.length + 1).toString(),
        ...templateForm,
        created_at: new Date().toISOString()
      };
      
      setTemplates([newTemplate, ...templates]);
      setTemplateForm({
        name: "",
        type: "sms",
        trigger: "",
        subject: "",
        message: "",
        is_active: true
      });
      
      toast({
        title: "Template Created",
        description: "Notification template has been created successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create template. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingTemplate(false);
    }
  };

  const handleSendCampaign = async () => {
    setIsSending(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Add to history (simulated)
      const newHistory: NotificationHistory = {
        id: (history.length + 1).toString(),
        type: campaignForm.type,
        recipient: "Campaign to All Clients",
        subject: campaignForm.subject,
        message: campaignForm.message,
        status: "sent",
        sent_at: new Date().toISOString(),
      };
      
      setHistory([newHistory, ...history]);
      setCampaignForm({
        name: "",
        type: "sms",
        target_audience: "all_clients",
        subject: "",
        message: "",
        schedule_type: "immediate"
      });
      
      toast({
        title: "Campaign Sent",
        description: "Notification campaign has been sent successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send campaign. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const toggleTemplate = (templateId: string) => {
    setTemplates(templates.map(template => 
      template.id === templateId 
        ? { ...template, is_active: !template.is_active }
        : template
    ));
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'sms':
        return <Smartphone className="h-4 w-4" />;
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'whatsapp':
        return <MessageSquare className="h-4 w-4" />;
      case 'in_app':
        return <Bell className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'bg-success text-success-foreground';
      case 'failed':
        return 'bg-destructive text-destructive-foreground';
      case 'pending':
        return 'bg-warning text-warning-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStats = () => {
    const totalSent = history.filter(h => h.status === 'sent').length;
    const totalFailed = history.filter(h => h.status === 'failed').length;
    const activeTemplates = templates.filter(t => t.is_active).length;
    return { totalSent, totalFailed, activeTemplates };
  };

  const stats = getStats();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Notifications & Campaigns</h1>
        <p className="text-muted-foreground">
          Manage communication templates and send targeted campaigns to clients.
        </p>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Send className="h-4 w-4 text-success" />
              <div className="text-2xl font-bold text-success">{stats.totalSent}</div>
            </div>
            <p className="text-xs text-muted-foreground">Messages Sent</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Bell className="h-4 w-4 text-primary" />
              <div className="text-2xl font-bold">{stats.activeTemplates}</div>
            </div>
            <p className="text-xs text-muted-foreground">Active Templates</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-4 w-4 text-warning" />
              <div className="text-2xl font-bold text-warning">{stats.totalFailed}</div>
            </div>
            <p className="text-xs text-muted-foreground">Failed Deliveries</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="campaigns" className="space-y-4">
        <TabsList>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        {/* Campaigns Tab */}
        <TabsContent value="campaigns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                Send Campaign
              </CardTitle>
              <CardDescription>
                Send targeted notifications to your clients
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="campaign-name">Campaign Name</Label>
                  <Input
                    id="campaign-name"
                    value={campaignForm.name}
                    onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })}
                    placeholder="March Payment Reminders"
                  />
                </div>
                
                <div>
                  <Label htmlFor="campaign-type">Notification Type</Label>
                  <Select value={campaignForm.type} onValueChange={(value: any) => setCampaignForm({ ...campaignForm, type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sms">SMS</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="target-audience">Target Audience</Label>
                  <Select value={campaignForm.target_audience} onValueChange={(value) => setCampaignForm({ ...campaignForm, target_audience: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all_clients">All Clients</SelectItem>
                      <SelectItem value="active_loans">Clients with Active Loans</SelectItem>
                      <SelectItem value="overdue_payments">Clients with Overdue Payments</SelectItem>
                      <SelectItem value="new_clients">New Clients (Last 30 days)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="schedule-type">Schedule</Label>
                  <Select value={campaignForm.schedule_type} onValueChange={(value) => setCampaignForm({ ...campaignForm, schedule_type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="immediate">Send Immediately</SelectItem>
                      <SelectItem value="scheduled">Schedule for Later</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {(campaignForm.type === 'email' || campaignForm.type === 'whatsapp') && (
                <div>
                  <Label htmlFor="campaign-subject">Subject</Label>
                  <Input
                    id="campaign-subject"
                    value={campaignForm.subject}
                    onChange={(e) => setCampaignForm({ ...campaignForm, subject: e.target.value })}
                    placeholder="Important update from LoanSpur"
                  />
                </div>
              )}

              <div>
                <Label htmlFor="campaign-message">Message</Label>
                <Textarea
                  id="campaign-message"
                  value={campaignForm.message}
                  onChange={(e) => setCampaignForm({ ...campaignForm, message: e.target.value })}
                  placeholder="Your message content here..."
                  rows={4}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Use placeholders: {"{client_name}"}, {"{amount}"}, {"{due_date}"}, {"{loan_number}"}
                </p>
              </div>

              <Button onClick={handleSendCampaign} disabled={isSending}>
                {isSending ? "Sending..." : "Send Campaign"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Create Template Form */}
            <Card>
              <CardHeader>
                <CardTitle>Create Template</CardTitle>
                <CardDescription>
                  Create automated notification templates
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="template-name">Template Name</Label>
                  <Input
                    id="template-name"
                    value={templateForm.name}
                    onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                    placeholder="Payment Reminder"
                  />
                </div>

                <div className="grid gap-4 grid-cols-2">
                  <div>
                    <Label htmlFor="template-type">Type</Label>
                    <Select value={templateForm.type} onValueChange={(value: any) => setTemplateForm({ ...templateForm, type: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sms">SMS</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="whatsapp">WhatsApp</SelectItem>
                        <SelectItem value="in_app">In-App</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="template-trigger">Trigger</Label>
                    <Select value={templateForm.trigger} onValueChange={(value) => setTemplateForm({ ...templateForm, trigger: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="loan_approved">Loan Approved</SelectItem>
                        <SelectItem value="loan_disbursed">Loan Disbursed</SelectItem>
                        <SelectItem value="payment_due">Payment Due</SelectItem>
                        <SelectItem value="payment_overdue">Payment Overdue</SelectItem>
                        <SelectItem value="client_created">Client Created</SelectItem>
                        <SelectItem value="account_created">Account Created</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {(templateForm.type === 'email' || templateForm.type === 'whatsapp') && (
                  <div>
                    <Label htmlFor="template-subject">Subject</Label>
                    <Input
                      id="template-subject"
                      value={templateForm.subject}
                      onChange={(e) => setTemplateForm({ ...templateForm, subject: e.target.value })}
                      placeholder="Subject line"
                    />
                  </div>
                )}

                <div>
                  <Label htmlFor="template-message">Message</Label>
                  <Textarea
                    id="template-message"
                    value={templateForm.message}
                    onChange={(e) => setTemplateForm({ ...templateForm, message: e.target.value })}
                    placeholder="Template message..."
                    rows={4}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="template-active"
                    checked={templateForm.is_active}
                    onCheckedChange={(checked) => setTemplateForm({ ...templateForm, is_active: checked })}
                  />
                  <Label htmlFor="template-active">Active</Label>
                </div>

                <Button onClick={handleCreateTemplate} disabled={isCreatingTemplate}>
                  {isCreatingTemplate ? "Creating..." : "Create Template"}
                </Button>
              </CardContent>
            </Card>

            {/* Templates List */}
            <Card>
              <CardHeader>
                <CardTitle>Notification Templates</CardTitle>
                <CardDescription>
                  Manage your automated notification templates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {templates.map((template) => (
                    <div key={template.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getTypeIcon(template.type)}
                          <div>
                            <div className="font-medium">{template.name}</div>
                            <div className="text-sm text-muted-foreground">
                              Trigger: {template.trigger}
                            </div>
                          </div>
                        </div>
                        <Switch
                          checked={template.is_active}
                          onCheckedChange={() => toggleTemplate(template.id)}
                        />
                      </div>
                      <div className="mt-2 text-sm text-muted-foreground">
                        {template.message.substring(0, 100)}...
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification History</CardTitle>
              <CardDescription>
                View all sent notifications and their delivery status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Subject/Message</TableHead>
                    <TableHead>Template</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Sent At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getTypeIcon(item.type)}
                          <span className="capitalize">{item.type}</span>
                        </div>
                      </TableCell>
                      <TableCell>{item.recipient}</TableCell>
                      <TableCell>
                        <div>
                          {item.subject && (
                            <div className="font-medium">{item.subject}</div>
                          )}
                          <div className="text-sm text-muted-foreground">
                            {item.message.substring(0, 60)}...
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {item.template_used && (
                          <Badge variant="outline">{item.template_used}</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(item.status)}>
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {format(new Date(item.sent_at), 'MMM dd, yyyy')}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(item.sent_at), 'HH:mm')}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default NotificationsPage;