import { useState } from "react";
import { TenantsTable } from "@/components/tables/TenantsTable";
import { TenantForm } from "@/components/forms/TenantForm";

const TenantsPage = () => {
  const [showCreateForm, setShowCreateForm] = useState(false);
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
      <div>
        <h1 className="text-3xl font-bold">Tenants</h1>
        <p className="text-muted-foreground">Manage tenant organizations and subscriptions.</p>
      </div>
      
      <TenantsTable onCreateTenant={() => setShowCreateForm(true)} />
      
      <TenantForm 
        open={showCreateForm} 
        onOpenChange={setShowCreateForm} 
      />
    </div>
  );
};

export default TenantsPage;