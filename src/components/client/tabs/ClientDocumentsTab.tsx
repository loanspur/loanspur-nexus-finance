import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Plus, Download, Eye, Trash2, FileText, Upload, Edit, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Document {
  id: string;
  tenant_id: string;
  client_id: string;
  document_name: string;
  document_type: string;
  file_url: string;
  file_size?: number;
  mime_type?: string;
  description?: string;
  is_verified: boolean;
  is_required: boolean;
  expiry_date?: string;
  uploaded_by?: string;
  verified_by?: string;
  verified_at?: string;
  created_at: string;
  updated_at: string;
}

interface ClientDocumentsTabProps {
  clientId: string;
}

const DOCUMENT_TYPES = [
  { value: 'national_id', label: 'National ID' },
  { value: 'passport', label: 'Passport' },
  { value: 'driver_license', label: 'Driver License' },
  { value: 'birth_certificate', label: 'Birth Certificate' },
  { value: 'marriage_certificate', label: 'Marriage Certificate' },
  { value: 'utility_bill', label: 'Utility Bill' },
  { value: 'bank_statement', label: 'Bank Statement' },
  { value: 'salary_slip', label: 'Salary Slip' },
  { value: 'employment_letter', label: 'Employment Letter' },
  { value: 'business_license', label: 'Business License' },
  { value: 'tax_certificate', label: 'Tax Certificate' },
  { value: 'contract', label: 'Contract' },
  { value: 'other', label: 'Other' },
];

