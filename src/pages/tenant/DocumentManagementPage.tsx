import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, FileText, Eye, Download, CheckCircle, AlertCircle, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Document {
  id: string;
  client_id: string;
  client_name: string;
  document_type: string;
  document_name: string;
  file_url: string;
  file_size: number;
  mime_type: string;
  is_verified: boolean;
  uploaded_at: string;
  verified_at?: string;
  verified_by?: string;
}

// Mock data for documents
const mockDocuments: Document[] = [
  {
    id: "1",
    client_id: "CLT-001",
    client_name: "John Doe",
    document_type: "national_id",
    document_name: "National ID Copy",
    file_url: "/documents/john_doe_id.pdf",
    file_size: 2048000,
    mime_type: "application/pdf",
    is_verified: true,
    uploaded_at: "2024-03-15T10:30:00Z",
    verified_at: "2024-03-15T14:20:00Z",
    verified_by: "Admin User"
  },
  {
    id: "2",
    client_id: "CLT-002",
    client_name: "Jane Smith",
    document_type: "proof_of_income",
    document_name: "Salary Slip March 2024",
    file_url: "/documents/jane_smith_salary.pdf",
    file_size: 1024000,
    mime_type: "application/pdf",
    is_verified: false,
    uploaded_at: "2024-03-20T09:15:00Z"
  },
  {
    id: "3",
    client_id: "CLT-001",
    client_name: "John Doe",
    document_type: "bank_statement",
    document_name: "Bank Statement Feb 2024",
    file_url: "/documents/john_doe_statement.pdf",
    file_size: 3072000,
    mime_type: "application/pdf",
    is_verified: false,
    uploaded_at: "2024-03-22T16:45:00Z"
  },
  {
    id: "4",
    client_id: "CLT-003",
    client_name: "Mike Johnson",
    document_type: "business_license",
    document_name: "Business Registration Certificate",
    file_url: "/documents/mike_johnson_license.jpg",
    file_size: 1536000,
    mime_type: "image/jpeg",
    is_verified: true,
    uploaded_at: "2024-03-18T11:20:00Z",
    verified_at: "2024-03-19T08:30:00Z",
    verified_by: "Admin User"
  }
];

