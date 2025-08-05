import { useState } from "react";
import { ClientsTable } from "@/components/tables/ClientsTable";
import { ClientOnboardingForm } from "@/components/forms/ClientOnboardingForm";
import { ClientDataUpload } from "@/components/client/ClientDataUpload";
import { LoanListTabs } from "@/components/loan/LoanListTabs";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ClientsPage = () => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Clients</h1>
        <p className="text-muted-foreground">Manage client accounts and information.</p>
      </div>
      
      <Tabs defaultValue="clients" className="w-full">
        <TabsList>
          <TabsTrigger value="clients">Client List</TabsTrigger>
          <TabsTrigger value="import">Data Import</TabsTrigger>
          <TabsTrigger value="loans">Loan Management</TabsTrigger>
        </TabsList>
        
        <TabsContent value="clients" className="space-y-6">
          <ClientsTable onCreateClient={() => setShowCreateForm(true)} />
        </TabsContent>
        
        <TabsContent value="import" className="space-y-6">
          <ClientDataUpload />
        </TabsContent>
        
        <TabsContent value="loans" className="space-y-6">
          <LoanListTabs />
        </TabsContent>
      </Tabs>
      
      <ClientOnboardingForm 
        open={showCreateForm} 
        onOpenChange={setShowCreateForm}
      />
    </div>
  );
};

export default ClientsPage;