import { useState } from "react";
import { TenantsTable } from "@/components/tables/TenantsTable";
import { TenantForm } from "@/components/forms/TenantForm";

const TenantsPage = () => {
  const [showCreateForm, setShowCreateForm] = useState(false);

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