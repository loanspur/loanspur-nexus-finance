import { useState } from "react";
import { ClientsTable } from "@/components/tables/ClientsTable";
import { ClientForm } from "@/components/forms/ClientForm";

const ClientsPage = () => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const clients = [
    {
      id: "CLT-001",
      name: "John Doe",
      email: "john@example.com",
      phone: "+254700123456",
      status: "Active",
      loanBalance: "$2,500",
      savingsBalance: "$850",
      repaymentRate: "95%",
      joinDate: "2024-01-15"
    },
    {
      id: "CLT-002", 
      name: "Jane Smith",
      email: "jane@example.com",
      phone: "+254700654321",
      status: "Active",
      loanBalance: "$1,200",
      savingsBalance: "$450",
      repaymentRate: "88%",
      joinDate: "2024-02-10"
    },
    {
      id: "CLT-003",
      name: "Mike Johnson",
      email: "mike@example.com", 
      phone: "+254700987654",
      status: "Pending",
      loanBalance: "$0",
      savingsBalance: "$150",
      repaymentRate: "N/A",
      joinDate: "2024-03-01"
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Client Management</h1>
          <p className="text-muted-foreground">Manage all your clients and their accounts</p>
        </div>
        <Button>Add New Client</Button>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>All Clients</CardTitle>
          <CardDescription>Overview of all registered clients</CardDescription>
          <div className="flex gap-4">
            <Input placeholder="Search clients..." className="max-w-sm" />
            <Button variant="outline">Filter</Button>
            <Button variant="outline">Export</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {clients.map((client) => (
              <div key={client.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div>
                      <div className="font-medium text-lg">{client.name}</div>
                      <div className="text-sm text-muted-foreground">{client.email}</div>
                      <div className="text-sm text-muted-foreground">{client.phone}</div>
                      <div className="text-xs text-muted-foreground">ID: {client.id}</div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className="text-sm font-medium">Loan: {client.loanBalance}</div>
                    <div className="text-sm font-medium">Savings: {client.savingsBalance}</div>
                    <div className="text-xs text-muted-foreground">Repayment Rate: {client.repaymentRate}</div>
                  </div>
                  
                  <div>
                    <Badge 
                      variant={client.status === 'Active' ? 'default' : 'secondary'}
                    >
                      {client.status}
                    </Badge>
                    <div className="text-xs text-muted-foreground mt-1">
                      Joined: {client.joinDate}
                    </div>
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

export default ClientsPage;