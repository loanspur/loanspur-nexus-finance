import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Edit, Users, Save, X, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Client {
  id: string;
  next_of_kin_name?: string | null;
  next_of_kin_phone?: string | null;
  next_of_kin_email?: string | null;
  next_of_kin_address?: string | null;
  next_of_kin_relationship?: string | null;
}

interface ClientNextOfKinTabProps {
  client: Client;
}

const relationshipOptions = [
  'Spouse',
  'Parent',
  'Child',
  'Sibling',
  'Relative',
  'Friend',
  'Guardian',
  'Other'
];

export const ClientNextOfKinTab = ({ client }: ClientNextOfKinTabProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    next_of_kin_name: client.next_of_kin_name || '',
    next_of_kin_phone: client.next_of_kin_phone || '',
    next_of_kin_email: client.next_of_kin_email || '',
    next_of_kin_address: client.next_of_kin_address || '',
    next_of_kin_relationship: client.next_of_kin_relationship || '',
  });
  const { toast } = useToast();

  const handleSave = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('clients')
        .update({
          next_of_kin_name: formData.next_of_kin_name || null,
          next_of_kin_phone: formData.next_of_kin_phone || null,
          next_of_kin_email: formData.next_of_kin_email || null,
          next_of_kin_address: formData.next_of_kin_address || null,
          next_of_kin_relationship: formData.next_of_kin_relationship || null,
        })
        .eq('id', client.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Next of kin details updated successfully",
      });
      
      setIsEditing(false);
      window.location.reload();
    } catch (error) {
      console.error('Error updating next of kin details:', error);
      toast({
        title: "Error",
        description: "Failed to update next of kin details",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      next_of_kin_name: client.next_of_kin_name || '',
      next_of_kin_phone: client.next_of_kin_phone || '',
      next_of_kin_email: client.next_of_kin_email || '',
      next_of_kin_address: client.next_of_kin_address || '',
      next_of_kin_relationship: client.next_of_kin_relationship || '',
    });
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              EDIT NEXT OF KIN INFORMATION
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
                  <Label htmlFor="next_of_kin_name">Full Name</Label>
                  <Input
                    id="next_of_kin_name"
                    value={formData.next_of_kin_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, next_of_kin_name: e.target.value }))}
                    placeholder="Enter full name"
                  />
                </div>
                <div>
                  <Label htmlFor="next_of_kin_relationship">Relationship</Label>
                  <Select value={formData.next_of_kin_relationship} onValueChange={(value) => setFormData(prev => ({ ...prev, next_of_kin_relationship: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select relationship" />
                    </SelectTrigger>
                    <SelectContent>
                      {relationshipOptions.map(option => (
                        <SelectItem key={option} value={option.toLowerCase()}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="next_of_kin_phone">Phone Number</Label>
                  <Input
                    id="next_of_kin_phone"
                    value={formData.next_of_kin_phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, next_of_kin_phone: e.target.value }))}
                    placeholder="Enter phone number"
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="next_of_kin_email">Email Address</Label>
                  <Input
                    id="next_of_kin_email"
                    type="email"
                    value={formData.next_of_kin_email}
                    onChange={(e) => setFormData(prev => ({ ...prev, next_of_kin_email: e.target.value }))}
                    placeholder="Enter email address"
                  />
                </div>
                <div>
                  <Label htmlFor="next_of_kin_address">Address</Label>
                  <Input
                    id="next_of_kin_address"
                    value={formData.next_of_kin_address}
                    onChange={(e) => setFormData(prev => ({ ...prev, next_of_kin_address: e.target.value }))}
                    placeholder="Enter address"
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
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            NEXT OF KIN INFORMATION
          </CardTitle>
          <Button variant="outline" onClick={() => setIsEditing(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Next of Kin
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Full Name</Label>
                <p className="text-sm font-medium">{client.next_of_kin_name || 'Not provided'}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Relationship</Label>
                <p className="text-sm capitalize">{client.next_of_kin_relationship || 'Not specified'}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Phone Number</Label>
                <p className="text-sm">{client.next_of_kin_phone || 'Not provided'}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Email Address</Label>
                <p className="text-sm">{client.next_of_kin_email || 'Not provided'}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Address</Label>
                <p className="text-sm">{client.next_of_kin_address || 'Not provided'}</p>
              </div>
            </div>
          </div>
          
          {(!client.next_of_kin_name && !client.next_of_kin_phone) && (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No next of kin information provided</p>
              <Button className="mt-4" onClick={() => setIsEditing(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Next of Kin Details
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Emergency Contact Guidelines</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm text-muted-foreground">
            <p>
              Next of kin information is crucial for emergency situations and account recovery processes.
              Please ensure the following:
            </p>
            <ul className="list-disc list-inside space-y-2">
              <li>Provide accurate and up-to-date contact information</li>
              <li>Ensure the next of kin is aware of their designation</li>
              <li>Update information promptly when changes occur</li>
              <li>Verify relationship documentation if required</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};