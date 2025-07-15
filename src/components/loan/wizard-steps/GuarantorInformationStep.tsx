import { UseFormReturn } from "react-hook-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";

interface GuarantorInformationStepProps {
  form: UseFormReturn<any>;
}

export function GuarantorInformationStep({ form }: GuarantorInformationStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">Guarantor Information</h3>
        <p className="text-muted-foreground">Add guarantor information if required by the loan product.</p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Guarantor Details
          </CardTitle>
          <CardDescription>This step will be implemented in the next phase.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Guarantor management coming soon.</p>
        </CardContent>
      </Card>
    </div>
  );
}