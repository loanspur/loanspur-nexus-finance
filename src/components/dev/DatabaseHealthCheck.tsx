import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface HealthCheckResult {
  database: boolean;
  superAdmin: boolean;
  passwordReset: boolean;
  error?: string;
}

export const DatabaseHealthCheck = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<HealthCheckResult | null>(null);
  const { toast } = useToast();

  const runHealthCheck = async () => {
    setLoading(true);
    setResults(null);

    try {
      const healthCheck: HealthCheckResult = {
        database: false,
        superAdmin: false,
        passwordReset: false,
      };

      // Test database connection
      try {
        const { data, error } = await supabase.from('profiles').select('count').limit(1);
        healthCheck.database = !error;
        if (error) throw error;
      } catch (error) {
        console.error('Database connection failed:', error);
        healthCheck.error = `Database connection failed: ${error}`;
      }

      // Test super admin user
      try {
        const { data: superAdmin, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', 'justmurenga@gmail.com')
          .eq('role', 'super_admin')
          .single();
        
        healthCheck.superAdmin = !error && !!superAdmin && superAdmin.is_active;
      } catch (error) {
        console.error('Super admin check failed:', error);
      }

      // Test password reset tokens table
      try {
        const { data, error } = await supabase
          .from('password_reset_tokens')
          .select('count')
          .limit(1);
        
        healthCheck.passwordReset = !error;
      } catch (error) {
        console.error('Password reset table check failed:', error);
      }

      setResults(healthCheck);

      if (healthCheck.error) {
        toast({
          title: "Health Check Failed",
          description: healthCheck.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Health Check Complete",
          description: "Database health check completed successfully",
        });
      }
    } catch (error) {
      console.error('Health check failed:', error);
      toast({
        title: "Health Check Error",
        description: "Failed to run health check",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Database Health Check</CardTitle>
        <CardDescription>
          Check database connection and super admin status
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={runHealthCheck} 
          disabled={loading}
          className="w-full"
        >
          {loading ? "Running..." : "Run Health Check"}
        </Button>

        {results && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span>Database Connection:</span>
              <Badge variant={results.database ? "default" : "destructive"}>
                {results.database ? "✅ OK" : "❌ Failed"}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span>Super Admin User:</span>
              <Badge variant={results.superAdmin ? "default" : "destructive"}>
                {results.superAdmin ? "✅ OK" : "❌ Failed"}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span>Password Reset Table:</span>
              <Badge variant={results.passwordReset ? "default" : "destructive"}>
                {results.passwordReset ? "✅ OK" : "❌ Failed"}
              </Badge>
            </div>

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
