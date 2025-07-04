import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Settings, Trash2, MessageSquare, Smartphone } from "lucide-react";
import { useGlobalIntegrations, useCreateGlobalIntegration, useUpdateGlobalIntegration, useDeleteGlobalIntegration, GlobalIntegration } from "@/hooks/useIntegrations";

const integrationSchema = z.object({
  integration_type: z.enum(['sms', 'whatsapp']),
  provider_name: z.string().min(1, "Provider name is required"),
  display_name: z.string().min(1, "Display name is required"),
  configuration: z.string().min(1, "Configuration is required"),
  is_active: z.boolean().default(true),
});

type IntegrationForm = z.infer<typeof integrationSchema>;

const GlobalIntegrationsManagement = () => {
  const [editingIntegration, setEditingIntegration] = useState<GlobalIntegration | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const { data: integrations, isLoading } = useGlobalIntegrations();
  const createIntegration = useCreateGlobalIntegration();
  const updateIntegration = useUpdateGlobalIntegration();
  const deleteIntegration = useDeleteGlobalIntegration();

  const form = useForm<IntegrationForm>({
    resolver: zodResolver(integrationSchema),
    defaultValues: {
      integration_type: 'sms',
      provider_name: '',
      display_name: '',
      configuration: '{}',
      is_active: true,
    },
  });

  const onSubmit = async (data: IntegrationForm) => {
    try {
      const configData = JSON.parse(data.configuration);
      
      if (editingIntegration) {
        await updateIntegration.mutateAsync({
          id: editingIntegration.id,
          integration_type: data.integration_type,
          provider_name: data.provider_name,
          display_name: data.display_name,
          configuration: configData,
          is_active: data.is_active,
        });
        setIsEditDialogOpen(false);
      } else {
        await createIntegration.mutateAsync({
          integration_type: data.integration_type,
          provider_name: data.provider_name,
          display_name: data.display_name,
          configuration: configData,
          is_active: data.is_active,
        });
        setIsCreateDialogOpen(false);
      }
      
      form.reset();
      setEditingIntegration(null);
    } catch (error) {
      console.error('Error saving integration:', error);
    }
  };

  const handleEdit = (integration: GlobalIntegration) => {
    setEditingIntegration(integration);
    form.reset({
      integration_type: integration.integration_type,
      provider_name: integration.provider_name,
      display_name: integration.display_name,
      configuration: JSON.stringify(integration.configuration, null, 2),
      is_active: integration.is_active,
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    await deleteIntegration.mutateAsync(id);
  };

  const toggleIntegrationStatus = async (integration: GlobalIntegration) => {
    await updateIntegration.mutateAsync({
      id: integration.id,
      is_active: !integration.is_active,
    });
  };

  const smsIntegrations = integrations?.filter(i => i.integration_type === 'sms') || [];
  const whatsappIntegrations = integrations?.filter(i => i.integration_type === 'whatsapp') || [];

  const IntegrationCard = ({ integration }: { integration: GlobalIntegration }) => (
    <Card className="relative">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center space-x-2">
          {integration.integration_type === 'sms' ? (
            <Smartphone className="h-4 w-4 text-muted-foreground" />
          ) : (
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          )}
          <CardTitle className="text-sm font-medium">
            {integration.display_name}
          </CardTitle>
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            checked={integration.is_active}
            onCheckedChange={() => toggleIntegrationStatus(integration)}
          />
          <Badge variant={integration.is_active ? "default" : "secondary"}>
            {integration.is_active ? "Active" : "Inactive"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Provider: {integration.provider_name}
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleEdit(integration)}
            >
              <Settings className="h-4 w-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Integration</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this integration? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleDelete(integration.id)}>
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return <div>Loading integrations...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Global Integrations</h2>
          <p className="text-muted-foreground">
            Manage SMS and WhatsApp gateway integrations for all tenants
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Integration
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Integration</DialogTitle>
              <DialogDescription>
                Configure a new SMS or WhatsApp gateway integration.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="integration_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Integration Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select integration type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="sms">SMS</SelectItem>
                          <SelectItem value="whatsapp">WhatsApp</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="provider_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Provider Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., twilio, africas_talking" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="display_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Display Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Twilio SMS" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="configuration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Configuration (JSON)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder='{"api_key": "", "account_sid": ""}'
                          className="font-mono text-sm"
                          rows={4}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="is_active"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Active</FormLabel>
                        <div className="text-sm text-muted-foreground">
                          Enable this integration for tenant use
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
                  <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createIntegration.isPending}>
                    {createIntegration.isPending ? "Creating..." : "Create Integration"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="sms" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sms" className="flex items-center space-x-2">
            <Smartphone className="h-4 w-4" />
            <span>SMS Integrations</span>
          </TabsTrigger>
          <TabsTrigger value="whatsapp" className="flex items-center space-x-2">
            <MessageSquare className="h-4 w-4" />
            <span>WhatsApp Integrations</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sms" className="space-y-4">
          {smsIntegrations.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-6">
                <Smartphone className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center">
                  No SMS integrations configured yet.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {smsIntegrations.map((integration) => (
                <IntegrationCard key={integration.id} integration={integration} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="whatsapp" className="space-y-4">
          {whatsappIntegrations.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-6">
                <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center">
                  No WhatsApp integrations configured yet.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {whatsappIntegrations.map((integration) => (
                <IntegrationCard key={integration.id} integration={integration} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Integration</DialogTitle>
            <DialogDescription>
              Update the integration configuration.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="integration_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Integration Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select integration type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="sms">SMS</SelectItem>
                        <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="provider_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Provider Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., twilio, africas_talking" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="display_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Twilio SMS" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="configuration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Configuration (JSON)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder='{"api_key": "", "account_sid": ""}'
                        className="font-mono text-sm"
                        rows={4}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Active</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Enable this integration for tenant use
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
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateIntegration.isPending}>
                  {updateIntegration.isPending ? "Updating..." : "Update Integration"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GlobalIntegrationsManagement;