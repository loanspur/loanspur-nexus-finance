import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ClientIdentity } from "@/hooks/useClientIdentities";

interface ClientIdentityFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Omit<ClientIdentity, 'id' | 'tenant_id' | 'client_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  editingIdentity?: ClientIdentity | null;
}

const identifierTypes = [
  { value: 'email', label: 'Email Address' },
  { value: 'phone', label: 'Phone Number' },
  { value: 'passport', label: 'Passport Number' },
  { value: 'driving_license', label: 'Driving License' },
  { value: 'national_id', label: 'National ID' }
];

export const ClientIdentityForm = ({ open, onOpenChange, onSubmit, editingIdentity }: ClientIdentityFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    identifier_type: editingIdentity?.identifier_type || 'email',
    identifier_value: editingIdentity?.identifier_value || '',
    description: editingIdentity?.description || '',
    is_verified: editingIdentity?.is_verified || false
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.identifier_type || !formData.identifier_value.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        identifier_type: formData.identifier_type as any,
        identifier_value: formData.identifier_value.trim(),
        description: formData.description || undefined,
        is_verified: formData.is_verified,
        verified_at: undefined,
        verified_by: undefined
      });
      
      setFormData({
        identifier_type: 'email',
        identifier_value: '',
        description: '',
        is_verified: false
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Error submitting identity:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPlaceholder = (type: string) => {
    switch (type) {
      case 'email': return 'john.doe@example.com';
      case 'phone': return '+254700000000';
      case 'passport': return 'A12345678';
      case 'driving_license': return 'DL123456789';
      case 'national_id': return '12345678';
      default: return '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editingIdentity ? 'Edit Identity' : 'Add Identity'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="identifier_type">Identifier Type</Label>
            <Select
              value={formData.identifier_type}
              onValueChange={(value) => setFormData(prev => ({ 
                ...prev, 
                identifier_type: value as ClientIdentity['identifier_type'],
                identifier_value: '' // Clear value when type changes
              }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select identifier type" />
              </SelectTrigger>
              <SelectContent>
                {identifierTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="identifier_value">Identifier Value</Label>
            <Input
              id="identifier_value"
              value={formData.identifier_value}
              onChange={(e) => setFormData(prev => ({ ...prev, identifier_value: e.target.value }))}
              placeholder={getPlaceholder(formData.identifier_type)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Additional notes about this identifier"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : editingIdentity ? 'Update' : 'Add'} Identity
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};