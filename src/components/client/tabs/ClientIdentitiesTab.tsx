import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Trash2, IdCard } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Identity {
  id: string;
  document_type: string;
  document_number: string;
  description?: string;
  status: string;
  created_at: string;
}

interface ClientIdentitiesTabProps {
  clientId: string;
}

export const ClientIdentitiesTab = ({ clientId }: ClientIdentitiesTabProps) => {
  const [identities, setIdentities] = useState<Identity[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchIdentities();
  }, [clientId]);

  const fetchIdentities = async () => {
    try {
      setLoading(true);
      // Note: This would need a separate identities table in a real implementation
      // For now, we'll show sample data structure
      setIdentities([
        {
          id: '1',
          document_type: 'National ID',
          document_number: '12345678',
          description: 'Government issued National ID',
          status: 'active',
          created_at: new Date().toISOString()
        }
      ]);
    } catch (error) {
      console.error('Error fetching identities:', error);
      toast({
        title: "Error",
        description: "Failed to load identity documents",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'expired':
        return <Badge className="bg-red-100 text-red-800">Expired</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <IdCard className="h-5 w-5" />
            Identity Documents
          </CardTitle>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Identity Document
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading identity documents...</div>
          ) : identities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <IdCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No identity documents found</p>
              <Button className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Add First Identity Document
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document Type</TableHead>
                  <TableHead>Document Number</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {identities.map((identity) => (
                  <TableRow key={identity.id}>
                    <TableCell className="font-medium">{identity.document_type}</TableCell>
                    <TableCell>{identity.document_number}</TableCell>
                    <TableCell>{identity.description || '-'}</TableCell>
                    <TableCell>{getStatusBadge(identity.status)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};