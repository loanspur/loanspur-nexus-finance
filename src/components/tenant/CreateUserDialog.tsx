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
import { useSystemRoles, useCombinedRoles } from "@/hooks/useSystemRoles";
import { useCustomRoles } from "@/hooks/useCustomRoles";

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
    role: "",
    customRoleId: "",
    officeId: "",
    isLoanOfficer: false
  });
  const { toast } = useToast();
  const { profile } = useAuth();
  const { data: offices = [] } = useOffices();
  const { sendUserInvitation } = usePasswordReset();
  const { currentTenant } = useTenant();
  const { data: systemRoles = [] } = useSystemRoles();
  const { data: customRoles = [] } = useCustomRoles();

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
      
      // Add custom role if selected
      if (formData.customRoleId) {
        metadata.customRoleId = formData.customRoleId;
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
        role: "",
        customRoleId: "",
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
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New User</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Send an invitation email to create a new user account with the specified role and permissions.
          </p>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-foreground border-b pb-2">Personal Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                  placeholder="Enter first name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                  placeholder="Enter last name"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="user@example.com"
                required
              />
              <p className="text-xs text-muted-foreground">
                An invitation email will be sent to this address
              </p>
            </div>
          </div>

          {/* Role & Permissions Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-foreground border-b pb-2">Role & Permissions</h3>
            
            <div className="space-y-2">
              <Label htmlFor="role">System Role *</Label>
              <Select 
                value={formData.role} 
                onValueChange={(value) => setFormData(prev => ({ 
                  ...prev, 
                  role: value,
                  isLoanOfficer: value === "loan_officer",
                  customRoleId: "" // Reset custom role when system role changes
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a system role" />
                </SelectTrigger>
                <SelectContent>
                  {systemRoles.map(role => (
                    <SelectItem key={role.value} value={role.value}>
                      <div className="flex flex-col items-start">
                        <span>{role.label}</span>
                        <span className="text-xs text-muted-foreground">
                          {role.value === 'tenant_admin' && 'Full administrative access'}
                          {role.value === 'loan_officer' && 'Loan management and client services'}
                          {role.value === 'client' && 'Client portal access only'}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {customRoles.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="customRole">Additional Custom Role (Optional)</Label>
                <Select 
                  value={formData.customRoleId || undefined} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, customRoleId: value || "" }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select additional permissions" />
                  </SelectTrigger>
                  <SelectContent>
                    {customRoles
                      .filter(role => role.is_active)
                      .map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          <div className="flex flex-col items-start">
                            <span>{role.name}</span>
                            {role.description && (
                              <span className="text-xs text-muted-foreground">{role.description}</span>
                            )}
                          </div>
                        </SelectItem>
                      ))
                    }
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Custom roles provide additional permissions beyond the system role
                </p>
              </div>
            )}
          </div>

          {/* Office Assignment Section */}
          {formData.role === "loan_officer" && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-foreground border-b pb-2">Office Assignment</h3>
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
                          <div className="flex flex-col items-start">
                            <span>{office.office_name}</span>
                            <span className="text-xs text-muted-foreground">
                              Code: {office.office_code} • Type: {office.office_type}
                            </span>
                          </div>
                        </SelectItem>
                      ))
                    }
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Loan officers must be assigned to an office for client management
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-4 pt-6 border-t">
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