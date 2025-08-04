import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useOffices } from "@/hooks/useOfficeManagement";
import { usePasswordReset } from "@/hooks/usePasswordReset";
import { useTenant } from "@/contexts/TenantContext";
import { Constants } from "@/integrations/supabase/types";

interface CreateUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const CreateUserDialog = ({ open, onOpenChange, onSuccess }: CreateUserDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    role: "loan_officer" as "super_admin" | "tenant_admin" | "loan_officer" | "client",
    officeId: "",
    isLoanOfficer: false
  });
  const { toast } = useToast();
  const { profile } = useAuth();
  const { data: offices = [] } = useOffices();
  const { sendUserInvitation } = usePasswordReset();
  const { currentTenant } = useTenant();

  // Get available user roles from database enum
  const availableRoles = Constants.public.Enums.user_role.filter(role => role !== 'super_admin');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate required fields
      if (!profile?.tenant_id || !currentTenant) {
        throw new Error('User profile or tenant information not available. Please refresh and try again.');
      }

      if (!formData.email || !formData.firstName || !formData.lastName || !formData.role) {
        throw new Error('Please fill in all required fields.');
      }

      // For loan officers, office assignment is required
      if (formData.role === "loan_officer" && !formData.officeId) {
        throw new Error('Please assign an office for loan officers.');
      }

      // Build metadata for office assignment if applicable
      const metadata: any = {};
      if (formData.role === "loan_officer" && formData.officeId) {
        metadata.officeId = formData.officeId;
        metadata.roleInOffice = 'loan_officer';
      }

      // Send user invitation instead of creating directly
      await sendUserInvitation.mutateAsync({
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        role: formData.role as 'tenant_admin' | 'loan_officer' | 'client',
        tenantId: profile.tenant_id,
        tenantName: currentTenant.name,
        tenantSubdomain: currentTenant.subdomain || '',
        invitedBy: profile.id,
        metadata,
      });

      // Reset form
      setFormData({
        email: "",
        firstName: "",
        lastName: "",
        role: "loan_officer" as "super_admin" | "tenant_admin" | "loan_officer" | "client",
        officeId: "",
        isLoanOfficer: false
      });
      
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send invitation",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New User</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              required
            />
          </div>


          <div className="space-y-2">
            <Label htmlFor="role">System Role</Label>
            <Select 
              value={formData.role} 
              onValueChange={(value) => setFormData(prev => ({ 
                ...prev, 
                role: value as "super_admin" | "tenant_admin" | "loan_officer" | "client",
                isLoanOfficer: value === "loan_officer"
              }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a system role" />
              </SelectTrigger>
              <SelectContent>
                {availableRoles.map(role => (
                  <SelectItem key={role} value={role}>
                    {role === 'tenant_admin' ? 'Tenant Admin' : 
                     role === 'loan_officer' ? 'Loan Officer' : 
                     role === 'client' ? 'Client' : role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {formData.role === "loan_officer" && (
            <div className="space-y-2">
              <Label htmlFor="office">Assign to Office *</Label>
              <Select value={formData.officeId} onValueChange={(value) => setFormData(prev => ({ ...prev, officeId: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an office" />
                </SelectTrigger>
                <SelectContent>
                  {offices
                    .filter(office => office.is_active)
                    .map((office) => (
                      <SelectItem key={office.id} value={office.id}>
                        {office.office_name} ({office.office_code})
                      </SelectItem>
                    ))
                  }
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex justify-end gap-4 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || sendUserInvitation.isPending}>
              {loading || sendUserInvitation.isPending ? "Sending Invitation..." : "Send Invitation"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};