import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface DeploymentStatus {
  mainDomain: boolean;
  authRoute: boolean;
  apiConnection: boolean;
  sslStatus: boolean;
  error?: string;
}

export const DeploymentStatus = () => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<DeploymentStatus | null>(null);
  const { toast } = useToast();

  const checkDeployment = async () => {
    setLoading(true);
    setStatus(null);

    try {
      const deploymentStatus: DeploymentStatus = {
        mainDomain: false,
        authRoute: false,
        apiConnection: false,
        sslStatus: false,
      };

      // Check main domain
      try {
        const mainResponse = await fetch('https://loanspur.online/', {
          method: 'HEAD',
          mode: 'no-cors',
        });
        deploymentStatus.mainDomain = true;
      } catch (error) {
        console.error('Main domain check failed:', error);
      }

      // Check auth route
      try {
        const authResponse = await fetch('https://loanspur.online/auth', {
          method: 'HEAD',
          mode: 'no-cors',
        });
        deploymentStatus.authRoute = true;
      } catch (error) {
        console.error('Auth route check failed:', error);
      }

      // Check API connection
      try {
        const apiResponse = await fetch('https://woqesvsopdgoikpatzxp.supabase.co/rest/v1/', {
          method: 'HEAD',
        });
        deploymentStatus.apiConnection = apiResponse.ok;
      } catch (error) {
        console.error('API connection check failed:', error);
      }

      // Check SSL status
      try {
        const sslResponse = await fetch('https://loanspur.online/health', {
          method: 'GET',
        });
        deploymentStatus.sslStatus = sslResponse.ok;
      } catch (error) {
        console.error('SSL check failed:', error);
      }

      setStatus(deploymentStatus);

      const allGood = Object.values(deploymentStatus).every(Boolean);
      if (allGood) {
        toast({
          title: "Deployment Status: Healthy",
          description: "All checks passed successfully",
        });
      } else {
        toast({
          title: "Deployment Status: Issues Found",
          description: "Some checks failed. See details below.",
          variant: "destructive",
        });
      }

    } catch (error) {
      console.error('Deployment check failed:', error);
      setStatus({
        mainDomain: false,
        authRoute: false,
        apiConnection: false,
        sslStatus: false,
        error: `Check failed: ${error}`,
      });
      toast({
        title: "Deployment Check Failed",
        description: "Failed to check deployment status",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const openDeploymentUrl = () => {
    window.open('https://loanspur.online/auth', '_blank');
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Deployment Status</CardTitle>
        <CardDescription>
          Check if the application is properly deployed
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={checkDeployment} 
          disabled={loading}
          className="w-full"
        >
          {loading ? "Checking..." : "Check Deployment"}
        </Button>

        <Button 
          onClick={openDeploymentUrl} 
          variant="outline"
          className="w-full"
        >
          Open Production Site
        </Button>

        {status && (
          <div className="space-y-2">
            <h4 className="font-medium">Status Results:</h4>
            
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span>Main Domain:</span>
                <Badge variant={status.mainDomain ? "default" : "destructive"}>
                  {status.mainDomain ? "✅ Online" : "❌ Offline"}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span>Auth Route:</span>
                <Badge variant={status.authRoute ? "default" : "destructive"}>
                  {status.authRoute ? "✅ Working" : "❌ 404 Error"}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span>API Connection:</span>
                <Badge variant={status.apiConnection ? "default" : "destructive"}>
                  {status.apiConnection ? "✅ Connected" : "❌ Failed"}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span>SSL Status:</span>
                <Badge variant={status.sslStatus ? "default" : "destructive"}>
                  {status.sslStatus ? "✅ Secure" : "❌ Issues"}
                </Badge>
              </div>
            </div>

            {status.error && (
              <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                <p className="text-sm text-destructive">{status.error}</p>
              </div>
            )}

            {!status.authRoute && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <h5 className="font-medium text-yellow-800 mb-2">Auth Route 404 Fix:</h5>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• Check if the app is deployed to DigitalOcean</li>
                  <li>• Verify nginx configuration is correct</li>
                  <li>• Ensure all routes are properly configured</li>
                  <li>• Check if the build process completed successfully</li>
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
