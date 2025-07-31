import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Globe, 
  Shield, 
  Copy, 
  Check, 
  AlertCircle, 
  Plus,
  RefreshCw,
  CheckCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  useDomainVerifications,
  useCreateDomainVerification,
  useVerifyDomain,
  useCheckSSLStatus,
  type DomainVerification,
} from '@/hooks/useDomainVerification';

interface DomainManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenantId: string;
}

export const DomainManagementDialog = ({
  open,
  onOpenChange,
  tenantId,
}: DomainManagementDialogProps) => {
  const [newDomain, setNewDomain] = useState('');
  const [copiedRecord, setCopiedRecord] = useState<string | null>(null);
  
  const { toast } = useToast();
  const { data: verifications, isLoading } = useDomainVerifications(tenantId);
  const createDomainVerification = useCreateDomainVerification();
  const verifyDomain = useVerifyDomain();
  const checkSSLStatus = useCheckSSLStatus();

  const handleAddDomain = async () => {
    if (!newDomain.trim()) return;
    
    // Basic domain validation
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9])*$/;
    if (!domainRegex.test(newDomain)) {
      toast({
        title: "Invalid Domain",
        description: "Please enter a valid domain name (e.g., example.com)",
        variant: "destructive",
      });
      return;
    }

    await createDomainVerification.mutateAsync({
      tenantId,
      domain: newDomain.toLowerCase(),
    });
    
    setNewDomain('');
  };

  const handleCopyRecord = async (text: string, recordType: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedRecord(recordType);
    toast({
      title: "Copied",
      description: `${recordType} record copied to clipboard`,
    });
    setTimeout(() => setCopiedRecord(null), 2000);
  };

  const handleVerifyDomain = async (verificationId: string) => {
    await verifyDomain.mutateAsync(verificationId);
  };

  const handleCheckSSL = async () => {
    await checkSSLStatus.mutateAsync(tenantId);
  };

  const getDNSInstructions = (verification: DomainVerification) => (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-lg">DNS Configuration Required</CardTitle>
        <CardDescription>
          Add the following DNS record to your domain's DNS settings to verify ownership
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4">
          <div>
            <Label className="text-sm font-medium">Record Type</Label>
            <div className="flex items-center gap-2 mt-1">
              <code className="bg-muted px-2 py-1 rounded text-sm">
                {verification.dns_record_type}
              </code>
            </div>
          </div>
          
          <div>
            <Label className="text-sm font-medium">Name/Host</Label>
            <div className="flex items-center gap-2 mt-1">
              <code className="bg-muted px-2 py-1 rounded text-sm flex-1">
                {verification.dns_record_name}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCopyRecord(verification.dns_record_name, 'Name')}
              >
                {copiedRecord === 'Name' ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          
          <div>
            <Label className="text-sm font-medium">Value</Label>
            <div className="flex items-center gap-2 mt-1">
              <code className="bg-muted px-2 py-1 rounded text-sm flex-1 break-all">
                {verification.dns_record_value}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCopyRecord(verification.dns_record_value, 'Value')}
              >
                {copiedRecord === 'Value' ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">DNS Configuration Steps:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Log in to your domain registrar or DNS provider</li>
                <li>Navigate to DNS management or DNS records section</li>
                <li>Add a new TXT record with the details above</li>
                <li>Wait for DNS propagation (usually 5-60 minutes)</li>
                <li>Click "Verify Domain" button below</li>
              </ol>
            </div>
          </div>
        </div>

        <Button 
          onClick={() => handleVerifyDomain(verification.id)}
          disabled={verifyDomain.isPending}
          className="w-full"
        >
          <CheckCircle className="h-4 w-4 mr-2" />
          Verify Domain
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Domain & SSL Management
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="domains" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="domains">Custom Domains</TabsTrigger>
            <TabsTrigger value="ssl">SSL Certificates</TabsTrigger>
          </TabsList>

          <TabsContent value="domains" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Add Custom Domain</CardTitle>
                <CardDescription>
                  Add your own domain to access your tenant portal
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input
                    placeholder="example.com"
                    value={newDomain}
                    onChange={(e) => setNewDomain(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddDomain()}
                  />
                  <Button 
                    onClick={handleAddDomain}
                    disabled={createDomainVerification.isPending || !newDomain.trim()}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Domain
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              {isLoading ? (
                <Card>
                  <CardContent className="p-6 text-center">
                    <div className="text-muted-foreground">Loading domains...</div>
                  </CardContent>
                </Card>
              ) : verifications && verifications.length > 0 ? (
                verifications.map((verification) => (
                  <Card key={verification.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{verification.domain}</CardTitle>
                        <div className="flex gap-2">
                          <Badge variant={verification.is_verified ? "default" : "secondary"}>
                            {verification.is_verified ? "Verified" : "Pending"}
                          </Badge>
                          {verification.ssl_certificate_issued && (
                            <Badge variant="default" className="bg-green-100 text-green-800">
                              SSL Active
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {!verification.is_verified && getDNSInstructions(verification)}
                      
                      {verification.is_verified && !verification.ssl_certificate_issued && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="h-5 w-5 text-yellow-600" />
                            <span className="text-sm text-yellow-800">
                              Domain verified! SSL certificate is being issued...
                            </span>
                          </div>
                        </div>
                      )}
                      
                      {verification.is_verified && verification.ssl_certificate_issued && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            <span className="text-sm text-green-800">
                              Domain is fully configured and SSL certificate is active!
                            </span>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="p-6 text-center">
                    <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Custom Domains</h3>
                    <p className="text-muted-foreground mb-4">
                      Add a custom domain to use your own branding
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="ssl" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  SSL Certificate Status
                </CardTitle>
                <CardDescription>
                  Monitor and manage SSL certificates for your domains
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Wildcard SSL (*.loanspurcbs.com)</h4>
                      <p className="text-sm text-muted-foreground">
                        Covers all subdomain access to your tenant
                      </p>
                    </div>
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      Active
                    </Badge>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    onClick={handleCheckSSL}
                    disabled={checkSSLStatus.isPending}
                    className="w-full"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh SSL Status
                  </Button>
                </div>
              </CardContent>
            </Card>

            {verifications && verifications.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Custom Domain SSL Certificates</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {verifications.map((verification) => (
                      <div key={verification.id} className="flex items-center justify-between py-2">
                        <div>
                          <span className="font-medium">{verification.domain}</span>
                          <div className="text-sm text-muted-foreground">
                            {verification.ssl_certificate_issued_at && (
                              <>Issued: {new Date(verification.ssl_certificate_issued_at).toLocaleDateString()}</>
                            )}
                          </div>
                        </div>
                        <Badge 
                          variant={verification.ssl_certificate_issued ? "default" : "secondary"}
                          className={verification.ssl_certificate_issued ? "bg-green-100 text-green-800" : ""}
                        >
                          {verification.ssl_certificate_issued ? "SSL Active" : "Pending"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};