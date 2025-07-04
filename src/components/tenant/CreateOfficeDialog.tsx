import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useCreateOffice, useOffices } from "@/hooks/useOfficeManagement";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface CreateOfficeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const CreateOfficeDialog = ({ open, onOpenChange, onSuccess }: CreateOfficeDialogProps) => {
  const [formData, setFormData] = useState({
    office_name: "",
    office_code: "",
    office_type: "branch" as const,
    phone: "",
    email: "",
    branch_manager_id: "",
    parent_office_id: "",
    is_active: true,
    address: {
      street: "",
      city: "",
      state: "",
      postal_code: "",
      country: ""
    }
  });

  const createOfficeMutation = useCreateOffice();
  const { data: offices = [] } = useOffices();
  const { profile } = useAuth();

  // Fetch available staff for branch manager selection
  const { data: staff = [], isLoading: staffLoading } = useQuery({
    queryKey: ['tenant-staff', profile?.tenant_id],
    queryFn: async () => {
      if (!profile?.tenant_id) return [];
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, role')
        .eq('tenant_id', profile.tenant_id)
        .eq('is_active', true)
        .in('role', ['tenant_admin', 'loan_officer'])
        .order('first_name');
      
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.tenant_id && open,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData = {
      ...formData,
      branch_manager_id: formData.branch_manager_id || undefined,
      parent_office_id: formData.parent_office_id || undefined,
    };

    await createOfficeMutation.mutateAsync(submitData);
    
    // Reset form
    setFormData({
      office_name: "",
      office_code: "",
      office_type: "branch",
      phone: "",
      email: "",
      branch_manager_id: "",
      parent_office_id: "",
      is_active: true,
      address: {
        street: "",
        city: "",
        state: "",
        postal_code: "",
        country: ""
      }
    });
    
    onSuccess();
  };

  const officeTypes = [
    { value: 'head_office', label: 'Head Office' },
    { value: 'branch', label: 'Branch' },
    { value: 'sub_branch', label: 'Sub Branch' },
    { value: 'collection_center', label: 'Collection Center' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Office</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="office_name">Office Name *</Label>
              <Input
                id="office_name"
                value={formData.office_name}
                onChange={(e) => setFormData(prev => ({ ...prev, office_name: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="office_code">Office Code *</Label>
              <Input
                id="office_code"
                value={formData.office_code}
                onChange={(e) => setFormData(prev => ({ ...prev, office_code: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="office_type">Office Type</Label>
              <Select 
                value={formData.office_type} 
                onValueChange={(value: any) => setFormData(prev => ({ ...prev, office_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {officeTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="parent_office">Parent Office</Label>
              <Select 
                value={formData.parent_office_id} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, parent_office_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select parent office (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {offices
                    .filter(office => office.office_type === 'head_office' || office.office_type === 'branch')
                    .map((office) => (
                      <SelectItem key={office.id} value={office.id}>
                        {office.office_name} ({office.office_code})
                      </SelectItem>
                    ))
                  }
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
          </div>

          {/* Branch Manager */}
          <div className="space-y-2">
            <Label htmlFor="branch_manager">Branch Manager</Label>
            <Select 
              value={formData.branch_manager_id} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, branch_manager_id: value }))}
              disabled={staffLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select branch manager (optional)" />
              </SelectTrigger>
              <SelectContent>
                {staff.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.first_name} {member.last_name} - {member.role?.replace('_', ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Address */}
          <div className="space-y-4">
            <Label className="text-base font-semibold">Address</Label>
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="street">Street Address</Label>
                <Textarea
                  id="street"
                  value={formData.address.street}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    address: { ...prev.address, street: e.target.value }
                  }))}
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.address.city}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      address: { ...prev.address, city: e.target.value }
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State/Province</Label>
                  <Input
                    id="state"
                    value={formData.address.state}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      address: { ...prev.address, state: e.target.value }
                    }))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="postal_code">Postal Code</Label>
                  <Input
                    id="postal_code"
                    value={formData.address.postal_code}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      address: { ...prev.address, postal_code: e.target.value }
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={formData.address.country}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      address: { ...prev.address, country: e.target.value }
                    }))}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
            />
            <Label htmlFor="is_active">Active Office</Label>
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createOfficeMutation.isPending}
            >
              {createOfficeMutation.isPending ? "Creating..." : "Create Office"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};