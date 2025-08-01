import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Edit, Trash2, IdCard, Mail, Phone, CreditCard, Car, FileText, CheckCircle2, Clock } from "lucide-react";
import { useClientIdentities, ClientIdentity } from "@/hooks/useClientIdentities";
import { ClientIdentityForm } from "@/components/forms/ClientIdentityForm";

interface ClientIdentitiesTabProps {
  clientId: string;
}

const getIdentifierIcon = (type: string) => {
  switch (type) {
    case 'email': return Mail;
    case 'phone': return Phone;
    case 'passport': return CreditCard;
    case 'driving_license': return Car;
    case 'national_id': return FileText;
    default: return IdCard;
  }
};

const getIdentifierLabel = (type: string) => {
  switch (type) {
    case 'email': return 'Email Address';
    case 'phone': return 'Phone Number';
    case 'passport': return 'Passport Number';
    case 'driving_license': return 'Driving License';
    case 'national_id': return 'National ID';
    default: return type;
  }
};

export const ClientIdentitiesTab = ({ clientId }: ClientIdentitiesTabProps) => {
  const { identities, loading, createIdentity, updateIdentity, deleteIdentity } = useClientIdentities(clientId);
  const [showForm, setShowForm] = useState(false);
  const [editingIdentity, setEditingIdentity] = useState<ClientIdentity | null>(null);

  const handleAddIdentity = async (data: Omit<ClientIdentity, 'id' | 'tenant_id' | 'client_id' | 'created_at' | 'updated_at'>) => {
    await createIdentity(data);
  };

  const handleEditIdentity = async (data: Omit<ClientIdentity, 'id' | 'tenant_id' | 'client_id' | 'created_at' | 'updated_at'>) => {
    if (editingIdentity) {
      await updateIdentity(editingIdentity.id, data);
      setEditingIdentity(null);
    }
  };

  const openEditForm = (identity: ClientIdentity) => {
    setEditingIdentity(identity);
    setShowForm(true);
  };

  const getStatusBadge = (isVerified: boolean) => {
    if (isVerified) {
      return (
        <Badge className="bg-green-100 text-green-800 border-green-200">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Verified
        </Badge>
      );
    }
    return (
      <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
        <Clock className="h-3 w-3 mr-1" />
        Unverified
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <IdCard className="h-5 w-5" />
            Client Identifiers
          </CardTitle>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Identifier
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading client identifiers...</div>
          ) : identities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <IdCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No identifiers found</p>
              <p className="text-sm">Add unique identifiers like email, phone, passport, etc.</p>
              <Button className="mt-4" onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Identifier
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {identities.map((identity) => {
                  const IconComponent = getIdentifierIcon(identity.identifier_type);
                  return (
                    <TableRow key={identity.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <IconComponent className="h-4 w-4" />
                          {getIdentifierLabel(identity.identifier_type)}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono">{identity.identifier_value}</TableCell>
                      <TableCell>{identity.description || '-'}</TableCell>
                      <TableCell>{getStatusBadge(identity.is_verified)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => openEditForm(identity)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Identifier</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this identifier? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteIdentity(identity.id)}>
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ClientIdentityForm
        open={showForm}
        onOpenChange={(open) => {
          setShowForm(open);
          if (!open) setEditingIdentity(null);
        }}
        onSubmit={editingIdentity ? handleEditIdentity : handleAddIdentity}
        editingIdentity={editingIdentity}
      />
    </div>
  );
};