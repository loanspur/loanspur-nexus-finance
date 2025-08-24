import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { useCurrency } from "@/contexts/CurrencyContext";

interface Client {
  id: string;
  client_number: string;
  first_name: string;
  last_name: string;
  email?: string | null;
  phone?: string | null;
  national_id?: string | null;
  date_of_birth?: string | null;
  gender?: string | null;
  address?: any;
  occupation?: string | null;
  monthly_income?: number | null;
  profile_picture_url?: string | null;
  is_active: boolean;
  approval_status?: string | null;
  kyc_status?: string | null;
  timely_repayment_rate?: number | null;
  created_at: string;
  mifos_client_id?: number | null;
}

interface ClientGeneralTabProps {
  client: Client;
}

export const ClientGeneralTab = ({ client }: ClientGeneralTabProps) => {
  const { formatAmount: formatCurrency } = useCurrency();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Client Number</Label>
                <p className="text-sm">{client.client_number}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">External ID</Label>
                <p className="text-sm">{client.mifos_client_id || 'Not assigned'}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">First Name</Label>
                <p className="text-sm">{client.first_name}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Last Name</Label>
                <p className="text-sm">{client.last_name}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Gender</Label>
                <p className="text-sm capitalize">{client.gender || 'Not specified'}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Date of Birth</Label>
                <p className="text-sm">
                  {client.date_of_birth ? format(new Date(client.date_of_birth), 'PPP') : 'Not specified'}
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Mobile Number</Label>
                <p className="text-sm">{client.phone || 'Not provided'}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Email Address</Label>
                <p className="text-sm">{client.email || 'Not provided'}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">National ID</Label>
                <p className="text-sm">{client.national_id || 'Not provided'}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Occupation</Label>
                <p className="text-sm">{client.occupation || 'Not specified'}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Monthly Income</Label>
                <p className="text-sm">{formatCurrency(client.monthly_income)}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Registration Date</Label>
                <p className="text-sm">{format(new Date(client.created_at), 'PPP')}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Address Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Address Line 1</Label>
                <p className="text-sm">{client.address?.line1 || 'Not provided'}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Address Line 2</Label>
                <p className="text-sm">{client.address?.line2 || 'Not provided'}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">City</Label>
                <p className="text-sm">{client.address?.city || 'Not provided'}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">State/Province</Label>
                <p className="text-sm">{client.address?.state || 'Not provided'}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Postal Code</Label>
                <p className="text-sm">{client.address?.postal_code || 'Not provided'}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Country</Label>
                <p className="text-sm">{client.address?.country || 'Kenya'}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Approval Status</Label>
                <p className="text-sm capitalize">{client.approval_status || 'Pending'}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">KYC Status</Label>
                <p className="text-sm capitalize">{client.kyc_status || 'Pending'}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Account Status</Label>
                <p className="text-sm">{client.is_active ? 'Active' : 'Inactive'}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Repayment Rate</Label>
                <p className="text-sm">{client.timely_repayment_rate ? `${client.timely_repayment_rate}%` : 'N/A'}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};