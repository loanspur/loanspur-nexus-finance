import { useState } from "react";
import { ClientsTable } from "@/components/tables/ClientsTable";
import { ClientOnboardingForm } from "@/components/forms/ClientOnboardingForm";

const ClientsPage = () => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Clients</h1>
        <p className="text-muted-foreground">Manage client accounts and information.</p>
      </div>
      
      <ClientsTable onCreateClient={() => setShowCreateForm(true)} />
      
      <ClientOnboardingForm 
        open={showCreateForm} 
        onOpenChange={setShowCreateForm}
      />
    </div>
  );
};

export default ClientsPage;