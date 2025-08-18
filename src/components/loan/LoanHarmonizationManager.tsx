import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, CheckCircle, RefreshCw, Database, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface HarmonizationResult {
  loan_id: string;
  old_interest_rate: number;
  new_interest_rate: number;
  old_outstanding: number;
  new_outstanding: number;
  status: string;
}

/**
 * Component to manage and execute batch loan harmonization
 */
export const LoanHarmonizationManager = () => {
  const [isHarmonizing, setIsHarmonizing] = useState(false);
  const [harmonizationResults, setHarmonizationResults] = useState<HarmonizationResult[]>([]);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();
  const { profile } = useAuth();

  const executeHarmonization = async () => {
    if (!profile) {
      toast({
        title: "Authentication Required",
        description: "Please log in to perform loan harmonization",
        variant: "destructive",
      });
      return;
    }

    setIsHarmonizing(true);
    setProgress(0);
    
    try {
      // Call the database function to harmonize all loans
      const { data, error } = await supabase.rpc('harmonize_all_existing_loans');
      
      if (error) {
        throw error;
      }

      setHarmonizationResults(data || []);
      setProgress(100);

      // Log the harmonization activity
      if (data && data.length > 0) {
        const logEntries = data.map((result: HarmonizationResult) => ({
          tenant_id: profile.tenant_id,
          loan_id: result.loan_id,
          old_interest_rate: result.old_interest_rate,
          new_interest_rate: result.new_interest_rate,
          old_outstanding_balance: result.old_outstanding,
          new_outstanding_balance: result.new_outstanding,
          harmonization_type: 'batch_auto',
          performed_by: profile.id,
          notes: 'Batch harmonization via admin panel'
        }));

        await supabase
          .from('loan_harmonization_log')
          .insert(logEntries);
      }

      toast({
        title: "Harmonization Complete",
        description: `Successfully harmonized ${data?.length || 0} loans`,
      });

    } catch (error) {
      console.error('Harmonization failed:', error);
      toast({
        title: "Harmonization Failed",
        description: "An error occurred during loan harmonization",
        variant: "destructive",
      });
    } finally {
      setIsHarmonizing(false);
    }
  };

  const clearResults = () => {
    setHarmonizationResults([]);
    setProgress(0);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Loan Data Harmonization
          </CardTitle>
          <CardDescription>
            Synchronize all existing loans with the new unified transaction management system.
            This will normalize interest rates, recalculate outstanding balances, and ensure data consistency.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Button
              onClick={executeHarmonization}
              disabled={isHarmonizing}
              className="flex items-center gap-2"
            >
              {isHarmonizing ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <TrendingUp className="h-4 w-4" />
              )}
              {isHarmonizing ? "Harmonizing..." : "Harmonize All Loans"}
            </Button>
            
            {harmonizationResults.length > 0 && (
              <Button variant="outline" onClick={clearResults}>
                Clear Results
              </Button>
            )}
          </div>

          {isHarmonizing && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Processing loans...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}
        </CardContent>
      </Card>

      {harmonizationResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Harmonization Results
            </CardTitle>
            <CardDescription>
              {harmonizationResults.length} loans were processed and updated
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Summary Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm font-medium text-green-800">Loans Updated</p>
                  <p className="text-2xl font-bold text-green-900">{harmonizationResults.length}</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm font-medium text-blue-800">Rate Changes</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {harmonizationResults.filter(r => 
                      Math.abs(r.old_interest_rate - r.new_interest_rate) > 0.01
                    ).length}
                  </p>
                </div>
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <p className="text-sm font-medium text-amber-800">Balance Adjustments</p>
                  <p className="text-2xl font-bold text-amber-900">
                    {harmonizationResults.filter(r => 
                      Math.abs(r.old_outstanding - r.new_outstanding) > 0.01
                    ).length}
                  </p>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <p className="text-sm font-medium text-purple-800">Success Rate</p>
                  <p className="text-2xl font-bold text-purple-900">100%</p>
                </div>
              </div>

              {/* Detailed Results Table */}
              <div className="overflow-x-auto">
                <div className="max-h-60 overflow-y-auto border rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="bg-muted sticky top-0">
                      <tr>
                        <th className="p-2 text-left">Loan ID</th>
                        <th className="p-2 text-left">Interest Rate Change</th>
                        <th className="p-2 text-left">Outstanding Balance Change</th>
                        <th className="p-2 text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {harmonizationResults.map((result, index) => {
                        const rateChanged = Math.abs(result.old_interest_rate - result.new_interest_rate) > 0.01;
                        const balanceChanged = Math.abs(result.old_outstanding - result.new_outstanding) > 0.01;
                        
                        return (
                          <tr key={index} className="border-b">
                            <td className="p-2 font-mono text-xs">
                              {result.loan_id.substring(0, 8)}...
                            </td>
                            <td className="p-2">
                              {rateChanged ? (
                                <div className="flex items-center gap-1">
                                  <span className="text-red-600">{(result.old_interest_rate * 100).toFixed(2)}%</span>
                                  <span>→</span>
                                  <span className="text-green-600">{result.new_interest_rate.toFixed(2)}%</span>
                                  <AlertTriangle className="h-3 w-3 text-amber-500" />
                                </div>
                              ) : (
                                <span className="text-muted-foreground">No change</span>
                              )}
                            </td>
                            <td className="p-2">
                              {balanceChanged ? (
                                <div className="flex items-center gap-1">
                                  <span className="text-red-600">{result.old_outstanding.toFixed(2)}</span>
                                  <span>→</span>
                                  <span className="text-green-600">{result.new_outstanding.toFixed(2)}</span>
                                  <AlertTriangle className="h-3 w-3 text-amber-500" />
                                </div>
                              ) : (
                                <span className="text-muted-foreground">No change</span>
                              )}
                            </td>
                            <td className="p-2">
                              <Badge variant="outline" className="border-green-500 text-green-600">
                                {result.status}
                              </Badge>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};