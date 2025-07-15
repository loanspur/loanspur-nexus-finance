import { UseFormReturn } from "react-hook-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload } from "lucide-react";

interface DocumentUploadStepProps {
  form: UseFormReturn<any>;
}

export function DocumentUploadStep({ form }: DocumentUploadStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">Document Upload</h3>
        <p className="text-muted-foreground">Upload required documents and attachments.</p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Required Documents
          </CardTitle>
          <CardDescription>This step will be implemented in the next phase.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Document upload functionality coming soon.</p>
        </CardContent>
      </Card>
    </div>
  );
}