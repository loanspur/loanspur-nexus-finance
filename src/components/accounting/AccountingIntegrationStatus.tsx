import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  TrendingUp, 
  Settings,
  ArrowRight
} from "lucide-react";
import { useProductAccountingSetup, useValidateProductAccounting } from "@/hooks/useProductAccounting";
import { Link } from "react-router-dom";

export const AccountingIntegrationStatus = () => {
  const { data: productSetup = [], isLoading } = useProductAccountingSetup();
  const { data: validation } = useValidateProductAccounting();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Accounting Integration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
            <p className="text-sm text-muted-foreground mt-2">Loading...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const loanProducts = productSetup.filter(p => p.product_type === 'loan');
  const completeProducts = loanProducts.filter(p => p.has_complete_setup && p.is_accounting_enabled);
  const incompleteProducts = loanProducts.filter(p => !p.has_complete_setup || !p.is_accounting_enabled);
  
  const integrationPercentage = loanProducts.length > 0 
    ? Math.round((completeProducts.length / loanProducts.length) * 100)
    : 0;

  const getStatusColor = () => {
    if (integrationPercentage >= 80) return "text-success";
    if (integrationPercentage >= 50) return "text-warning";
    return "text-destructive";
  };

  const getStatusIcon = () => {
    if (integrationPercentage >= 80) return <CheckCircle className="w-5 h-5 text-success" />;
    if (integrationPercentage >= 50) return <AlertTriangle className="w-5 h-5 text-warning" />;
    return <XCircle className="w-5 h-5 text-destructive" />;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Accounting Integration
        </CardTitle>
        <CardDescription>
          Product accounting setup and integration status
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Status */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-3">
            {getStatusIcon()}
            <div>
              <p className="font-medium">Integration Coverage</p>
              <p className="text-sm text-muted-foreground">
                {completeProducts.length} of {loanProducts.length} products configured
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className={`text-2xl font-bold ${getStatusColor()}`}>
              {integrationPercentage}%
            </div>
            <p className="text-xs text-muted-foreground">Complete</p>
          </div>
        </div>

        {/* Validation Issues */}
        {validation && !validation.isValid && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <p className="font-semibold mb-1">Setup Issues Found:</p>
              <ul className="text-sm space-y-1">
                {validation.issues.slice(0, 2).map((issue, index) => (
                  <li key={index}>• {issue}</li>
                ))}
                {validation.issues.length > 2 && (
                  <li>• And {validation.issues.length - 2} more issues</li>
                )}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Product Breakdown */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Product Status</span>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-success" />
                <span>{completeProducts.length} Complete</span>
              </div>
              <div className="flex items-center gap-1">
                <XCircle className="w-3 h-3 text-destructive" />
                <span>{incompleteProducts.length} Incomplete</span>
              </div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-200"
              style={{ width: `${integrationPercentage}%` }}
            />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2 pt-2">
          <Button asChild variant="outline" size="sm">
            <Link to="/tenant/accounting">
              <Settings className="w-3 h-3 mr-1" />
              Configure
            </Link>
          </Button>
          
          {incompleteProducts.length > 0 && (
            <Button asChild variant="outline" size="sm">
              <Link to="/tenant/loans">
                <ArrowRight className="w-3 h-3 mr-1" />
                Setup Products
              </Link>
            </Button>
          )}
        </div>

        {/* Recent Activity Summary */}
        {completeProducts.length > 0 && (
          <div className="pt-3 border-t">
            <p className="text-xs text-muted-foreground">
              ✅ {completeProducts.length} product(s) ready for automated accounting
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};