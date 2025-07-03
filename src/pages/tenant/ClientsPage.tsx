import { useState } from "react";
import { ClientsTable } from "@/components/tables/ClientsTable";
import { ClientForm } from "@/components/forms/ClientForm";

const ClientsPage = () => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Clients</h1>
        <p className="text-muted-foreground">Manage client accounts and information.</p>
      </div>
      
      <ClientsTable onCreateClient={() => setShowCreateForm(true)} />
      
      <ClientForm 
        open={showCreateForm} 
        onOpenChange={setShowCreateForm}
        tenantId="dummy-tenant-id" // TODO: Get from context
      />
    </div>
  );
};

export default ClientsPage;