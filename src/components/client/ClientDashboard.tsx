// src/components/client/ClientDashboard.tsx - Client portal dashboard
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ClientDashboardProps {
  clientId: string;
}

export const ClientDashboard: React.FC<ClientDashboardProps> = ({ clientId }) => {
  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <Card>
        <CardHeader>
          <CardTitle>Welcome to your Client Portal</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">$0.00</div>
              <div className="text-sm text-muted-foreground">Total Savings</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">$0.00</div>
              <div className="text-sm text-muted-foreground">Outstanding Loans</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">0</div>
              <div className="text-sm text-muted-foreground">Active Loans</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-20 flex flex-col">
              <span>Apply for Loan</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col">
              <span>Make Payment</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col">
              <span>Upload Documents</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col">
              <span>Contact Support</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
