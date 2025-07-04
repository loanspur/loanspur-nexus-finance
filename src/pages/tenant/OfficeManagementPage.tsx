import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Edit, Trash2, Building2, Users, MapPin, Phone, Mail } from "lucide-react";
import { useOffices, useOfficeStaff, useDeleteOffice, Office } from "@/hooks/useOfficeManagement";
import { CreateOfficeDialog } from "@/components/tenant/CreateOfficeDialog";
import { EditOfficeDialog } from "@/components/tenant/EditOfficeDialog";
import { useToast } from "@/hooks/use-toast";

const OfficeManagementPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [createOfficeOpen, setCreateOfficeOpen] = useState(false);
  const [editOfficeOpen, setEditOfficeOpen] = useState(false);
  const [selectedOffice, setSelectedOffice] = useState<Office | null>(null);
  const { toast } = useToast();

  const { data: offices = [], isLoading, refetch } = useOffices();
  const { data: officeStaff = [] } = useOfficeStaff();
  const deleteOfficeMutation = useDeleteOffice();

  const filteredOffices = offices.filter(office => 
    office.office_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    office.office_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    office.branch_manager?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    office.branch_manager?.last_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getOfficeTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'head_office':
        return 'bg-purple-100 text-purple-800';
      case 'branch':
        return 'bg-blue-100 text-blue-800';
      case 'sub_branch':
        return 'bg-green-100 text-green-800';
      case 'collection_center':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getOfficeTypeLabel = (type: string) => {
    switch (type) {
      case 'head_office':
        return 'Head Office';
      case 'branch':
        return 'Branch';
      case 'sub_branch':
        return 'Sub Branch';
      case 'collection_center':
        return 'Collection Center';
      default:
        return type;
    }
  };

  const handleEditOffice = (office: any) => {
    setSelectedOffice(office);
    setEditOfficeOpen(true);
  };

  const handleDeleteOffice = async (office: any) => {
    if (window.confirm(`Are you sure you want to delete ${office.office_name}? This action cannot be undone.`)) {
      try {
        await deleteOfficeMutation.mutateAsync(office.id);
        refetch();
      } catch (error) {
        console.error('Error deleting office:', error);
      }
    }
  };

  const formatAddress = (address: any) => {
    if (!address) return 'Not provided';
    const parts = [
      address.street,
      address.city,
      address.state,
      address.postal_code,
      address.country
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : 'Not provided';
  };

  // Office statistics
  const totalOffices = offices.length;
  const activeOffices = offices.filter(o => o.is_active).length;
  const headOffices = offices.filter(o => o.office_type === 'head_office').length;
  const branches = offices.filter(o => o.office_type === 'branch').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Office Management</h1>
          <p className="text-muted-foreground">Manage offices and branch managers</p>
        </div>
        <Button onClick={() => setCreateOfficeOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Office
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Offices</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOffices}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Offices</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeOffices}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Head Offices</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{headOffices}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Branches</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{branches}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Office Management */}
      <Tabs defaultValue="offices" className="space-y-6">
        <TabsList>
          <TabsTrigger value="offices">Offices</TabsTrigger>
          <TabsTrigger value="staff">Office Staff</TabsTrigger>
        </TabsList>

        <TabsContent value="offices" className="space-y-6">
          {/* Search and Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Office Directory</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search offices..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Offices Table */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Office Name</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Branch Manager</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          Loading offices...
                        </TableCell>
                      </TableRow>
                    ) : filteredOffices.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          No offices found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredOffices.map((office) => (
                        <TableRow key={office.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{office.office_name}</div>
                              <div className="text-sm text-muted-foreground">
                                <MapPin className="inline h-3 w-3 mr-1" />
                                {formatAddress(office.address)}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono">{office.office_code}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className={getOfficeTypeBadgeColor(office.office_type)}>
                              {getOfficeTypeLabel(office.office_type)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {office.branch_manager ? (
                              <div>
                                <div className="font-medium">
                                  {office.branch_manager.first_name} {office.branch_manager.last_name}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {office.branch_manager.email}
                                </div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">Not assigned</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {office.phone && (
                                <div className="flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  {office.phone}
                                </div>
                              )}
                              {office.email && (
                                <div className="flex items-center gap-1">
                                  <Mail className="h-3 w-3" />
                                  {office.email}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={office.is_active ? "default" : "secondary"}>
                              {office.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditOffice(office)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteOffice(office)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="staff">
          <Card>
            <CardHeader>
              <CardTitle>Office Staff Assignments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Staff Member</TableHead>
                      <TableHead>Office</TableHead>
                      <TableHead>Role in Office</TableHead>
                      <TableHead>Assigned Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {officeStaff.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8">
                          No staff assignments found
                        </TableCell>
                      </TableRow>
                    ) : (
                      officeStaff.map((assignment) => (
                        <TableRow key={assignment.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {assignment.staff.first_name} {assignment.staff.last_name}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {assignment.staff.email}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{assignment.office.office_name}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {assignment.role_in_office.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(assignment.assigned_date).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Badge variant={assignment.is_active ? "default" : "secondary"}>
                              {assignment.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <CreateOfficeDialog 
        open={createOfficeOpen} 
        onOpenChange={setCreateOfficeOpen}
        onSuccess={() => {
          refetch();
          setCreateOfficeOpen(false);
        }}
      />
      
      <EditOfficeDialog 
        open={editOfficeOpen} 
        onOpenChange={setEditOfficeOpen}
        office={selectedOffice}
        onSuccess={() => {
          refetch();
          setEditOfficeOpen(false);
        }}
      />
    </div>
  );
};

export default OfficeManagementPage;