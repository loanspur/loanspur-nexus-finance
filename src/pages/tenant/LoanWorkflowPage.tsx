import { LoanWorkflowManagement } from "@/components/loan/LoanWorkflowManagement";

const LoanWorkflowPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Loan Workflow</h1>
        <p className="text-muted-foreground">
          Manage loan applications, approvals, and disbursements
        </p>
      </div>
      
      <LoanWorkflowManagement />
    </div>
  );
};

export default LoanWorkflowPage;