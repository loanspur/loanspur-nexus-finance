import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Settings } from 'lucide-react';
import { useMifosIntegration } from '@/hooks/useMifosIntegration';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const mifosConfigSchema = z.object({
  mifos_base_url: z.string().url('Please enter a valid URL'),
  mifos_tenant_identifier: z.string().min(1, 'Tenant identifier is required'),
  mifos_username: z.string().min(1, 'Username is required'),
  mifos_password: z.string().min(1, 'Password is required'),
});

type MifosConfigData = z.infer<typeof mifosConfigSchema>;

export const MifosXConfiguration: React.FC = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const { mifosConfig, isLoadingConfig, testConnection, isConfigured } = useMifosIntegration();

  const form = useForm<MifosConfigData>({
    resolver: zodResolver(mifosConfigSchema),
    defaultValues: {
      mifos_base_url: '',
      mifos_tenant_identifier: '',
      mifos_username: '',
      mifos_password: '',
    },
  });

  // Load existing configuration when available
  React.useEffect(() => {
    if (mifosConfig && !isLoadingConfig) {
      form.reset({
        mifos_base_url: mifosConfig.baseUrl,
        mifos_tenant_identifier: mifosConfig.tenantIdentifier,
        mifos_username: mifosConfig.username,
        mifos_password: mifosConfig.password,
      });
    }
  }, [mifosConfig, isLoadingConfig, form]);

  const onSubmit = async (data: MifosConfigData) => {
    if (!profile?.tenant_id) {
      toast({
        title: 'Error',
        description: 'No tenant ID available',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('tenants')
        .update({
          mifos_base_url: data.mifos_base_url,
          mifos_tenant_identifier: data.mifos_tenant_identifier,
          mifos_username: data.mifos_username,
          mifos_password: data.mifos_password,
        })
        .eq('id', profile.tenant_id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Mifos X configuration saved successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleTestConnection = () => {
    testConnection.mutate();
  };

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Mifos X Integration Configuration
        </CardTitle>
        <CardDescription>
          Configure your Mifos X connection for seamless loan management and disbursement.
        </CardDescription>
        <div className="flex items-center gap-2">
          <Badge variant={isConfigured ? "default" : "secondary"} className="flex items-center gap-1">
            {isConfigured ? (
              <CheckCircle className="h-3 w-3" />
            ) : (
              <AlertCircle className="h-3 w-3" />
            )}
            {isConfigured ? 'Configured' : 'Not Configured'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="mifos_base_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mifos X Base URL</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://your-mifos-instance.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="mifos_tenant_identifier"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tenant Identifier</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="default"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="mifos_username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="mifos"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="mifos_password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex gap-3">
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Saving...' : 'Save Configuration'}
              </Button>
              
              {isConfigured && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleTestConnection}
                  disabled={testConnection.isPending}
                >
                  {testConnection.isPending ? 'Testing...' : 'Test Connection'}
                </Button>
              )}
            </div>
          </form>
        </Form>

        {isConfigured && (
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
              Integration Features
            </h4>
            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <li>• Automatic loan disbursement in Mifos X when processing disbursements</li>
              <li>• Loan status synchronization between systems</li>
              <li>• Centralized loan management across platforms</li>
              <li>• Enhanced compliance and audit trails</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};