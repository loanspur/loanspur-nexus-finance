import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Upload, 
  Download, 
  FileSpreadsheet, 
  CheckCircle, 
  AlertCircle,
  X 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface UploadResult {
  success: boolean;
  imported?: number;
  errors?: string[];
  message?: string;
}

export const ClientDataUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.name.toLowerCase().endsWith('.xlsx') && !file.name.toLowerCase().endsWith('.xls')) {
        toast({
          title: "Invalid File Type",
          description: "Please select an Excel file (.xlsx or .xls)",
          variant: "destructive",
        });
        return;
      }
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please select a file smaller than 10MB",
          variant: "destructive",
        });
        return;
      }
      
      setSelectedFile(file);
      setUploadResult(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress(0);
    setUploadResult(null);

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const formData = new FormData();
      formData.append('file', selectedFile);

      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('No active session');
      }

      const response = await supabase.functions.invoke('client-data-import', {
        body: formData,
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (response.error) {
        throw new Error(response.error.message || 'Upload failed');
      }

      const result = response.data as UploadResult;
      setUploadResult(result);

      if (result.success) {
        toast({
          title: "Upload Successful",
          description: result.message || `Imported ${result.imported} clients`,
        });
      } else {
        toast({
          title: "Upload Completed with Errors",
          description: result.message || "Some records could not be imported",
          variant: "destructive",
        });
      }

    } catch (error) {
      console.error('Upload error:', error);
      setUploadResult({
        success: false,
        message: error instanceof Error ? error.message : 'Upload failed'
      });
      
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "An error occurred during upload",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const downloadSampleTemplate = () => {
    // Create sample data
    const sampleData = [
      {
        first_name: "John",
        last_name: "Doe", 
        email: "john.doe@example.com",
        phone: "+254712345678",
        national_id: "12345678",
        date_of_birth: "1990-01-15",
        gender: "male",
        occupation: "Teacher",
        monthly_income: 50000,
        address: "123 Main Street, Nairobi"
      },
      {
        first_name: "Jane",
        last_name: "Smith",
        email: "jane.smith@example.com", 
        phone: "+254723456789",
        national_id: "87654321",
        date_of_birth: "1985-05-20",
        gender: "female",
        occupation: "Nurse",
        monthly_income: 75000,
        address: "456 Oak Avenue, Mombasa"
      },
      {
        first_name: "Peter",
        last_name: "Mwangi",
        email: "peter.mwangi@example.com",
        phone: "+254734567890", 
        national_id: "11223344",
        date_of_birth: "1988-12-03",
        gender: "male",
        occupation: "Business Owner",
        monthly_income: 120000,
        address: "789 Acacia Road, Kisumu"
      }
    ];

    // Convert to CSV format
    const headers = Object.keys(sampleData[0]);
    const csvContent = [
      headers.join(','),
      ...sampleData.map(row => 
        headers.map(header => {
          const value = row[header as keyof typeof row];
          return typeof value === 'string' && value.includes(',') 
            ? `"${value}"` 
            : value;
        }).join(',')
      )
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'client_import_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Template Downloaded",
      description: "Sample CSV template has been downloaded",
    });
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setUploadResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Client Data Import
        </CardTitle>
        <CardDescription>
          Upload an Excel file to import multiple client records at once
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Download Template */}
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="h-8 w-8 text-green-600" />
            <div>
              <h4 className="font-medium">Download Template</h4>
              <p className="text-sm text-muted-foreground">
                Get the sample Excel template with required columns
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={downloadSampleTemplate}>
            <Download className="h-4 w-4 mr-2" />
            Download Template
          </Button>
        </div>

        {/* File Upload */}
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              <Upload className="h-4 w-4 mr-2" />
              Select Excel File
            </Button>

            {selectedFile && (
              <div className="flex items-center gap-2 text-sm">
                <FileSpreadsheet className="h-4 w-4 text-green-600" />
                <span>{selectedFile.name}</span>
                <span className="text-muted-foreground">
                  ({(selectedFile.size / 1024).toFixed(1)} KB)
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSelection}
                  disabled={isUploading}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>

          {selectedFile && (
            <Button 
              onClick={handleUpload} 
              disabled={isUploading}
              className="w-full"
            >
              {isUploading ? "Uploading..." : "Import Client Data"}
            </Button>
          )}
        </div>

        {/* Progress Bar */}
        {isUploading && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Importing client data...</span>
              <span>{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} className="w-full" />
          </div>
        )}

        {/* Upload Results */}
        {uploadResult && (
          <Alert className={uploadResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
            {uploadResult.success ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600" />
            )}
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-medium">{uploadResult.message}</p>
                {uploadResult.errors && uploadResult.errors.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm font-medium text-red-600 mb-1">Errors encountered:</p>
                    <ul className="text-sm space-y-1 max-h-32 overflow-y-auto">
                      {uploadResult.errors.slice(0, 10).map((error, index) => (
                        <li key={index} className="text-red-600">• {error}</li>
                      ))}
                      {uploadResult.errors.length > 10 && (
                        <li className="text-red-500 italic">
                          ... and {uploadResult.errors.length - 10} more errors
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Instructions */}
        <div className="text-sm text-muted-foreground space-y-2">
          <h4 className="font-medium text-foreground">Instructions:</h4>
          <ul className="space-y-1 ml-4">
            <li>• Download the template to see required column format</li>
            <li>• Required fields: first_name, last_name</li>
            <li>• Optional fields: email, phone, national_id, date_of_birth, gender, occupation, monthly_income, address</li>
            <li>• Date format should be YYYY-MM-DD (e.g., 1990-01-15)</li>
            <li>• Gender should be "male" or "female"</li>
            <li>• Maximum file size: 10MB</li>
            <li>• Supported formats: .xlsx, .xls</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};