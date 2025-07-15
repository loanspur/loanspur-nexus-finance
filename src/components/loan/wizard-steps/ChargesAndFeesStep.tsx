import { UseFormReturn } from "react-hook-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText } from "lucide-react";

interface ChargesAndFeesStepProps {
  form: UseFormReturn<any>;
}

export function ChargesAndFeesStep({ form }: ChargesAndFeesStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">Charges & Fees</h3>
        <p className="text-muted-foreground">Configure applicable charges and fees for this loan.</p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Loan Charges
          </CardTitle>
          <CardDescription>This step will be implemented in the next phase.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Charges and fees configuration coming soon.</p>
        </CardContent>
      </Card>
    </div>
  );
}