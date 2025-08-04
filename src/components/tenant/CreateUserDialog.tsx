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
import { useSystemRoles } from "@/hooks/useSystemRoles";

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
    officeId: "",
    isLoanOfficer: false
  });
  const { toast } = useToast();
  const { profile } = useAuth();
  const { data: offices = [] } = useOffices();
  const { sendUserInvitation } = usePasswordReset();
  const { currentTenant } = useTenant();
  const { data: systemRoles = [] } = useSystemRoles();

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

      // Office assignment is required for all users
      if (!formData.officeId) {
        throw new Error('Please select a domicile office for the user.');
      }

      // Build metadata for office assignment and loan officer status
      const metadata: any = {};
      if (formData.officeId) {
        metadata.officeId = formData.officeId;
        metadata.roleInOffice = formData.role;
      }
      
      // Set loan officer flag
      metadata.isLoanOfficer = formData.isLoanOfficer;

      // Send user invitation
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
                  isLoanOfficer: value === "loan_officer" || prev.isLoanOfficer
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

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isLoanOfficer"
                checked={formData.isLoanOfficer}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isLoanOfficer: !!checked }))}
              />
              <Label htmlFor="isLoanOfficer" className="text-sm">
                Assign loan officer responsibilities
              </Label>
            </div>
          </div>

          {/* Office Domicile Section - Required for all users */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-foreground border-b pb-2">
              Office Domicile
            </h3>
            <div className="space-y-2">
              <Label htmlFor="office">Select Domicile Office *</Label>
              <Select value={formData.officeId} onValueChange={(value) => setFormData(prev => ({ ...prev, officeId: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select the user's home office" />
                </SelectTrigger>
                <SelectContent>
                  {offices
                    .filter(office => office.is_active)
                    .map((office) => (
                      <SelectItem key={office.id} value={office.id}>
                        <div className="flex flex-col items-start">
                          <span className="font-medium">{office.office_name}</span>
                          <span className="text-xs text-muted-foreground">
                            Code: {office.office_code} • Type: {office.office_type}
                            {office.parent_office_id && ' • Sub-office'}
                          </span>
                        </div>
                      </SelectItem>
                    ))
                  }
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                The office where this user will be primarily based and report to
              </p>
            </div>
          </div>

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