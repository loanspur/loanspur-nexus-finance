import { useState, useEffect } from "react";
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
  const [loanOfficers, setLoanOfficers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchLoanOfficers = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .in('role', ['loan_officer', 'tenant_admin'])
          .eq('is_active', true);

        if (error) {
          console.error('Error fetching loan officers:', error);
          return;
        }

        setLoanOfficers(data || []);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLoanOfficers();
  }, []);

  const currentOfficer = loanOfficers.find(o => o.id === client.loan_officer_id);

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
                    <h3 className="font-medium">{currentOfficer.first_name} {currentOfficer.last_name}</h3>
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
                    <span>{currentOfficer.email || 'No email provided'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{currentOfficer.phone || 'No phone provided'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <span>{currentOfficer.office_name || 'No office assigned'}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm text-muted-foreground">Role</Label>
                    <p className="text-lg font-semibold capitalize">{currentOfficer.role?.replace('_', ' ')}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Joined</Label>
                    <p className="text-lg font-semibold">
                      {format(new Date(currentOfficer.created_at), 'MMM yyyy')}
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
                {loading ? (
                  <SelectItem value="loading" disabled>Loading officers...</SelectItem>
                ) : loanOfficers.length === 0 ? (
                  <SelectItem value="none" disabled>No loan officers available</SelectItem>
                ) : (
                  loanOfficers.map((officer) => (
                    <SelectItem key={officer.id} value={officer.id}>
                      <div className="flex items-center justify-between w-full">
                        <div>
                          <p className="font-medium">{officer.first_name} {officer.last_name}</p>
                          <p className="text-sm text-muted-foreground">{officer.email}</p>
                        </div>
                        <div className="text-right text-sm">
                          <p className="capitalize">{officer.role?.replace('_', ' ')}</p>
                          <p className="text-muted-foreground">{officer.office_name || 'No office'}</p>
                        </div>
                      </div>
                    </SelectItem>
                  ))
                )}
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
                  <p className="font-medium">Assigned to {currentOfficer.first_name} {currentOfficer.last_name}</p>
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