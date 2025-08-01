import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Users, User, Calendar, Phone, Mail, Building, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface Client {
  id: string;
  first_name: string;
  last_name: string;
  client_number: string;
  loan_officer_id?: string | null;
  created_at: string;
}

interface ClientLoanOfficerTabProps {
  client: Client;
}

export const ClientLoanOfficerTab = ({ client }: ClientLoanOfficerTabProps) => {
  const [selectedOfficer, setSelectedOfficer] = useState<string>("");
  const [updating, setUpdating] = useState(false);
  const { toast } = useToast();

  // Mock loan officers data - in real app, this would come from the profiles table
  const loanOfficers = [
    {
      id: "officer1",
      name: "John Doe",
      email: "john.doe@example.com",
      phone: "+254700000001",
      office: "Main Branch",
      active_clients: 45,
      portfolio_value: 2500000
    },
    {
      id: "officer2", 
      name: "Jane Smith",
      email: "jane.smith@example.com",
      phone: "+254700000002",
      office: "Downtown Branch",
      active_clients: 38,
      portfolio_value: 1800000
    },
    {
      id: "officer3",
      name: "Peter Mwangi",
      email: "peter.mwangi@example.com", 
      phone: "+254700000003",
      office: "Westlands Branch",
      active_clients: 52,
      portfolio_value: 3200000
    }
  ];

  const currentOfficer = loanOfficers.find(o => o.id === (client as any).loan_officer_id);

  const handleAssignOfficer = async () => {
    if (!selectedOfficer) {
      toast({
        title: "Error",
        description: "Please select a loan officer",
        variant: "destructive"
      });
      return;
    }

    setUpdating(true);
    try {
      // For demo purposes, just show success message
      // In real implementation, you'd update the clients table
      console.log('Assigning loan officer:', selectedOfficer, 'to client:', client.id);

      toast({
        title: "Success",
        description: "Assignment logged successfully (demo mode)",
      });

      setSelectedOfficer("");

    } catch (error) {
      console.error('Assignment error:', error);
      toast({
        title: "Error", 
        description: "Failed to log assignment (demo mode)",
        variant: "destructive"
      });
    } finally {
      setUpdating(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Current Assignment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Current Loan Officer Assignment
          </CardTitle>
        </CardHeader>
        <CardContent>
          {currentOfficer ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">{currentOfficer.name}</h3>
                    <p className="text-sm text-muted-foreground">Loan Officer</p>
                    <Badge variant="default" className="mt-1">Active</Badge>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  <Edit className="h-4 w-4 mr-2" />
                  Change Officer
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{currentOfficer.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{currentOfficer.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <span>{currentOfficer.office}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm text-muted-foreground">Active Clients</Label>
                    <p className="text-lg font-semibold">{currentOfficer.active_clients}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Portfolio Value</Label>
                    <p className="text-lg font-semibold text-success">
                      {formatCurrency(currentOfficer.portfolio_value)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No Loan Officer Assigned</h3>
              <p className="text-muted-foreground mb-4">This client doesn't have a loan officer assigned yet.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assign New Officer */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {currentOfficer ? 'Change' : 'Assign'} Loan Officer
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="officer">Select Loan Officer</Label>
            <Select value={selectedOfficer} onValueChange={setSelectedOfficer}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a loan officer" />
              </SelectTrigger>
              <SelectContent>
                {loanOfficers.map((officer) => (
                  <SelectItem key={officer.id} value={officer.id}>
                    <div className="flex items-center justify-between w-full">
                      <div>
                        <p className="font-medium">{officer.name}</p>
                        <p className="text-sm text-muted-foreground">{officer.office}</p>
                      </div>
                      <div className="text-right text-sm">
                        <p>{officer.active_clients} clients</p>
                        <p className="text-muted-foreground">{formatCurrency(officer.portfolio_value)}</p>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button 
            onClick={handleAssignOfficer}
            disabled={updating || !selectedOfficer}
            className="w-full"
          >
            {updating ? "Updating..." : currentOfficer ? "Change Officer" : "Assign Officer"}
          </Button>
        </CardContent>
      </Card>

      {/* Assignment History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Assignment History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b">
              <div>
                <p className="font-medium">Client Registration</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(client.created_at), 'PPP')}
                </p>
              </div>
              <Badge variant="secondary">Initial Setup</Badge>
            </div>
            {currentOfficer && (
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium">Assigned to {currentOfficer.name}</p>
                  <p className="text-sm text-muted-foreground">Current assignment</p>
                </div>
                <Badge variant="default">Active</Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};