import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface LoginTestResult {
  authSuccess: boolean;
  profileFound: boolean;
  profileActive: boolean;
  roleCorrect: boolean;
  tenantIdNull: boolean;
  error?: string;
  profile?: any;
}

export const SuperAdminLoginTest = () => {
  const [email, setEmail] = useState('justmurenga@gmail.com');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<LoginTestResult | null>(null);
  const { toast } = useToast();

  const testSuperAdminLogin = async () => {
    setLoading(true);
    setResults(null);

    try {
      const result: LoginTestResult = {
        authSuccess: false,
        profileFound: false,
        profileActive: false,
        roleCorrect: false,
        tenantIdNull: false,
      };

      // Step 1: Test authentication
      console.log('Testing authentication...');
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        result.error = `Authentication failed: ${authError.message}`;
        setResults(result);
        toast({
          title: "Authentication Failed",
          description: authError.message,
          variant: "destructive",
        });
        return;
      }

      result.authSuccess = true;
      console.log('Authentication successful:', authData.user?.id);

      // Step 2: Test profile retrieval
      console.log('Testing profile retrieval...');
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', authData.user!.id)
        .eq('is_active', true)
        .single();

      if (profileError) {
        result.error = `Profile retrieval failed: ${profileError.message}`;
        setResults(result);
        toast({
          title: "Profile Retrieval Failed",
          description: profileError.message,
          variant: "destructive",
        });
        return;
      }

      if (!profile) {
        result.error = 'No active profile found';
        setResults(result);
        toast({
          title: "No Profile Found",
          description: "No active profile found for this user",
          variant: "destructive",
        });
        return;
      }

      result.profileFound = true;
      result.profile = profile;

      // Step 3: Check profile properties
      result.profileActive = profile.is_active === true;
      result.roleCorrect = profile.role === 'super_admin';
      result.tenantIdNull = profile.tenant_id === null;

      setResults(result);

      if (result.profileActive && result.roleCorrect && result.tenantIdNull) {
        toast({
          title: "Super Admin Login Test Successful",
          description: "All checks passed! Super admin should be able to login.",
        });
      } else {
        toast({
          title: "Super Admin Login Test Failed",
          description: "Some checks failed. See details below.",
          variant: "destructive",
        });
      }

    } catch (error) {
      console.error('Login test failed:', error);
      setResults({
        authSuccess: false,
        profileFound: false,
        profileActive: false,
        roleCorrect: false,
        tenantIdNull: false,
        error: `Test failed: ${error}`,
      });
      toast({
        title: "Test Error",
        description: "Failed to run login test",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async () => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth`,
      });

      if (error) {
        toast({
          title: "Password Reset Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Password Reset Email Sent",
          description: "Check your email for password reset instructions.",
        });
      }
    } catch (error) {
      toast({
        title: "Password Reset Error",
        description: "Failed to send password reset email",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Super Admin Login Test</CardTitle>
        <CardDescription>
          Test super admin authentication and profile status
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Super admin email"
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={testSuperAdminLogin} 
            disabled={loading}
            className="flex-1"
          >
            {loading ? "Testing..." : "Test Login"}
          </Button>
          <Button 
            onClick={resetPassword} 
            variant="outline"
            disabled={loading}
          >
            Reset Password
          </Button>
        </div>

        {results && (
          <div className="space-y-3">
            <h4 className="font-medium">Test Results:</h4>
            
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center justify-between">
                <span>Authentication:</span>
                <Badge variant={results.authSuccess ? "default" : "destructive"}>
                  {results.authSuccess ? "✅ Success" : "❌ Failed"}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span>Profile Found:</span>
                <Badge variant={results.profileFound ? "default" : "destructive"}>
                  {results.profileFound ? "✅ Found" : "❌ Not Found"}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span>Profile Active:</span>
                <Badge variant={results.profileActive ? "default" : "destructive"}>
                  {results.profileActive ? "✅ Active" : "❌ Inactive"}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span>Role Correct:</span>
                <Badge variant={results.roleCorrect ? "default" : "destructive"}>
                  {results.roleCorrect ? "✅ Super Admin" : "❌ Wrong Role"}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span>Tenant ID Null:</span>
                <Badge variant={results.tenantIdNull ? "default" : "destructive"}>
                  {results.tenantIdNull ? "✅ Null" : "❌ Has Tenant"}
                </Badge>
              </div>
            </div>

            {results.profile && (
              <div className="mt-4 p-3 bg-muted rounded-md">
                <h5 className="font-medium mb-2">Profile Details:</h5>
                <pre className="text-xs overflow-auto">
                  {JSON.stringify(results.profile, null, 2)}
                </pre>
              </div>
            )}

            {results.error && (
              <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                <p className="text-sm text-destructive">{results.error}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
