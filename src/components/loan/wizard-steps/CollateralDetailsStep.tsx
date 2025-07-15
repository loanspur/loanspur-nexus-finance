import { UseFormReturn } from "react-hook-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield } from "lucide-react";

interface CollateralDetailsStepProps {
  form: UseFormReturn<any>;
}

export function CollateralDetailsStep({ form }: CollateralDetailsStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">Collateral Details</h3>
        <p className="text-muted-foreground">Add collateral information if required by the loan product.</p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Collateral Information
          </CardTitle>
          <CardDescription>This step will be implemented in the next phase.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Collateral management coming soon.</p>
        </CardContent>
      </Card>
    </div>
  );
}