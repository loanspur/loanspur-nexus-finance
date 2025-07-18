import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Edit, Info } from "lucide-react";

interface Client {
  id: string;
  employer_name?: string | null;
  employer_address?: string | null;
  job_title?: string | null;
  employment_start_date?: string | null;
  business_name?: string | null;
  business_type?: string | null;
  business_address?: string | null;
  business_registration_number?: string | null;
  nationality?: string | null;
  place_of_birth?: string | null;
  driving_license_number?: string | null;
  passport_number?: string | null;
}

interface ClientAdditionalInfoTabProps {
  client: Client;
}

export const ClientAdditionalInfoTab = ({ client }: ClientAdditionalInfoTabProps) => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Employment Information
          </CardTitle>
          <Button variant="outline">
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Employer Name</Label>
                <p className="text-sm">{client.employer_name || 'Not provided'}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Job Title</Label>
                <p className="text-sm">{client.job_title || 'Not provided'}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Employment Start Date</Label>
                <p className="text-sm">{client.employment_start_date || 'Not provided'}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Employer Address</Label>
                <p className="text-sm">{client.employer_address || 'Not provided'}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Business Information</CardTitle>
          <Button variant="outline">
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Business Name</Label>
                <p className="text-sm">{client.business_name || 'Not provided'}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Business Type</Label>
                <p className="text-sm">{client.business_type || 'Not provided'}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Registration Number</Label>
                <p className="text-sm">{client.business_registration_number || 'Not provided'}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Business Address</Label>
                <p className="text-sm">{client.business_address || 'Not provided'}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Personal Documents</CardTitle>
          <Button variant="outline">
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Nationality</Label>
                <p className="text-sm">{client.nationality || 'Not provided'}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Place of Birth</Label>
                <p className="text-sm">{client.place_of_birth || 'Not provided'}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Driving License Number</Label>
                <p className="text-sm">{client.driving_license_number || 'Not provided'}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Passport Number</Label>
                <p className="text-sm">{client.passport_number || 'Not provided'}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};