export const ClientDocumentsTab = ({ clientId }: ClientDocumentsTabProps) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [viewingDocument, setViewingDocument] = useState<Document | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    document_name: '',
    document_type: '',
    description: '',
    is_verified: false,
    is_required: false,
    expiry_date: '',
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    fetchDocuments();
  }, [clientId]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('client_documents')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments((data as Document[]) || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast({
        title: "Error",
        description: "Failed to load documents",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      document_name: '',
      document_type: '',
      description: '',
      is_verified: false,
      is_required: false,
      expiry_date: '',
    });
    setSelectedFile(null);
    setEditingDocument(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!formData.document_name) {
        setFormData(prev => ({ ...prev, document_name: file.name }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingDocument && !selectedFile) {
      toast({
        title: "Error",
        description: "Please select a file to upload",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsUploading(true);
      
      // Get current user's tenant_id
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('tenant_id, id')
        .eq('user_id', user.id)
        .single();

      if (profileError) {
        console.error('Profile error:', profileError);
        throw new Error('Failed to get user profile');
      }

      let fileUrl = editingDocument?.file_url;
      let fileSize = editingDocument?.file_size;
      let mimeType = editingDocument?.mime_type;

      // Upload new file if provided
      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${clientId}/${Date.now()}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('client-documents')
          .upload(fileName, selectedFile, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) throw uploadError;
        
        fileUrl = uploadData.path;
        fileSize = selectedFile.size;
        mimeType = selectedFile.type;
      }

      const documentData = {
        client_id: clientId,
        tenant_id: profile?.tenant_id,
        document_name: formData.document_name,
        document_type: formData.document_type,
        description: formData.description || null,
        file_url: fileUrl,
        file_size: fileSize,
        mime_type: mimeType,
        is_verified: formData.is_verified,
        is_required: formData.is_required,
        expiry_date: formData.expiry_date || null,
        uploaded_by: profile?.id,
        updated_at: new Date().toISOString(),
      };

      if (editingDocument) {
        // Update existing document - exclude immutable fields
        const updateData = {
          document_name: formData.document_name,
          document_type: formData.document_type,
          description: formData.description || null,
          file_url: fileUrl,
          file_size: fileSize,
          mime_type: mimeType,
          is_verified: formData.is_verified,
          is_required: formData.is_required,
          expiry_date: formData.expiry_date || null,
          updated_at: new Date().toISOString(),
        };
        
        const { error } = await supabase
          .from('client_documents')
          .update(updateData)
          .eq('id', editingDocument.id);

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Document updated successfully",
        });
      } else {
        // Create new document
        const { error } = await supabase
          .from('client_documents')
          .insert(documentData);

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Document uploaded successfully",
        });
      }

      resetForm();
      setDialogOpen(false);
      fetchDocuments();
    } catch (error) {
      console.error('Error saving document:', error);
      toast({
        title: "Error",
        description: "Failed to save document",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleEdit = (document: Document) => {
    setEditingDocument(document);
    setFormData({
      document_name: document.document_name,
      document_type: document.document_type,
      description: document.description || '',
      is_verified: document.is_verified,
      is_required: document.is_required,
      expiry_date: document.expiry_date || '',
    });
    setDialogOpen(true);
  };

  const handleDelete = async (document: Document) => {
    if (!confirm(`Are you sure you want to delete "${document.document_name}"?`)) return;
    
    try {
      // Delete file from storage
      const { error: storageError } = await supabase.storage
        .from('client-documents')
        .remove([document.file_url]);

      if (storageError) console.warn('Storage deletion error:', storageError);

      // Delete document record
      const { error } = await supabase
        .from('client_documents')
        .delete()
        .eq('id', document.id);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Document deleted successfully",
      });
      
      fetchDocuments();
    } catch (error) {
      console.error('Error deleting document:', error);
      toast({
        title: "Error",
        description: "Failed to delete document",
        variant: "destructive"
      });
    }
  };

  const handleView = async (document: Document) => {
    try {
      const { data } = await supabase.storage
        .from('client-documents')
        .createSignedUrl(document.file_url, 3600); // 1 hour expiry

      if (data?.signedUrl) {
        setPreviewUrl(data.signedUrl);
        setViewingDocument(document);
        setViewDialogOpen(true);
      }
    } catch (error) {
      console.error('Error creating signed URL:', error);
      toast({
        title: "Error",
        description: "Failed to load document preview",
        variant: "destructive"
      });
    }
  };

  const handleDownload = async (document: Document) => {
    try {
      const { data } = await supabase.storage
        .from('client-documents')
        .download(document.file_url);
      
      if (data) {
        const url = URL.createObjectURL(data);
        const link = window.document.createElement('a');
        link.href = url;
        link.download = document.document_name;
        window.document.body.appendChild(link);
        link.click();
        window.document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        toast({
          title: "Success",
          description: "Document downloaded successfully",
        });
      }
    } catch (error) {
      console.error('Error downloading document:', error);
      toast({
        title: "Error",
        description: "Failed to download document",
        variant: "destructive"
      });
    }
  };

  const toggleVerification = async (document: Document) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (profileError) {
        console.error('Profile error:', profileError);
        throw new Error('Failed to get user profile');
      }

      const { error } = await supabase
        .from('client_documents')
        .update({
          is_verified: !document.is_verified,
          verified_by: !document.is_verified ? profile?.id : null,
          verified_at: !document.is_verified ? new Date().toISOString() : null,
        })
        .eq('id', document.id);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: `Document ${!document.is_verified ? 'verified' : 'unverified'} successfully`,
      });
      
      fetchDocuments();
    } catch (error) {
      console.error('Error updating verification:', error);
      toast({
        title: "Error",
        description: "Failed to update verification status",
        variant: "destructive"
      });
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getVerificationBadge = (isVerified: boolean) => {
    return isVerified ? (
      <Badge className="bg-green-100 text-green-800">Verified</Badge>
    ) : (
      <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
    );
  };

  const getDocumentTypeLabel = (type: string) => {
    return DOCUMENT_TYPES.find(t => t.value === type)?.label || type;
  };

  const isImageFile = (mimeType?: string) => {
    return mimeType?.startsWith('image/');
  };

  const isPdfFile = (mimeType?: string) => {
    return mimeType === 'application/pdf';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Client Documents
          </CardTitle>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Upload Document
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingDocument ? 'Edit Document' : 'Upload New Document'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                {!editingDocument && (
                  <div className="space-y-2">
                    <Label htmlFor="file">File *</Label>
                    <Input
                      id="file"
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
                      required
                    />
                    {selectedFile && (
                      <p className="text-sm text-muted-foreground">
                        Selected: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                      </p>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="document_name">Document Name *</Label>
                  <Input
                    id="document_name"
                    value={formData.document_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, document_name: e.target.value }))}
                    required
                    placeholder="Enter document name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="document_type">Document Type *</Label>
                  <Select
                    value={formData.document_type}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, document_type: value }))}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select document type" />
                    </SelectTrigger>
                    <SelectContent>
                      {DOCUMENT_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Additional notes about this document..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expiry_date">Expiry Date</Label>
                  <Input
                    id="expiry_date"
                    type="date"
                    value={formData.expiry_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, expiry_date: e.target.value }))}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_verified"
                    checked={formData.is_verified}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_verified: checked }))}
                  />
                  <Label htmlFor="is_verified">Mark as verified</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_required"
                    checked={formData.is_required}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_required: checked }))}
                  />
                  <Label htmlFor="is_required">Required document</Label>
                </div>

                {isUploading && (
                  <div className="space-y-2">
                    <Progress value={uploadProgress} />
                    <p className="text-sm text-center text-muted-foreground">
                      {editingDocument ? 'Updating...' : 'Uploading...'}
                    </p>
                  </div>
                )}

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                    disabled={isUploading}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isUploading}>
                    {editingDocument ? 'Update' : 'Upload'} Document
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading documents...</div>
          ) : documents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No documents uploaded yet</p>
              <Button className="mt-4" onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Upload First Document
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Upload Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((document) => (
                  <TableRow key={document.id}>
                    <TableCell className="font-medium">
                      <div>
                        <p>{document.document_name}</p>
                        {document.description && (
                          <p className="text-sm text-muted-foreground">{document.description}</p>
                        )}
                        {document.expiry_date && (
                          <Badge variant="outline" className="mt-1">
                            Expires: {format(new Date(document.expiry_date), 'MMM dd, yyyy')}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p>{getDocumentTypeLabel(document.document_type)}</p>
                        {document.is_required && (
                          <Badge variant="secondary" className="mt-1">Required</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{formatFileSize(document.file_size)}</TableCell>
                    <TableCell>
                      <button 
                        onClick={() => toggleVerification(document)}
                        className="cursor-pointer"
                      >
                        {getVerificationBadge(document.is_verified)}
                      </button>
                    </TableCell>
                    <TableCell>{format(new Date(document.created_at), 'PPP')}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleView(document)}
                          title="View document"
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleDownload(document)}
                          title="Download document"
                        >
                          <Download className="h-3 w-3" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEdit(document)}
                          title="Edit document"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDelete(document)}
                          title="Delete document"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Document Viewer Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>{viewingDocument?.document_name}</DialogTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewDialogOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>
          <div className="flex-1 overflow-auto">
            {viewingDocument && previewUrl && (
              <div className="space-y-4">
                {isImageFile(viewingDocument.mime_type) ? (
                  <img 
                    src={previewUrl} 
                    alt={viewingDocument.document_name}
                    className="max-w-full h-auto mx-auto"
                  />
                ) : isPdfFile(viewingDocument.mime_type) ? (
                  <iframe
                    src={previewUrl}
                    className="w-full h-[600px] border"
                    title={viewingDocument.document_name}
                  />
                ) : (
                  <div className="text-center py-8">
                    <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-muted-foreground">
                      Preview not available for this file type
                    </p>
                    <Button 
                      className="mt-4"
                      onClick={() => handleDownload(viewingDocument)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download to View
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};