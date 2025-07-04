import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  useTenantDomains, 
  useTenantPaymentHistory, 
  useTenantAddons, 
  useTenantMpesaConfig,
  useUpdateTenant 
} from "@/hooks/useSuperAdmin";
import { 
  Building2, 
  CreditCard, 
  Globe, 
  Settings, 
  Phone, 
  Mail, 
  User,
  Smartphone,
  DollarSign,
  Calendar,
  Link,
  Shield,
  AlertTriangle,
  CheckCircle,
  Edit,
  Save,
  X
} from "lucide-react";
import { format } from "date-fns";

interface TenantDetailsDialogProps {
  tenantId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const TenantDetailsDialog = ({ tenantId, open, onOpenChange }: TenantDetailsDialogProps) => {
  const [editMode, setEditMode] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch tenant details
  const { data: tenant, isLoading } = useQuery({
    queryKey: ['tenant-details', tenantId],
    queryFn: async () => {
      if (!tenantId) return null;
      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', tenantId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!tenantId,
  });

  // Fetch tenant domains
  const { data: domains } = useTenantDomains(tenantId || '');

  // Fetch tenant payment history
  const { data: payments } = useTenantPaymentHistory(tenantId || '');

  // Fetch tenant addons
  const { data: addons } = useTenantAddons(tenantId || '');

  // Fetch M-Pesa config
  const { data: mpesaConfig } = useTenantMpesaConfig(tenantId || '');

  // Update tenant mutation
  const updateTenantMutation = useUpdateTenant();

  const handleEdit = (section: string) => {
    setEditMode(section);
    if (section === 'contact' && tenant) {
      setEditData({
        contact_person_name: tenant.contact_person_name || '',
        contact_person_email: tenant.contact_person_email || '',
        contact_person_phone: tenant.contact_person_phone || '',
      });
    } else if (section === 'billing' && tenant) {
      setEditData({
        billing_cycle: tenant.billing_cycle || 'monthly',
        auto_billing: tenant.auto_billing || true,
        payment_terms: tenant.payment_terms || 30,
        billing_address: tenant.billing_address || {},
      });
    }
  };

  const handleSave = () => {
    if (!tenantId) return;
    updateTenantMutation.mutate({ tenantId, updates: editData });
    setEditMode(null);
  };

  const handleCancel = () => {
    setEditMode(null);
    setEditData({});
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
      case 'active':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'pending':
        return <AlertTriangle className="h-4 w-4 text-warning" />;
      case 'failed':
        return <X className="h-4 w-4 text-destructive" />;
      default:
        return <Shield className="h-4 w-4 text-muted-foreground" />;
    }
  };

  if (!tenant) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {tenant.name} - Tenant Management
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="contact">Contact</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
            <TabsTrigger value="domains">Domains</TabsTrigger>
            <TabsTrigger value="mpesa">M-Pesa</TabsTrigger>
            <TabsTrigger value="addons">Add-ons</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Tenant Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Name:</span>
                    <span className="text-sm font-medium">{tenant.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Slug:</span>
                    <span className="text-sm font-medium">/{tenant.slug}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Status:</span>
                    <Badge variant={tenant.status === 'active' ? 'default' : 'secondary'}>
                      {tenant.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Tier:</span>
                    <Badge variant="outline">{tenant.pricing_tier}</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Subscription Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Trial Ends:</span>
                    <span className="text-sm">
                      {tenant.trial_ends_at 
                        ? format(new Date(tenant.trial_ends_at), 'MMM dd, yyyy')
                        : 'No trial'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Subscription Ends:</span>
                    <span className="text-sm">
                      {tenant.subscription_ends_at 
                        ? format(new Date(tenant.subscription_ends_at), 'MMM dd, yyyy')
                        : 'Active'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Auto Billing:</span>
                    <Badge variant={tenant.auto_billing ? 'default' : 'secondary'}>
                      {tenant.auto_billing ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Recent Payment History</CardTitle>
              </CardHeader>
              <CardContent>
                {payments && payments.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Provider</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments.slice(0, 5).map((payment: any) => (
                        <TableRow key={payment.id}>
                          <TableCell>{format(new Date(payment.created_at), 'MMM dd, yyyy')}</TableCell>
                          <TableCell>${payment.amount}</TableCell>
                          <TableCell className="capitalize">{payment.payment_type}</TableCell>
                          <TableCell>
                            <Badge variant={payment.payment_status === 'completed' ? 'default' : 'secondary'}>
                              {payment.payment_status}
                            </Badge>
                          </TableCell>
                          <TableCell className="capitalize">{payment.payment_provider || 'N/A'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-sm text-muted-foreground">No payment history available</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contact" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Contact Person Details
                  </CardTitle>
                  <CardDescription>Primary contact information for this tenant</CardDescription>
                </div>
                {editMode !== 'contact' && (
                  <Button variant="outline" size="sm" onClick={() => handleEdit('contact')}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {editMode === 'contact' ? (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="contact_name">Full Name</Label>
                      <Input
                        id="contact_name"
                        value={editData.contact_person_name}
                        onChange={(e) => setEditData({...editData, contact_person_name: e.target.value})}
                        placeholder="Enter contact person name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="contact_email">Email</Label>
                      <Input
                        id="contact_email"
                        type="email"
                        value={editData.contact_person_email}
                        onChange={(e) => setEditData({...editData, contact_person_email: e.target.value})}
                        placeholder="Enter email address"
                      />
                    </div>
                    <div>
                      <Label htmlFor="contact_phone">Phone</Label>
                      <Input
                        id="contact_phone"
                        value={editData.contact_person_phone}
                        onChange={(e) => setEditData({...editData, contact_person_phone: e.target.value})}
                        placeholder="Enter phone number"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleSave} disabled={updateTenantMutation.isPending}>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </Button>
                      <Button variant="outline" onClick={handleCancel}>
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        {tenant.contact_person_name || 'Not specified'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {tenant.contact_person_email || 'Not specified'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {tenant.contact_person_phone || 'Not specified'}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="billing" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Billing Configuration
                  </CardTitle>
                  <CardDescription>Billing cycle and payment settings</CardDescription>
                </div>
                {editMode !== 'billing' && (
                  <Button variant="outline" size="sm" onClick={() => handleEdit('billing')}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {editMode === 'billing' ? (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="billing_cycle">Billing Cycle</Label>
                      <select
                        id="billing_cycle"
                        className="w-full mt-1 p-2 border rounded-md"
                        value={editData.billing_cycle}
                        onChange={(e) => setEditData({...editData, billing_cycle: e.target.value})}
                      >
                        <option value="monthly">Monthly</option>
                        <option value="quarterly">Quarterly</option>
                        <option value="annually">Annually</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="payment_terms">Payment Terms (days)</Label>
                      <Input
                        id="payment_terms"
                        type="number"
                        value={editData.payment_terms}
                        onChange={(e) => setEditData({...editData, payment_terms: parseInt(e.target.value)})}
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="auto_billing"
                        checked={editData.auto_billing}
                        onCheckedChange={(checked) => setEditData({...editData, auto_billing: checked})}
                      />
                      <Label htmlFor="auto_billing">Enable Auto Billing</Label>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleSave} disabled={updateTenantMutation.isPending}>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </Button>
                      <Button variant="outline" onClick={handleCancel}>
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Billing Cycle:</span>
                      <span className="text-sm font-medium capitalize">{tenant.billing_cycle}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Payment Terms:</span>
                      <span className="text-sm font-medium">{tenant.payment_terms} days</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Auto Billing:</span>
                      <Badge variant={tenant.auto_billing ? 'default' : 'secondary'}>
                        {tenant.auto_billing ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Payment History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {payments && payments.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Reference</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments.map((payment: any) => (
                        <TableRow key={payment.id}>
                          <TableCell>{format(new Date(payment.created_at), 'MMM dd, yyyy HH:mm')}</TableCell>
                          <TableCell>${payment.amount} {payment.currency}</TableCell>
                          <TableCell className="capitalize">{payment.payment_type}</TableCell>
                          <TableCell>
                            <Badge variant={payment.payment_status === 'completed' ? 'default' : 'secondary'}>
                              {payment.payment_status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs">{payment.payment_reference || 'N/A'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-sm text-muted-foreground">No payment history available</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="domains" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Domain Management
                </CardTitle>
                <CardDescription>Manage custom domains and DNS settings</CardDescription>
              </CardHeader>
              <CardContent>
                {domains && domains.length > 0 ? (
                  <div className="space-y-3">
                    {domains.map((domain: any) => (
                      <div key={domain.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Link className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{domain.domain_name}</div>
                            <div className="text-xs text-muted-foreground capitalize">
                              {domain.domain_type} domain
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            {getStatusIcon(domain.verification_status)}
                            <span className="text-xs capitalize">{domain.verification_status}</span>
                          </div>
                          {domain.is_primary && (
                            <Badge variant="default" className="text-xs">Primary</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No custom domains configured</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="mpesa" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4" />
                  M-Pesa Configuration
                </CardTitle>
                <CardDescription>Mobile payment integration settings</CardDescription>
              </CardHeader>
              <CardContent>
                {mpesaConfig && mpesaConfig.length > 0 ? (
                  <div className="space-y-3">
                    {mpesaConfig.map((config: any) => (
                      <div key={config.id} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-medium capitalize">{config.config_type.replace('_', ' ')}</div>
                          <div className="flex items-center gap-2">
                            <Badge variant={config.environment === 'production' ? 'default' : 'secondary'}>
                              {config.environment}
                            </Badge>
                            <Badge variant={config.is_active ? 'default' : 'secondary'}>
                              {config.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Short Code: {config.business_short_code || 'Not configured'}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No M-Pesa configuration found</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="addons" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Active Add-ons
                </CardTitle>
                <CardDescription>Additional features and services</CardDescription>
              </CardHeader>
              <CardContent>
                {addons && addons.length > 0 ? (
                  <div className="space-y-3">
                    {addons.map((addon: any) => (
                      <div key={addon.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">{addon.addon_name}</div>
                          <div className="text-sm text-muted-foreground capitalize">
                            {addon.addon_type} • Qty: {addon.quantity}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">${addon.unit_price}/{addon.billing_cycle}</div>
                          <Badge variant={addon.is_active ? 'default' : 'secondary'}>
                            {addon.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No add-ons configured</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};