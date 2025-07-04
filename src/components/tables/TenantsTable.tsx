import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Building2, Calendar, DollarSign, Eye, Edit, Trash2 } from "lucide-react";
import { useTenants, type Tenant } from "@/hooks/useSupabase";
import { format } from "date-fns";
import { TenantDetailsDialog } from "@/components/super-admin/TenantDetailsDialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface TenantsTableProps {
  onCreateTenant: () => void;
}

export const TenantsTable = ({ onCreateTenant }: TenantsTableProps) => {
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const { data: tenants, isLoading, error } = useTenants();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-success text-success-foreground';
      case 'suspended':
        return 'bg-warning text-warning-foreground';
      case 'cancelled':
        return 'bg-destructive text-destructive-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getPricingTierColor = (tier: string) => {
    switch (tier) {
      case 'starter':
        return 'bg-slate-100 text-slate-800';
      case 'professional':
        return 'bg-blue-100 text-blue-800';
      case 'enterprise':
        return 'bg-purple-100 text-purple-800';
      case 'scale':
        return 'bg-gold-100 text-gold-800';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  // Delete tenant mutation
  const deleteTenantMutation = useMutation({
    mutationFn: async (tenantId: string) => {
      const { error } = await supabase
        .from('tenants')
        .delete()
        .eq('id', tenantId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      toast({ title: "Success", description: "Tenant deleted successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleViewDetails = (tenantId: string) => {
    setSelectedTenantId(tenantId);
    setShowDetailsDialog(true);
  };

  const handleDeleteTenant = (tenantId: string, tenantName: string) => {
    if (window.confirm(`Are you sure you want to delete tenant "${tenantName}"? This action cannot be undone.`)) {
      deleteTenantMutation.mutate(tenantId);
    }
  };

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-destructive">
            Error loading tenants: {error.message}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Tenants Management
            </CardTitle>
            <CardDescription>
              Manage tenant organizations and their subscriptions
            </CardDescription>
          </div>
          <Button onClick={onCreateTenant}>
            <Plus className="h-4 w-4 mr-2" />
            Add Tenant
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <div className="text-muted-foreground">Loading tenants...</div>
          </div>
        ) : tenants && tenants.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tenant</TableHead>
                <TableHead>Pricing Tier</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Domain</TableHead>
                <TableHead>Trial Ends</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenants.map((tenant: Tenant) => (
                <TableRow key={tenant.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{tenant.name}</div>
                      <div className="text-sm text-muted-foreground">/{tenant.slug}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="secondary" 
                      className={getPricingTierColor(tenant.pricing_tier)}
                    >
                      {tenant.pricing_tier}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(tenant.status)}>
                      {tenant.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {tenant.domain ? (
                      <span className="text-sm">{tenant.domain}</span>
                    ) : (
                      <span className="text-sm text-muted-foreground">No custom domain</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {tenant.trial_ends_at ? (
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(tenant.trial_ends_at), 'MMM dd, yyyy')}
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">No trial</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {format(new Date(tenant.created_at), 'MMM dd, yyyy')}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(tenant.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteTenant(tenant.id, tenant.name)}
                        disabled={deleteTenantMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No tenants yet</h3>
            <p className="text-muted-foreground mb-4">Get started by creating your first tenant organization.</p>
            <Button onClick={onCreateTenant}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Tenant
            </Button>
          </div>
        )}
      </CardContent>

      <TenantDetailsDialog
        tenantId={selectedTenantId}
        open={showDetailsDialog}
        onOpenChange={setShowDetailsDialog}
      />
    </Card>
  );
};