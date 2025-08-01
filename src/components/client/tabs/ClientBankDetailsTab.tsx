import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Edit, Building, Plus, Save, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Client {
  id: string;
  bank_name?: string | null;
  bank_branch?: string | null;
  bank_account_number?: string | null;
}

interface ClientBankDetailsTabProps {
  client: Client;
}

export const ClientBankDetailsTab = ({ client }: ClientBankDetailsTabProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    bank_name: client.bank_name || '',
    bank_branch: client.bank_branch || '',
    bank_account_number: client.bank_account_number || '',
  });
  const { toast } = useToast();

  const handleSave = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('clients')
        .update({
          bank_name: formData.bank_name || null,
          bank_branch: formData.bank_branch || null,
          bank_account_number: formData.bank_account_number || null,
        })
        .eq('id', client.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Bank details updated successfully",
      });
      
      setIsEditing(false);
      // Refresh the page to show updates
      window.location.reload();
    } catch (error) {
      console.error('Error updating bank details:', error);
      toast({
        title: "Error",
        description: "Failed to update bank details",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      bank_name: client.bank_name || '',
      bank_branch: client.bank_branch || '',
      bank_account_number: client.bank_account_number || '',
    });
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-blue-600">
              <Building className="h-5 w-5" />
              EDIT BANK ACCOUNT DETAILS
            </CardTitle>
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
              <Button variant="outline" onClick={handleCancel}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="bank_name">Bank Name</Label>
                  <Input
                    id="bank_name"
                    value={formData.bank_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, bank_name: e.target.value }))}
                    placeholder="Enter bank name"
                  />
                </div>
                <div>
                  <Label htmlFor="bank_branch">Bank Branch</Label>
                  <Input
                    id="bank_branch"
                    value={formData.bank_branch}
                    onChange={(e) => setFormData(prev => ({ ...prev, bank_branch: e.target.value }))}
                    placeholder="Enter branch name"
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="bank_account_number">Account Number</Label>
                  <Input
                    id="bank_account_number"
                    value={formData.bank_account_number}
                    onChange={(e) => setFormData(prev => ({ ...prev, bank_account_number: e.target.value }))}
                    placeholder="Enter account number"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-blue-600">
            <Building className="h-5 w-5" />
            BANK ACCOUNT DETAILS
          </CardTitle>
          <Button variant="outline" onClick={() => setIsEditing(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Bank Details
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Bank Name</Label>
                <p className="text-sm font-medium">{client.bank_name || 'Not provided'}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Bank Branch</Label>
                <p className="text-sm">{client.bank_branch || 'Not provided'}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Account Number</Label>
                <p className="text-sm font-mono">{client.bank_account_number || 'Not provided'}</p>
              </div>
            </div>
          </div>
          
          {(!client.bank_name && !client.bank_branch && !client.bank_account_number) && (
            <div className="text-center py-8 text-muted-foreground">
              <Building className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No bank account details provided</p>
              <Button className="mt-4" onClick={() => setIsEditing(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Bank Details
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Additional Banking Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Account Type</Label>
              <p className="text-sm">Savings Account</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Account Status</Label>
              <p className="text-sm">Active</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Primary Account</Label>
              <p className="text-sm">Yes</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};