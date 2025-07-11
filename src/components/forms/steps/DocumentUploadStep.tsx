import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, FileText, CheckCircle, X, Eye, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DocumentUploadStepProps {
  form: UseFormReturn<any>;
  nextStep: () => void;
  prevStep: () => void;
  uploadedDocuments: string[];
  setUploadedDocuments: (docs: string[]) => void;
}

interface UploadedDocument {
  id: string;
  type: string;
  fileName: string;
  uploadedAt: Date;
}

const documentTypes = [
  { value: 'national_id', label: 'National ID', description: 'Government issued ID card' },
  { value: 'passport', label: 'Passport', description: 'International travel document' },
  { value: 'driving_license', label: 'Driving License', description: 'Valid driving permit' },
  { value: 'birth_certificate', label: 'Birth Certificate', description: 'Official birth record' },
  { value: 'proof_of_residence', label: 'Proof of Residence', description: 'Utility bill or lease agreement' },
  { value: 'bank_statement', label: 'Bank Statement', description: '3 months bank statements' },
  { value: 'employment_letter', label: 'Employment Letter', description: 'Letter from employer' },
  { value: 'payslip', label: 'Payslip', description: 'Recent salary slip' },
  { value: 'business_permit', label: 'Business Permit', description: 'Business registration document' },
  { value: 'tax_certificate', label: 'Tax Certificate', description: 'Tax compliance certificate' },
  { value: 'other', label: 'Other Document', description: 'Any other supporting document' },
];

export const DocumentUploadStep = ({ 
  uploadedDocuments, 
  setUploadedDocuments 
}: DocumentUploadStepProps) => {
  const [uploading, setUploading] = useState<string | null>(null);
  const [selectedDocType, setSelectedDocType] = useState<string>("");
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDocument[]>([]);
  const { toast } = useToast();

  const handleFileUpload = async (docType: string, file: File) => {
    if (!docType) {
      toast({
        title: "Document Type Required",
        description: "Please select a document type before uploading",
        variant: "destructive",
      });
      return;
    }

    setUploading(docType);
    
    try {
      // Simulate file upload
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newDoc: UploadedDocument = {
        id: Date.now().toString(),
        type: docType,
        fileName: file.name,
        uploadedAt: new Date()
      };

      const newUploadedDocs = [...uploadedDocs, newDoc];
      setUploadedDocs(newUploadedDocs);
      
      // Update the parent component's state for backward compatibility
      const docIds = newUploadedDocs.map(doc => doc.id);
      setUploadedDocuments(docIds);
      
      // Reset selection
      setSelectedDocType("");
      
      toast({
        title: "Success",
        description: `${documentTypes.find(dt => dt.value === docType)?.label} uploaded successfully`,
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
    const newUploadedDocs = uploadedDocs.filter(doc => doc.id !== docId);
    setUploadedDocs(newUploadedDocs);
    
    // Update the parent component's state for backward compatibility
    const docIds = newUploadedDocs.map(doc => doc.id);
    setUploadedDocuments(docIds);
    
    toast({
      title: "Document Removed",
      description: "Document has been removed successfully",
    });
  };

  const getDocumentTypeLabel = (value: string) => {
    return documentTypes.find(dt => dt.value === value)?.label || value;
  };

  const getAvailableDocTypes = () => {
    const uploadedTypes = uploadedDocs.map(doc => doc.type);
    return documentTypes.filter(docType => !uploadedTypes.includes(docType.value));
  };

  return (
    <div className="space-y-6">
      {/* Upload New Document Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Upload New Document
          </CardTitle>
          <CardDescription>
            Select the document type and upload your file
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Document Type</label>
              <Select value={selectedDocType} onValueChange={setSelectedDocType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableDocTypes().map((docType) => (
                    <SelectItem key={docType.value} value={docType.value}>
                      <div className="flex flex-col">
                        <span className="font-medium">{docType.label}</span>
                        <span className="text-xs text-muted-foreground">{docType.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Upload File</label>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  id="document-upload"
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file && selectedDocType) {
                      handleFileUpload(selectedDocType, file);
                    }
                  }}
                />
                <Button 
                  variant="outline" 
                  className="w-full"
                  disabled={!selectedDocType || uploading !== null}
                  onClick={() => document.getElementById('document-upload')?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {uploading ? "Uploading..." : "Choose File"}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Uploaded Documents Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Uploaded Documents
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {uploadedDocs.length} Document{uploadedDocs.length !== 1 ? 's' : ''} Uploaded
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {uploadedDocs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No documents uploaded yet</p>
              <p className="text-sm">Upload documents using the form above</p>
            </div>
          ) : (
            <div className="space-y-3">
              {uploadedDocs.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-success/10">
                      <CheckCircle className="h-5 w-5 text-success" />
                    </div>
                    <div>
                      <p className="font-medium">{getDocumentTypeLabel(doc.type)}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{doc.fileName}</span>
                        <span>•</span>
                        <span>Uploaded {doc.uploadedAt.toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
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
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Guidelines */}
      <div className="text-sm text-muted-foreground bg-muted/30 p-4 rounded-lg">
        <div className="flex items-start gap-2">
          <FileText className="h-4 w-4 mt-0.5" />
          <div>
            <p className="font-medium">Upload Guidelines:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Accepted formats: PDF, JPG, PNG</li>
              <li>Maximum file size: 5MB per document</li>
              <li>Ensure documents are clear and readable</li>
              <li>You can upload multiple documents of different types</li>
              <li>All documents are optional - you can proceed without uploading</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};