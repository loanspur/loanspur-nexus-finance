import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface LoanDetailsProps {
  loanData: any;
}

export const LoanDetails: React.FC<LoanDetailsProps> = ({ loanData }) => {
  if (!loanData) return null;
  const client = loanData.clients;
  const product = loanData.loan_products;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex gap-2 items-center">
          <span>Client:</span>
          <span className="font-medium">{client ? `${client.first_name} ${client.last_name}` : '-'}</span>
        </div>
        <div className="flex gap-2 items-center">
          <span>Product:</span>
          <span className="font-medium">{product?.name ?? '-'}</span>
        </div>
        <div className="flex gap-2 items-center">
          <span>Status:</span>
          <Badge variant="outline">{loanData.status}</Badge>
        </div>
        <div className="flex gap-2 items-center">
          <span>Principal:</span>
          <span className="font-medium">KES {Number(loanData.principal_amount || 0).toLocaleString()}</span>
        </div>
        <div className="flex gap-2 items-center">
          <span>Outstanding:</span>
          <span className="font-semibold">KES {Number(loanData.outstanding_balance || 0).toLocaleString()}</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default LoanDetails;
