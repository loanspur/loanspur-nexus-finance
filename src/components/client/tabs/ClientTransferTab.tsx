import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRightLeft, Building, User, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface Client {
  id: string;
  first_name: string;
  last_name: string;
  client_number: string;
  office_id?: string | null;
}

interface ClientTransferTabProps {
  client: Client;
}

export const ClientTransferTab = ({ client }: ClientTransferTabProps) => {
  const [selectedOffice, setSelectedOffice] = useState<string>("");
  const [selectedStaff, setSelectedStaff] = useState<string>("");
  const [transferReason, setTransferReason] = useState<string>("");
  const [transferring, setTransferring] = useState(false);
  const { toast } = useToast();
  const { profile } = useAuth();

  const handleTransfer = async () => {
    if (!selectedOffice) {
      toast({
        title: "Error",
        description: "Please select an office to transfer to",
        variant: "destructive"
      });
      return;
    }

    setTransferring(true);
    try {
      // For now, we'll just show a success message
      // In a real implementation, you'd update the client's office assignment
      console.log('Transfer to office:', selectedOffice, 'with staff:', selectedStaff);


      toast({
        title: "Success",
        description: "Transfer action logged successfully (demo mode)",
      });

      // Reset form
      setSelectedOffice("");
      setSelectedStaff("");
      setTransferReason("");

    } catch (error) {
      console.error('Transfer error:', error);
      toast({
        title: "Error",
        description: "Failed to transfer client",
        variant: "destructive"
      });
    } finally {
      setTransferring(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5" />
            Transfer Client Between Branches
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Assignment */}
          <div className="bg-muted/20 p-4 rounded-lg">
            <h3 className="font-medium mb-2">Current Assignment</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <Label className="text-muted-foreground">Client</Label>
                <p className="font-medium">{client.first_name} {client.last_name}</p>
                <p className="text-muted-foreground">#{client.client_number}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Current Office</Label>
                <p className="font-medium">{client.office_id ? 'Office Assigned' : 'No Office Assigned'}</p>
              </div>
            </div>
          </div>

          {/* Transfer Form */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="office">Transfer to Office *</Label>
              <Select value={selectedOffice} onValueChange={setSelectedOffice}>
                <SelectTrigger>
                  <SelectValue placeholder="Select destination office" />
                </SelectTrigger>
                <SelectContent>
                  {/* Mock offices data for demo */}
                  <SelectItem value="office1">
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      Main Branch - MB001
                    </div>
                  </SelectItem>
                  <SelectItem value="office2">
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      Downtown Branch - DT002
                    </div>
                  </SelectItem>
                  <SelectItem value="office3">
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      Westlands Branch - WL003
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="staff">Assign to Staff (Optional)</Label>
              <Select value={selectedStaff} onValueChange={setSelectedStaff}>
                <SelectTrigger>
                  <SelectValue placeholder="Select staff member" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="staff1">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      John Doe - Loan Officer
                    </div>
                  </SelectItem>
                  <SelectItem value="staff2">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Jane Smith - Branch Manager
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="reason">Transfer Reason</Label>
              <Textarea
                id="reason"
                placeholder="Provide reason for transfer..."
                value={transferReason}
                onChange={(e) => setTransferReason(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex items-center gap-4 pt-4">
              <Button 
                onClick={handleTransfer}
                disabled={transferring}
                className="min-w-32"
              >
                {transferring ? "Transferring..." : "Transfer Client"}
              </Button>
              <Button variant="outline" onClick={() => {
                setSelectedOffice("");
                setSelectedStaff("");
                setTransferReason("");
              }}>
                Reset
              </Button>
            </div>
          </div>

          {/* Transfer History */}
          <div className="border-t pt-6">
            <h3 className="font-medium mb-4 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Transfer History
            </h3>
            <div className="text-sm text-muted-foreground">
              <p>No recent transfers found for this client.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};