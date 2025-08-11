import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";

interface LoanScheduleTableProps {
  loanSchedules: any[];
}

export const LoanScheduleTable: React.FC<LoanScheduleTableProps> = ({ loanSchedules = [] }) => {
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Principal</TableHead>
              <TableHead>Interest</TableHead>
              <TableHead>Fees</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Paid</TableHead>
              <TableHead>Outstanding</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(loanSchedules || []).map((s: any, idx: number) => (
              <TableRow key={s.id ?? idx}>
                <TableCell>{s.installment_number ?? idx + 1}</TableCell>
                <TableCell>{s.due_date}</TableCell>
                <TableCell>{Number(s.principal_amount || 0).toLocaleString()}</TableCell>
                <TableCell>{Number(s.interest_amount || 0).toLocaleString()}</TableCell>
                <TableCell>{Number(s.fee_amount || 0).toLocaleString()}</TableCell>
                <TableCell>{Number(s.total_amount || 0).toLocaleString()}</TableCell>
                <TableCell>{Number(s.paid_amount || 0).toLocaleString()}</TableCell>
                <TableCell>{Number(s.outstanding_amount || 0).toLocaleString()}</TableCell>
                <TableCell>{s.payment_status}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default LoanScheduleTable;
