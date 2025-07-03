import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

const TenantsPage = () => {
  const tenants = [
    {
      id: "abc-microfinance",
      name: "ABC Microfinance",
      email: "admin@abcmicro.com",
      plan: "Professional",
      status: "Active",
      clients: 450,
      createdAt: "2024-01-15",
      lastLogin: "2024-03-01"
    },
    {
      id: "xyz-sacco",
      name: "XYZ SACCO",
      email: "admin@xyzsacco.com",
      plan: "Enterprise",
      status: "Trial",
      clients: 1200,
      createdAt: "2024-02-20",
      lastLogin: "2024-02-28"
    },
    {
      id: "community-bank",
      name: "Community Bank",
      email: "admin@communitybank.com",
      plan: "Professional",
      status: "Active",
      clients: 850,
      createdAt: "2024-01-10",
      lastLogin: "2024-03-01"
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Tenant Management</h1>
          <p className="text-muted-foreground">Manage all organizations on your platform</p>
        </div>
        <Button>Add New Tenant</Button>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>All Tenants</CardTitle>
          <CardDescription>Overview of all registered organizations</CardDescription>
          <div className="flex gap-4">
            <Input placeholder="Search tenants..." className="max-w-sm" />
            <Button variant="outline">Filter</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {tenants.map((tenant) => (
              <div key={tenant.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div>
                      <div className="font-medium text-lg">{tenant.name}</div>
                      <div className="text-sm text-muted-foreground">{tenant.email}</div>
                      <div className="text-sm text-muted-foreground">ID: {tenant.id}</div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-sm font-medium">{tenant.clients} clients</div>
                    <div className="text-xs text-muted-foreground">Last login: {tenant.lastLogin}</div>
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <Badge variant="outline">{tenant.plan}</Badge>
                    <Badge 
                      variant={tenant.status === 'Active' ? 'default' : 'secondary'}
                    >
                      {tenant.status}
                    </Badge>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">View</Button>
                    <Button variant="outline" size="sm">Edit</Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TenantsPage;