const DocumentManagementPage = () => {
  const [documents, setDocuments] = useState<Document[]>(mockDocuments);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const { toast } = useToast();

  const documentTypes = [
    { value: "national_id", label: "National ID" },
    { value: "passport", label: "Passport" },
    { value: "proof_of_income", label: "Proof of Income" },
    { value: "bank_statement", label: "Bank Statement" },
    { value: "business_license", label: "Business License" },
    { value: "utility_bill", label: "Utility Bill" },
    { value: "employment_letter", label: "Employment Letter" },
    { value: "other", label: "Other" }
  ];

  const filteredDocuments = documents.filter(doc => {
    const typeMatch = filterType === "all" || doc.document_type === filterType;
    const statusMatch = filterStatus === "all" || 
      (filterStatus === "verified" && doc.is_verified) ||
      (filterStatus === "pending" && !doc.is_verified);
    return typeMatch && statusMatch;
  });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getDocumentTypeLabel = (type: string) => {
    const docType = documentTypes.find(dt => dt.value === type);
    return docType ? docType.label : type;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // Simulate file upload
      await new Promise(resolve => setTimeout(resolve, 2000));

      const newDocument: Document = {
        id: (documents.length + 1).toString(),
        client_id: "CLT-001", // This would come from form
        client_name: "New Client", // This would come from form
        document_type: "other",
        document_name: file.name,
        file_url: `/documents/${file.name}`,
        file_size: file.size,
        mime_type: file.type,
        is_verified: false,
        uploaded_at: new Date().toISOString()
      };

      setDocuments([newDocument, ...documents]);
      
      toast({
        title: "Document Uploaded",
        description: "Document has been uploaded successfully and is pending verification.",
      });
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: "Failed to upload document. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleVerifyDocument = (documentId: string, verified: boolean) => {
    setDocuments(docs => docs.map(doc => 
      doc.id === documentId 
        ? {
            ...doc,
            is_verified: verified,
            verified_at: verified ? new Date().toISOString() : undefined,
            verified_by: verified ? "Current User" : undefined
          }
        : doc
    ));

    toast({
      title: verified ? "Document Verified" : "Document Rejected",
      description: verified 
        ? "Document has been successfully verified."
        : "Document has been rejected and client will be notified.",
    });
  };

  const handleDeleteDocument = (documentId: string) => {
    setDocuments(docs => docs.filter(doc => doc.id !== documentId));
    toast({
      title: "Document Deleted",
      description: "Document has been permanently deleted.",
    });
  };

  const getVerificationStats = () => {
    const total = documents.length;
    const verified = documents.filter(d => d.is_verified).length;
    const pending = total - verified;
    return { total, verified, pending };
  };

  const stats = getVerificationStats();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Document Management</h1>
        <p className="text-muted-foreground">
          Manage client document uploads and verification process.
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <div className="text-2xl font-bold">{stats.total}</div>
            </div>
            <p className="text-xs text-muted-foreground">Total Documents</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-success" />
              <div className="text-2xl font-bold text-success">{stats.verified}</div>
            </div>
            <p className="text-xs text-muted-foreground">Verified Documents</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-warning" />
              <div className="text-2xl font-bold text-warning">{stats.pending}</div>
            </div>
            <p className="text-xs text-muted-foreground">Pending Verification</p>
          </CardContent>
        </Card>
      </div>

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Document
          </CardTitle>
          <CardDescription>
            Upload client documents for verification
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-4">
              <div>
                <Label htmlFor="client-select">Client</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CLT-001">John Doe (CLT-001)</SelectItem>
                    <SelectItem value="CLT-002">Jane Smith (CLT-002)</SelectItem>
                    <SelectItem value="CLT-003">Mike Johnson (CLT-003)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="document-type">Document Type</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select document type" />
                  </SelectTrigger>
                  <SelectContent>
                    {documentTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="document-name">Document Name</Label>
                <Input 
                  id="document-name"
                  placeholder="Enter document name"
                />
              </div>
              
              <div>
                <Label htmlFor="file-upload">Choose File</Label>
                <Input 
                  id="file-upload"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                />
              </div>
            </div>
          </div>
          
          <div className="mt-4">
            <Button disabled={isUploading} className="w-full md:w-auto">
              {isUploading ? "Uploading..." : "Upload Document"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Documents Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Client Documents</CardTitle>
              <CardDescription>
                Review and verify uploaded client documents
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {documentTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Document</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Uploaded</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDocuments.map((document) => (
                <TableRow key={document.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{document.client_name}</div>
                      <div className="text-sm text-muted-foreground">{document.client_id}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <span className="font-medium">{document.document_name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {getDocumentTypeLabel(document.document_type)}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatFileSize(document.file_size)}</TableCell>
                  <TableCell>
                    <Badge 
                      variant={document.is_verified ? "default" : "secondary"}
                      className={document.is_verified ? "bg-success text-success-foreground" : "bg-warning text-warning-foreground"}
                    >
                      {document.is_verified ? "Verified" : "Pending"}
                    </Badge>
                    {document.verified_at && (
                      <div className="text-xs text-muted-foreground mt-1">
                        by {document.verified_by}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {format(new Date(document.uploaded_at), 'MMM dd, yyyy')}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(document.uploaded_at), 'HH:mm')}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm">
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="h-3 w-3" />
                      </Button>
                      {!document.is_verified && (
                        <>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleVerifyDocument(document.id, true)}
                          >
                            <CheckCircle className="h-3 w-3 text-success" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleVerifyDocument(document.id, false)}
                          >
                            <X className="h-3 w-3 text-destructive" />
                          </Button>
                        </>
                      )}
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDeleteDocument(document.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredDocuments.length === 0 && (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No documents found</h3>
              <p className="text-muted-foreground">No documents match your current filters.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DocumentManagementPage;