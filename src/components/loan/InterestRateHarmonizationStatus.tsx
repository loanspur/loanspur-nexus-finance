import { AlertTriangle, CheckCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useHarmonizedLoanData } from "@/hooks/useHarmonizedLoanData";

interface InterestRateHarmonizationStatusProps {
  loan: any;
  onHarmonize?: () => void;
}

/**
 * Component to display interest rate harmonization status and allow manual correction
 */
export const InterestRateHarmonizationStatus = ({ 
  loan, 
  onHarmonize 
}: InterestRateHarmonizationStatusProps) => {
  const { harmonizedData, isLoading, refreshHarmonization, isRefreshing } = useHarmonizedLoanData(loan);

  if (isLoading) {
    return (
      <Card className="border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
            <p className="text-sm text-blue-600">Checking loan data consistency...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!harmonizedData) return null;

  const hasInconsistency = !harmonizedData.scheduleConsistent || 
    Math.abs(harmonizedData.calculatedOutstanding - (loan.outstanding_balance || 0)) > 0.01;

  if (!hasInconsistency) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <p className="text-sm text-green-700">Loan data is consistent and harmonized</p>
            <Badge variant="outline" className="border-green-500 text-green-600">
              {harmonizedData.correctedInterestRate.toFixed(2)}% p.a.
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-amber-200 bg-amber-50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <CardTitle className="text-sm text-amber-800">Interest Rate Inconsistency Detected</CardTitle>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              refreshHarmonization();
              onHarmonize?.();
            }}
            disabled={isRefreshing}
            className="border-amber-500 text-amber-600 hover:bg-amber-100"
          >
            {isRefreshing ? (
              <RefreshCw className="h-3 w-3 animate-spin mr-1" />
            ) : (
              <RefreshCw className="h-3 w-3 mr-1" />
            )}
            Harmonize Now
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <CardDescription className="text-amber-700 space-y-2">
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <p className="font-medium">Current Database Rate:</p>
              <p>{(loan.interest_rate * 100).toFixed(2)}% p.a.</p>
            </div>
            <div>
              <p className="font-medium">Harmonized Rate:</p>
              <p>{harmonizedData.correctedInterestRate.toFixed(2)}% p.a.</p>
            </div>
            <div>
              <p className="font-medium">Database Outstanding:</p>
              <p>{(loan.outstanding_balance || 0).toFixed(2)}</p>
            </div>
            <div>
              <p className="font-medium">Calculated Outstanding:</p>
              <p>{harmonizedData.calculatedOutstanding.toFixed(2)}</p>
            </div>
          </div>
          {harmonizedData.daysInArrears > 0 && (
            <div className="mt-2 p-2 bg-red-100 rounded">
              <p className="text-red-700 text-xs font-medium">
                Loan is {harmonizedData.daysInArrears} days in arrears
              </p>
            </div>
          )}
        </CardDescription>
      </CardContent>
    </Card>
  );
};