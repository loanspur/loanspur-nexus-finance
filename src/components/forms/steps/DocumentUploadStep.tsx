import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, CheckCircle, X, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DocumentUploadStepProps {
  form: UseFormReturn<any>;
  nextStep: () => void;
  prevStep: () => void;
  uploadedDocuments: string[];
  setUploadedDocuments: (docs: string[]) => void;
}

const documentOptions = [
  { id: 'national_id', label: 'National ID', required: false },
  { id: 'passport_photo', label: 'Passport Photo', required: false },
  { id: 'proof_of_residence', label: 'Proof of Residence', required: false },
  { id: 'bank_statement', label: 'Bank Statement', required: false },
  { id: 'employment_letter', label: 'Employment Letter', required: false },
  { id: 'business_permit', label: 'Business Permit', required: false },
];

export const DocumentUploadStep = ({ 
  uploadedDocuments, 
  setUploadedDocuments 
}: DocumentUploadStepProps) => {
  const [uploading, setUploading] = useState<string | null>(null);
  const { toast } = useToast();

  const handleFileUpload = async (docId: string, file: File) => {
    setUploading(docId);
    
    try {
      // Simulate file upload
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newUploadedDocs = [...uploadedDocuments];
      if (!newUploadedDocs.includes(docId)) {
        newUploadedDocs.push(docId);
        setUploadedDocuments(newUploadedDocs);
      }
      
      toast({
        title: "Success",
        description: "Document uploaded successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload document",
        variant: "destructive",
      });
    } finally {
      setUploading(null);
    }
  };

  const removeDocument = (docId: string) => {
    const newUploadedDocs = uploadedDocuments.filter(id => id !== docId);
    setUploadedDocuments(newUploadedDocs);
    
    toast({
      title: "Document Removed",
      description: "Document has been removed successfully",
    });
  };

  const isDocumentUploaded = (docId: string) => uploadedDocuments.includes(docId);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Document Upload
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {uploadedDocuments.length} / {documentOptions.length} Documents Uploaded
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {documentOptions.map((doc) => {
            const isUploaded = isDocumentUploaded(doc.id);
            const isUploading = uploading === doc.id;

            return (
              <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${isUploaded ? 'bg-success/10' : 'bg-muted'}`}>
                    {isUploaded ? (
                      <CheckCircle className="h-5 w-5 text-success" />
                    ) : (
                      <FileText className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{doc.label}</p>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="secondary"
                        className="text-xs"
                      >
                        Optional
                      </Badge>
                      {isUploaded && (
                        <Badge variant="default" className="text-xs">
                          Uploaded
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isUploaded ? (
                    <>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => removeDocument(doc.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        id={`file-${doc.id}`}
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleFileUpload(doc.id, file);
                          }
                        }}
                      />
                      <Button 
                        variant="outline" 
                        size="sm"
                        disabled={isUploading}
                        onClick={() => document.getElementById(`file-${doc.id}`)?.click()}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {isUploading ? "Uploading..." : "Upload"}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <div className="text-sm text-muted-foreground bg-muted/30 p-4 rounded-lg">
        <div className="flex items-start gap-2">
          <FileText className="h-4 w-4 mt-0.5" />
          <div>
            <p className="font-medium">Upload Guidelines:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Accepted formats: PDF, JPG, PNG</li>
              <li>Maximum file size: 5MB per document</li>
              <li>Ensure documents are clear and readable</li>
              <li>All documents are optional - you can proceed without uploading</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};