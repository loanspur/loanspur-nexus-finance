import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Edit, Building } from "lucide-react";

interface Client {
  id: string;
  bank_name?: string | null;
  bank_branch?: string | null;
  bank_account_number?: string | null;
}

interface ClientBankDetailsTabProps {
  client: Client;
  onEdit?: () => void;
}

export const ClientBankDetailsTab = ({ client, onEdit }: ClientBankDetailsTabProps) => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-blue-600">
            <Building className="h-5 w-5" />
            BANK ACCOUNT DETAILS
          </CardTitle>
          <Button variant="outline" onClick={onEdit}>
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
              <Button className="mt-4" onClick={onEdit}>
                <Edit className="h-4 w-4 mr-2" />
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
              <p className="text-sm">Not specified</p>
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