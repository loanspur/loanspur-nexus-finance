import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Shield, ShieldCheck } from "lucide-react";
import { format } from "date-fns";

interface ClientIdentifier {
  id: string;
  identifier_type: string;
  identifier_value: string;
  expiry_date?: string;
  issuing_authority?: string;
  notes?: string;
  is_verified: boolean;
  verified_at?: string;
  created_at: string;
}

interface ClientIdentifiersTabProps {
  clientId: string;
}

const IDENTIFIER_TYPES = [
  { value: 'passport', label: 'Passport Number' },
  { value: 'driver_license', label: 'Driver License' },
  { value: 'additional_phone', label: 'Additional Phone' },
  { value: 'social_security', label: 'Social Security Number' },
  { value: 'tax_id', label: 'Tax ID' },
  { value: 'voter_id', label: 'Voter ID' },
  { value: 'employee_id', label: 'Employee ID' },
  { value: 'other', label: 'Other' },
];

export const ClientIdentifiersTab = ({ clientId }: ClientIdentifiersTabProps) => {
  const [identifiers, setIdentifiers] = useState<ClientIdentifier[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    identifier_type: '',
    identifier_value: '',
    expiry_date: '',
    issuing_authority: '',
    notes: '',
    is_verified: false,
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchIdentifiers();
  }, [clientId]);

  const fetchIdentifiers = async () => {
    try {
      const { data, error } = await supabase
        .from('client_identifiers')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setIdentifiers(data || []);
    } catch (error) {
      console.error('Error fetching identifiers:', error);
      toast({
        title: "Error",
        description: "Failed to fetch client identifiers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Get current user's tenant_id
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('user_id', user.id)
        .single();

      if (profileError) {
        console.error('Profile error:', profileError);
        throw new Error('Failed to get user profile');
      }

      const submitData = {
        client_id: clientId,
        tenant_id: profile?.tenant_id,
        ...formData,
        expiry_date: formData.expiry_date || null,
        issuing_authority: formData.issuing_authority || null,
        notes: formData.notes || null,
      };

      if (editingId) {
        // For updates, exclude client_id and tenant_id as they shouldn't change
        const updateData = {
          identifier_type: formData.identifier_type,
          identifier_value: formData.identifier_value,
          expiry_date: formData.expiry_date || null,
          issuing_authority: formData.issuing_authority || null,
          notes: formData.notes || null,
          is_verified: formData.is_verified,
        };
        
        const { error } = await supabase
          .from('client_identifiers')
          .update(updateData)
          .eq('id', editingId);

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Identifier updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('client_identifiers')
          .insert(submitData);

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Identifier added successfully",
        });
      }

      resetForm();
      setDialogOpen(false);
      fetchIdentifiers();
    } catch (error: any) {
      console.error('Error saving identifier:', error);
      const errorMessage = error?.message?.includes('duplicate') || error?.code === '23505' 
        ? "This identifier value already exists. Please use a different value."
        : "Failed to save identifier. Please try again.";
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleEdit = (identifier: ClientIdentifier) => {
    setEditingId(identifier.id);
    setFormData({
      identifier_type: identifier.identifier_type,
      identifier_value: identifier.identifier_value,
      expiry_date: identifier.expiry_date || '',
      issuing_authority: identifier.issuing_authority || '',
      notes: identifier.notes || '',
      is_verified: identifier.is_verified,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this identifier?')) return;
    
    try {
      const { error } = await supabase
        .from('client_identifiers')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Identifier deleted successfully",
      });
      
      fetchIdentifiers();
    } catch (error) {
      console.error('Error deleting identifier:', error);
      toast({
        title: "Error",
        description: "Failed to delete identifier",
        variant: "destructive",
      });
    }
  };

  const toggleVerification = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('client_identifiers')
        .update({
          is_verified: !currentStatus,
          verified_at: !currentStatus ? new Date().toISOString() : null,
        })
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: `Identifier ${!currentStatus ? 'verified' : 'unverified'} successfully`,
      });
      
      fetchIdentifiers();
    } catch (error) {
      console.error('Error updating verification:', error);
      toast({
        title: "Error",
        description: "Failed to update verification status",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      identifier_type: '',
      identifier_value: '',
      expiry_date: '',
      issuing_authority: '',
      notes: '',
      is_verified: false,
    });
    setEditingId(null);
  };

  const getIdentifierTypeLabel = (type: string) => {
    return IDENTIFIER_TYPES.find(t => t.value === type)?.label || type;
  };

  if (loading) {
    return <div className="p-4">Loading identifiers...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Client Identifiers</h3>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Identifier
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingId ? 'Edit Identifier' : 'Add New Identifier'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="identifier_type">Identifier Type *</Label>
                <Select
                  value={formData.identifier_type}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, identifier_type: value }))}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select identifier type" />
                  </SelectTrigger>
                  <SelectContent>
                    {IDENTIFIER_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="identifier_value">Identifier Value *</Label>
                <Input
                  id="identifier_value"
                  value={formData.identifier_value}
                  onChange={(e) => setFormData(prev => ({ ...prev, identifier_value: e.target.value }))}
                  required
                  placeholder="Enter identifier value"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expiry_date">Expiry Date</Label>
                <Input
                  id="expiry_date"
                  type="date"
                  value={formData.expiry_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, expiry_date: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="issuing_authority">Issuing Authority</Label>
                <Input
                  id="issuing_authority"
                  value={formData.issuing_authority}
                  onChange={(e) => setFormData(prev => ({ ...prev, issuing_authority: e.target.value }))}
                  placeholder="e.g., Department of Transport"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional notes..."
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_verified"
                  checked={formData.is_verified}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_verified: checked }))}
                />
                <Label htmlFor="is_verified">Mark as verified</Label>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {editingId ? 'Update' : 'Add'} Identifier
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {identifiers.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              No identifiers found. Click "Add Identifier" to add the first one.
            </CardContent>
          </Card>
        ) : (
          identifiers.map((identifier) => (
            <Card key={identifier.id}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-base">
                      {getIdentifierTypeLabel(identifier.identifier_type)}
                    </CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={identifier.is_verified ? "default" : "secondary"}>
                        {identifier.is_verified ? (
                          <>
                            <ShieldCheck className="h-3 w-3 mr-1" />
                            Verified
                          </>
                        ) : (
                          <>
                            <Shield className="h-3 w-3 mr-1" />
                            Unverified
                          </>
                        )}
                      </Badge>
                      {identifier.expiry_date && (
                        <Badge variant="outline">
                          Expires: {format(new Date(identifier.expiry_date), 'MMM dd, yyyy')}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleVerification(identifier.id, identifier.is_verified)}
                      title={identifier.is_verified ? "Mark as unverified" : "Mark as verified"}
                    >
                      {identifier.is_verified ? <Shield className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(identifier)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(identifier.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  <div>
                    <Label className="text-sm font-medium">Value:</Label>
                    <p className="text-sm text-muted-foreground">{identifier.identifier_value}</p>
                  </div>
                  {identifier.issuing_authority && (
                    <div>
                      <Label className="text-sm font-medium">Issuing Authority:</Label>
                      <p className="text-sm text-muted-foreground">{identifier.issuing_authority}</p>
                    </div>
                  )}
                  {identifier.notes && (
                    <div>
                      <Label className="text-sm font-medium">Notes:</Label>
                      <p className="text-sm text-muted-foreground">{identifier.notes}</p>
                    </div>
                  )}
                  <div>
                    <Label className="text-sm font-medium">Added:</Label>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(identifier.created_at), 'MMM dd, yyyy')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};