import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useLoanDataMigration, useLoanMigrationValidation } from '@/hooks/useLoanDataMigration';
import { 
  Database, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  RefreshCw,
  BarChart3,
  FileCheck,
  DollarSign,
  Calendar
} from 'lucide-react';

export const LoanMigrationPanel = () => {
  const [showDetails, setShowDetails] = useState(false);
  const migrationMutation = useLoanDataMigration();
  const { data: validation, refetch: refetchValidation, isLoading: isValidating } = useLoanMigrationValidation();

  const handleMigration = () => {
    migrationMutation.mutate();
  };

  const getStatusIcon = (isValid: boolean, hasIssues: boolean) => {
    if (isValid) return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (hasIssues) return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    return <XCircle className="h-4 w-4 text-red-500" />;
  };

  const getStatusBadge = (isValid: boolean, hasIssues: boolean) => {
    if (isValid) return <Badge variant="outline" className="text-green-700 border-green-200">Synchronized</Badge>;
    if (hasIssues) return <Badge variant="outline" className="text-yellow-700 border-yellow-200">Needs Attention</Badge>;
    return <Badge variant="outline" className="text-red-700 border-red-200">Migration Required</Badge>;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            <CardTitle>Loan Data Migration & Sync</CardTitle>
          </div>
          {validation && getStatusIcon(validation.isValid, validation.issues.length > 0)}
        </div>
        <CardDescription>
          Synchronize existing loans with the unified transaction management system for enhanced accounting and workflow consistency.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Migration Status */}
        {validation && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">System Status</h4>
              {getStatusBadge(validation.isValid, validation.issues.length > 0)}
            </div>
            
            {/* Metrics Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                  <FileCheck className="h-4 w-4" />
                  Total Loans
                </div>
                <div className="text-2xl font-bold">{validation.metrics.totalLoans}</div>
              </div>
              
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                  <BarChart3 className="h-4 w-4" />
                  With Accounting
                </div>
                <div className="text-2xl font-bold">{validation.metrics.loansWithJournalEntries}</div>
              </div>
              
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  With Schedules
                </div>
                <div className="text-2xl font-bold">{validation.metrics.loansWithSchedules}</div>
              </div>
              
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                  <DollarSign className="h-4 w-4" />
                  Consistent Balances
                </div>
                <div className="text-2xl font-bold">{validation.metrics.consistentBalances}</div>
              </div>
            </div>

            {/* Progress Bar */}
            {validation.metrics.totalLoans > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Migration Progress</span>
                  <span>{Math.round((validation.metrics.consistentBalances / validation.metrics.totalLoans) * 100)}%</span>
                </div>
                <Progress 
                  value={(validation.metrics.consistentBalances / validation.metrics.totalLoans) * 100} 
                  className="h-2" 
                />
              </div>
            )}
          </div>
        )}

        {/* Issues Alert */}
        {validation && validation.issues.length > 0 && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {validation.issues.length} issues found that require migration.
              <Button 
                variant="link" 
                className="p-0 h-auto ml-2" 
                onClick={() => setShowDetails(!showDetails)}
              >
                {showDetails ? 'Hide' : 'Show'} Details
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Detailed Issues */}
        {showDetails && validation && validation.issues.length > 0 && (
          <div className="space-y-2">
            <h5 className="font-medium text-sm">Issues Found:</h5>
            <div className="max-h-40 overflow-y-auto space-y-1">
              {validation.issues.map((issue, index) => (
                <div key={index} className="text-sm p-2 bg-yellow-50 border border-yellow-200 rounded text-yellow-800">
                  {issue}
                </div>
              ))}
            </div>
          </div>
        )}

        <Separator />

        {/* Migration Actions */}
        <div className="space-y-4">
          <h4 className="font-medium">Migration Actions</h4>
          
          <div className="flex gap-3">
            <Button
              onClick={handleMigration}
              disabled={migrationMutation.isPending}
              className="flex items-center gap-2"
            >
              {migrationMutation.isPending ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Database className="h-4 w-4" />
              )}
              {migrationMutation.isPending ? 'Migrating...' : 'Start Migration'}
            </Button>
            
            <Button
              variant="outline"
              onClick={() => refetchValidation()}
              disabled={isValidating}
              className="flex items-center gap-2"
            >
              {isValidating ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Refresh Status
            </Button>
          </div>

          {/* Migration Info */}
          <div className="text-sm text-muted-foreground space-y-1">
            <p>Migration will:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Sync existing loans with unified transaction management</li>
              <li>Create missing journal entries for accounting integration</li>
              <li>Recalculate loan schedules and outstanding balances</li>
              <li>Ensure transaction record consistency</li>
              <li>Preserve all existing business logic and workflows</li>
            </ul>
          </div>
        </div>

        {/* Success Message */}
        {validation && validation.isValid && validation.issues.length === 0 && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              All loans are synchronized with the unified system. No migration required.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};