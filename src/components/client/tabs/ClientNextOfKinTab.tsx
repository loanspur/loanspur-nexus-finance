import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Edit, Users } from "lucide-react";

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
  onEdit?: () => void;
}

export const ClientNextOfKinTab = ({ client, onEdit }: ClientNextOfKinTabProps) => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            NEXT OF KIN INFORMATION
          </CardTitle>
          <Button variant="outline" onClick={onEdit}>
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
              <Button className="mt-4" onClick={onEdit}>
                <Edit className="h-4 w-4 mr-2" />
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