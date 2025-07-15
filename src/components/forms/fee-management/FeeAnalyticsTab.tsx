import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const existingFeesCount = 4;
const activeFeesCount = 3;

export const FeeAnalyticsTab = () => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Fee Income</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">KSh 145,000</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Fees</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeFeesCount}</div>
            <p className="text-xs text-muted-foreground">
              of {existingFeesCount} total fees
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average Fee Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">KSh 450</div>
            <p className="text-xs text-muted-foreground">Per transaction</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Fee Performance by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span>Loan Fees</span>
              <span className="font-semibold">KSh 85,000 (58.6%)</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Account Fees</span>
              <span className="font-semibold">KSh 35,000 (24.1%)</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Transaction Fees</span>
              <span className="font-semibold">KSh 15,000 (10.3%)</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Penalty Fees</span>
              <span className="font-semibold">KSh 10,000 (6.9%)</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};