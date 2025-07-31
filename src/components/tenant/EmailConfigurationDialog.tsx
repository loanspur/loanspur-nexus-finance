import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Send, Settings, TestTube } from 'lucide-react';
import {
  useCreateEmailConfiguration,
  useUpdateEmailConfiguration,
  useTestEmailConfiguration,
  type EmailConfiguration,
} from '@/hooks/useEmailManagement';

const emailConfigSchema = z.object({
  provider: z.enum(['resend', 'smtp', 'sendgrid']),
  from_email: z.string().email('Invalid email address'),
  from_name: z.string().optional(),
  reply_to_email: z.string().email('Invalid email address').optional().or(z.literal('')),
  api_key: z.string().min(1, 'API key is required').optional(),
  smtp_host: z.string().optional(),
  smtp_port: z.number().min(1).max(65535).optional(),
  smtp_username: z.string().optional(),
  smtp_password: z.string().optional(),
  use_tls: z.boolean(),
  is_active: z.boolean(),
});

type EmailConfigFormData = z.infer<typeof emailConfigSchema>;

interface EmailConfigurationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenantId: string;
  configuration?: EmailConfiguration | null;
}

export const EmailConfigurationDialog = ({
  open,
  onOpenChange,
  tenantId,
  configuration,
}: EmailConfigurationDialogProps) => {
  const [testEmail, setTestEmail] = useState('');
  const [activeTab, setActiveTab] = useState('config');
  
  const createEmailConfig = useCreateEmailConfiguration();
  const updateEmailConfig = useUpdateEmailConfiguration();
  const testEmailConfig = useTestEmailConfiguration();

  const form = useForm<EmailConfigFormData>({
    resolver: zodResolver(emailConfigSchema),
    defaultValues: {
      provider: configuration?.provider || 'resend',
      from_email: configuration?.from_email || '',
      from_name: configuration?.from_name || '',
      reply_to_email: configuration?.reply_to_email || '',
      api_key: '',
      smtp_host: configuration?.smtp_host || '',
      smtp_port: configuration?.smtp_port || 587,
      smtp_username: configuration?.smtp_username || '',
      smtp_password: '',
      use_tls: configuration?.use_tls ?? true,
      is_active: configuration?.is_active ?? true,
    },
  });

  const provider = form.watch('provider');

  const onSubmit = async (data: EmailConfigFormData) => {
    try {
      const configData = {
        tenant_id: tenantId,
        provider: data.provider,
        from_email: data.from_email,
        from_name: data.from_name || null,
        reply_to_email: data.reply_to_email || null,
        api_key_encrypted: data.api_key || null,
        smtp_host: data.smtp_host || null,
        smtp_port: data.smtp_port || null,
        smtp_username: data.smtp_username || null,
        smtp_password_encrypted: data.smtp_password || null,
        use_tls: data.use_tls,
        is_active: data.is_active,
      };

      if (configuration) {
        await updateEmailConfig.mutateAsync({ ...configData, id: configuration.id });
      } else {
        await createEmailConfig.mutateAsync(configData);
      }

      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error('Error saving email configuration:', error);
    }
  };

  const handleTestEmail = async () => {
    if (!configuration || !testEmail) return;
    
    await testEmailConfig.mutateAsync({
      configId: configuration.id,
      testEmail,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            {configuration ? 'Edit' : 'Create'} Email Configuration
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="config" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Configuration
            </TabsTrigger>
            <TabsTrigger value="test" disabled={!configuration} className="flex items-center gap-2">
              <TestTube className="h-4 w-4" />
              Test
            </TabsTrigger>
          </TabsList>

          <TabsContent value="config">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="provider">Email Provider</Label>
                  <Select
                    value={form.watch('provider')}
                    onValueChange={(value) => form.setValue('provider', value as any)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select provider" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="resend">Resend</SelectItem>
                      <SelectItem value="sendgrid">SendGrid</SelectItem>
                      <SelectItem value="smtp">Custom SMTP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="from_email">From Email *</Label>
                    <Input
                      {...form.register('from_email')}
                      placeholder="noreply@company.com"
                    />
                    {form.formState.errors.from_email && (
                      <p className="text-sm text-destructive mt-1">
                        {form.formState.errors.from_email.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="from_name">From Name</Label>
                    <Input
                      {...form.register('from_name')}
                      placeholder="Company Name"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="reply_to_email">Reply To Email</Label>
                  <Input
                    {...form.register('reply_to_email')}
                    placeholder="support@company.com"
                  />
                </div>

                {provider === 'resend' && (
                  <div>
                    <Label htmlFor="api_key">Resend API Key *</Label>
                    <Input
                      {...form.register('api_key')}
                      type="password"
                      placeholder="re_..."
                    />
                  </div>
                )}

                {provider === 'sendgrid' && (
                  <div>
                    <Label htmlFor="api_key">SendGrid API Key *</Label>
                    <Input
                      {...form.register('api_key')}
                      type="password"
                      placeholder="SG..."
                    />
                  </div>
                )}

                {provider === 'smtp' && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">SMTP Settings</CardTitle>
                      <CardDescription>
                        Configure your custom SMTP server settings
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="smtp_host">SMTP Host *</Label>
                          <Input
                            {...form.register('smtp_host')}
                            placeholder="smtp.gmail.com"
                          />
                        </div>
                        <div>
                          <Label htmlFor="smtp_port">SMTP Port *</Label>
                          <Input
                            {...form.register('smtp_port', { valueAsNumber: true })}
                            type="number"
                            placeholder="587"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="smtp_username">Username</Label>
                          <Input
                            {...form.register('smtp_username')}
                            placeholder="username@gmail.com"
                          />
                        </div>
                        <div>
                          <Label htmlFor="smtp_password">Password</Label>
                          <Input
                            {...form.register('smtp_password')}
                            type="password"
                            placeholder="App password"
                          />
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={form.watch('use_tls')}
                          onCheckedChange={(checked) => form.setValue('use_tls', checked)}
                        />
                        <Label>Use TLS/SSL</Label>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={form.watch('is_active')}
                    onCheckedChange={(checked) => form.setValue('is_active', checked)}
                  />
                  <Label>Enable this configuration</Label>
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createEmailConfig.isPending || updateEmailConfig.isPending}
                >
                  {configuration ? 'Update' : 'Create'} Configuration
                </Button>
              </DialogFooter>
            </form>
          </TabsContent>

          <TabsContent value="test">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="h-5 w-5" />
                  Test Email Configuration
                </CardTitle>
                <CardDescription>
                  Send a test email to verify your configuration is working correctly
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="test-email">Test Email Address</Label>
                  <Input
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    placeholder="test@example.com"
                    type="email"
                  />
                </div>
                <Button 
                  onClick={handleTestEmail}
                  disabled={!testEmail || testEmailConfig.isPending}
                  className="w-full"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Send Test Email
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};