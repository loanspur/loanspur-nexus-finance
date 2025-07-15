import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LoanCreationWizard } from "@/components/loan/LoanCreationWizard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Plus, FileText, Users, DollarSign } from "lucide-react";

export default function LoanCreationPage() {
  const navigate = useNavigate();
  const [showWizard, setShowWizard] = useState(false);

  const handleApplicationCreated = (applicationId: string) => {
    // Navigate to loan application details or back to loans list
    navigate(`/tenant/loans`);
  };

  const handleCancel = () => {
    setShowWizard(false);
  };

  if (showWizard) {
    return (
      <LoanCreationWizard
        onApplicationCreated={handleApplicationCreated}
        onCancel={handleCancel}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Loan Creation</h1>
          <p className="text-muted-foreground">Create comprehensive loan applications using our step-by-step wizard</p>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="w-5 h-5 text-blue-600" />
              Comprehensive Application
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Create detailed loan applications with all required information including client details, loan terms, collateral, and guarantor information.
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="w-5 h-5 text-green-600" />
              Client Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Select from existing clients or create new ones. Manage all client information and loan history in one place.
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <DollarSign className="w-5 h-5 text-purple-600" />
              Flexible Pricing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Configure loan products with various interest rates, terms, and fee structures. Support for both flat and declining balance calculations.
            </CardDescription>
          </CardContent>
        </Card>
      </div>

      {/* Process Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Loan Creation Process</CardTitle>
          <CardDescription>
            Our wizard guides you through a comprehensive 8-step process similar to industry-standard platforms like Mifos X
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-semibold">1</span>
                </div>
                <span className="font-medium">Client Selection</span>
              </div>
              <p className="text-sm text-muted-foreground">Choose the client who will receive the loan</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-semibold">2</span>
                </div>
                <span className="font-medium">Loan Product</span>
              </div>
              <p className="text-sm text-muted-foreground">Select the appropriate loan product and fund source</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-semibold">3</span>
                </div>
                <span className="font-medium">Loan Details</span>
              </div>
              <p className="text-sm text-muted-foreground">Configure amount, term, interest rate, and schedule</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-semibold">4</span>
                </div>
                <span className="font-medium">Charges & Fees</span>
              </div>
              <p className="text-sm text-muted-foreground">Add applicable charges and fees to the loan</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                  <span className="text-gray-600 font-semibold">5</span>
                </div>
                <span className="font-medium">Collateral</span>
              </div>
              <p className="text-sm text-muted-foreground">Add collateral information if required</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                  <span className="text-gray-600 font-semibold">6</span>
                </div>
                <span className="font-medium">Guarantors</span>
              </div>
              <p className="text-sm text-muted-foreground">Add guarantor information if required</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                  <span className="text-gray-600 font-semibold">7</span>
                </div>
                <span className="font-medium">Documents</span>
              </div>
              <p className="text-sm text-muted-foreground">Upload required documents and attachments</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 font-semibold">8</span>
                </div>
                <span className="font-medium">Review & Submit</span>
              </div>
              <p className="text-sm text-muted-foreground">Review all information and submit the application</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Call to Action */}
      <div className="text-center">
        <Button
          onClick={() => setShowWizard(true)}
          size="lg"
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-5 h-5 mr-2" />
          Start New Loan Application
        </Button>
      </div>
    </div>
  );
}