import { UseFormReturn } from "react-hook-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

interface ReviewAndSubmitStepProps {
  form: UseFormReturn<any>;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export function ReviewAndSubmitStep({ form, onSubmit, isSubmitting }: ReviewAndSubmitStepProps) {
  const formData = form.getValues();
  
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">Review & Submit</h3>
        <p className="text-muted-foreground">Review all information and submit the loan application.</p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            Application Summary
          </CardTitle>
          <CardDescription>Please review the loan application details before submitting.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Requested Amount</p>
              <p className="font-medium">${formData.requested_amount || 0}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Loan Term</p>
              <p className="font-medium">{formData.requested_term || 0} months</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Interest Rate</p>
              <p className="font-medium">{formData.interest_rate || 0}%</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Purpose</p>
              <p className="font-medium">{formData.purpose || 'Not specified'}</p>
            </div>
          </div>
          
          <div className="flex justify-center pt-4">
            <Button 
              onClick={onSubmit}
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? "Submitting..." : "Submit Application"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}