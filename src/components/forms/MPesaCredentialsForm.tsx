import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CreditCard, Key, Globe, Shield } from "lucide-react";
import { useMPesaCredentials, useCreateMPesaCredentials, useUpdateMPesaCredentials } from "@/hooks/useIntegrations";

const mpesaCredentialsSchema = z.object({
  environment: z.enum(['sandbox', 'production']),
  consumer_key: z.string().min(1, "Consumer key is required"),
  consumer_secret: z.string().min(1, "Consumer secret is required"),
  business_short_code: z.string().min(1, "Business short code is required"),
  passkey: z.string().min(1, "Passkey is required"),
  initiator_name: z.string().optional(),
  security_credential: z.string().optional(),
  till_number: z.string().optional(),
  paybill_number: z.string().optional(),
  register_url_validation_url: z.string().url().optional().or(z.literal("")),
  register_url_confirmation_url: z.string().url().optional().or(z.literal("")),
  c2b_callback_url: z.string().url().optional().or(z.literal("")),
  b2c_callback_url: z.string().url().optional().or(z.literal("")),
  transaction_status_callback_url: z.string().url().optional().or(z.literal("")),
  account_balance_callback_url: z.string().url().optional().or(z.literal("")),
  is_active: z.boolean().default(true),
});

type MPesaCredentialsForm = z.infer<typeof mpesaCredentialsSchema>;

interface MPesaCredentialsFormProps {
  tenantId: string;
}

const MPesaCredentialsForm = ({ tenantId }: MPesaCredentialsFormProps) => {
  const [isEditing, setIsEditing] = useState(false);

  const { data: credentials, isLoading } = useMPesaCredentials(tenantId);
  const createCredentials = useCreateMPesaCredentials();
  const updateCredentials = useUpdateMPesaCredentials();

  const form = useForm<MPesaCredentialsForm>({
    resolver: zodResolver(mpesaCredentialsSchema),
    defaultValues: {
      environment: 'sandbox',
      consumer_key: '',
      consumer_secret: '',
      business_short_code: '',
      passkey: '',
      initiator_name: '',
      security_credential: '',
      till_number: '',
      paybill_number: '',
      register_url_validation_url: '',
      register_url_confirmation_url: '',
      c2b_callback_url: '',
      b2c_callback_url: '',
      transaction_status_callback_url: '',
      account_balance_callback_url: '',
      is_active: true,
    },
  });

  const onSubmit = async (data: MPesaCredentialsForm) => {
    try {
      const existingCredential = credentials?.find(c => c.environment === data.environment);
      
      if (existingCredential) {
        await updateCredentials.mutateAsync({
          id: existingCredential.id,
          ...data,
          tenant_id: tenantId,
        });
      } else {
        await createCredentials.mutateAsync({
          ...data,
          tenant_id: tenantId,
        });
      }
      
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving M-Pesa credentials:', error);
    }
  };

  const loadCredentials = (environment: 'sandbox' | 'production') => {
    const credential = credentials?.find(c => c.environment === environment);
    if (credential) {
      form.reset({
        environment: credential.environment as 'sandbox' | 'production',
        consumer_key: credential.consumer_key || '',
        consumer_secret: credential.consumer_secret || '',
        business_short_code: credential.business_short_code || '',
        passkey: credential.passkey || '',
        initiator_name: '',
        security_credential: '',
        till_number: '',
        paybill_number: '',
        register_url_validation_url: credential.validation_url || '',
        register_url_confirmation_url: credential.confirmation_url || '',
        c2b_callback_url: credential.callback_url || '',
        b2c_callback_url: credential.result_url || '',
        transaction_status_callback_url: credential.timeout_url || '',
        account_balance_callback_url: '',
        is_active: credential.is_active,
      });
      setIsEditing(true);
    }
  };

  if (isLoading) {
    return <div>Loading M-Pesa credentials...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">M-Pesa Configuration</h2>
          <p className="text-muted-foreground">
            Manage M-Pesa API credentials for C2B and B2C transactions
          </p>
        </div>
      </div>

      <Tabs defaultValue="sandbox" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sandbox" className="flex items-center space-x-2">
            <Globe className="h-4 w-4" />
            <span>Sandbox</span>
          </TabsTrigger>
          <TabsTrigger value="production" className="flex items-center space-x-2">
            <Shield className="h-4 w-4" />
            <span>Production</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sandbox" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Globe className="h-5 w-5" />
                <span>Sandbox Environment</span>
                {credentials?.find(c => c.environment === 'sandbox')?.is_active && (
                  <Badge variant="default">Active</Badge>
                )}
              </CardTitle>
              <CardDescription>
                Test environment for M-Pesa integration development
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                variant="outline" 
                onClick={() => {
                  form.setValue('environment', 'sandbox');
                  loadCredentials('sandbox');
                }}
              >
                Configure Sandbox
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="production" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Production Environment</span>
                {credentials?.find(c => c.environment === 'production')?.is_active && (
                  <Badge variant="default">Active</Badge>
                )}
              </CardTitle>
              <CardDescription>
                Live environment for real M-Pesa transactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                variant="outline" 
                onClick={() => {
                  form.setValue('environment', 'production');
                  loadCredentials('production');
                }}
              >
                Configure Production
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {isEditing && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Key className="h-5 w-5" />
              <span>M-Pesa API Configuration</span>
            </CardTitle>
            <CardDescription>
              Configure your M-Pesa API credentials for {form.watch('environment')} environment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="consumer_key"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Consumer Key</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter consumer key" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="consumer_secret"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Consumer Secret</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Enter consumer secret" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="business_short_code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Short Code</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 174379" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="passkey"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Passkey</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Enter passkey" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="till_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Till Number (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter till number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="paybill_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>PayBill Number (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter paybill number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Callback URLs</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="register_url_validation_url"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Register URL Validation</FormLabel>
                          <FormControl>
                            <Input placeholder="https://yourdomain.com/mpesa/validation" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="register_url_confirmation_url"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Register URL Confirmation</FormLabel>
                          <FormControl>
                            <Input placeholder="https://yourdomain.com/mpesa/confirmation" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="c2b_callback_url"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>C2B Callback URL</FormLabel>
                          <FormControl>
                            <Input placeholder="https://yourdomain.com/mpesa/c2b-callback" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="b2c_callback_url"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>B2C Callback URL</FormLabel>
                          <FormControl>
                            <Input placeholder="https://yourdomain.com/mpesa/b2c-callback" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">B2C Configuration</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="initiator_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Initiator Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter initiator name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="security_credential"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Security Credential</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Enter security credential" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="is_active"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Active</FormLabel>
                        <div className="text-sm text-muted-foreground">
                          Enable this M-Pesa configuration
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createCredentials.isPending || updateCredentials.isPending}>
                    {(createCredentials.isPending || updateCredentials.isPending) ? "Saving..." : "Save Configuration"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MPesaCredentialsForm;