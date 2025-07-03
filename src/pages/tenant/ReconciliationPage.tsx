import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Upload, Download, CheckCircle, XCircle, AlertCircle, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const reconciliationSchema = z.object({
  report_name: z.string().min(1, "Report name is required"),
  statement_type: z.enum(["bank", "mpesa"]),
  period_start: z.string().min(1, "Start date is required"),
  period_end: z.string().min(1, "End date is required"),
  statement_file: z.any(),
});

type ReconciliationFormData = z.infer<typeof reconciliationSchema>;

// Mock data for reconciliation reports
const mockReports = [
  {
    id: "1",
    report_name: "March 2024 Bank Reconciliation",
    statement_type: "bank",
    period_start: "2024-03-01",
    period_end: "2024-03-31",
    total_statement_amount: 125000,
    total_system_amount: 124500,
    matched_amount: 124000,
    unmatched_amount: 1000,
    reconciliation_status: "completed",
    reconciled_at: "2024-04-01T10:30:00Z",
    created_at: "2024-04-01T08:00:00Z",
  },
  {
    id: "2",
    report_name: "March 2024 M-Pesa Reconciliation",
    statement_type: "mpesa",
    period_start: "2024-03-01",
    period_end: "2024-03-31",
    total_statement_amount: 89000,
    total_system_amount: 88750,
    matched_amount: 88500,
    unmatched_amount: 500,
    reconciliation_status: "pending",
    reconciled_at: null,
    created_at: "2024-04-01T09:15:00Z",
  },
];

const ReconciliationPage = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [reports, setReports] = useState(mockReports);
  const { toast } = useToast();

  const form = useForm<ReconciliationFormData>({
    resolver: zodResolver(reconciliationSchema),
    defaultValues: {
      report_name: "",
      statement_type: "bank",
      period_start: "",
      period_end: "",
    },
  });

  const handleFileUpload = async (data: ReconciliationFormData) => {
    setIsUploading(true);
    try {
      // Simulate file upload and processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newReport = {
        id: (reports.length + 1).toString(),
        report_name: data.report_name,
        statement_type: data.statement_type,
        period_start: data.period_start,
        period_end: data.period_end,
        total_statement_amount: Math.floor(Math.random() * 100000) + 50000,
        total_system_amount: Math.floor(Math.random() * 100000) + 50000,
        matched_amount: Math.floor(Math.random() * 90000) + 45000,
        unmatched_amount: Math.floor(Math.random() * 5000) + 500,
        reconciliation_status: "processing",
        reconciled_at: null,
        created_at: new Date().toISOString(),
      };

      setReports([newReport, ...reports]);
      form.reset();
      
      toast({
        title: "File Uploaded Successfully",
        description: "Statement has been uploaded and reconciliation is in progress.",
      });
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: "Failed to upload statement file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-success text-success-foreground';
      case 'processing':
        return 'bg-warning text-warning-foreground';
      case 'pending':
        return 'bg-muted text-muted-foreground';
      default:
        return 'bg-destructive text-destructive-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'processing':
        return <AlertCircle className="h-4 w-4" />;
      case 'pending':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <XCircle className="h-4 w-4" />;
    }
  };

  const downloadSampleFile = (type: string) => {
    // Create sample CSV content
    const sampleData = type === 'bank' 
      ? `Date,Description,Reference,Debit,Credit,Balance
2024-03-01,Opening Balance,,0,50000,50000
2024-03-02,Loan Repayment,LR001,0,2500,52500
2024-03-03,Savings Deposit,SD001,0,1000,53500
2024-03-04,Admin Fee,AF001,50,0,53450`
      : `Date,Transaction ID,Phone,Amount,Type,Status
2024-03-01,NLJ7RT61SV,254700123456,2500,Payment,Completed
2024-03-02,NLJ8RT62SV,254700654321,1000,Payment,Completed
2024-03-03,NLJ9RT63SV,254700987654,1500,Payment,Completed`;

    const blob = new Blob([sampleData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sample_${type}_statement.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast({
      title: "Sample Downloaded",
      description: `Sample ${type} statement file has been downloaded.`,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Bank Reconciliation</h1>
        <p className="text-muted-foreground">
          Upload bank or M-Pesa statements to verify and reconcile transactions.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Upload Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload Statement
            </CardTitle>
            <CardDescription>
              Upload bank or M-Pesa statements for reconciliation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleFileUpload)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="report_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Report Name</FormLabel>
                      <FormControl>
                        <Input placeholder="March 2024 Bank Reconciliation" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="statement_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Statement Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select statement type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="bank">Bank Statement</SelectItem>
                          <SelectItem value="mpesa">M-Pesa Statement</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="period_start"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Period Start</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="period_end"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Period End</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="statement_file"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Statement File</FormLabel>
                      <FormControl>
                        <Input 
                          type="file" 
                          accept=".csv,.xlsx,.xls"
                          onChange={(e) => field.onChange(e.target.files?.[0])}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" disabled={isUploading} className="w-full">
                  {isUploading ? "Uploading..." : "Upload & Reconcile"}
                </Button>
              </form>
            </Form>

            <div className="mt-4 space-y-2">
              <p className="text-sm font-medium">Download Sample Files:</p>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => downloadSampleFile('bank')}
                >
                  <Download className="h-3 w-3 mr-1" />
                  Bank CSV
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => downloadSampleFile('mpesa')}
                >
                  <Download className="h-3 w-3 mr-1" />
                  M-Pesa CSV
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reconciliation Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Reconciliation Summary
            </CardTitle>
            <CardDescription>
              Latest reconciliation statistics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-success">98.5%</div>
                  <div className="text-sm text-muted-foreground">Match Rate</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-primary">{formatCurrency(214000)}</div>
                  <div className="text-sm text-muted-foreground">Total Reconciled</div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-warning">{formatCurrency(1500)}</div>
                  <div className="text-sm text-muted-foreground">Unmatched</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-muted-foreground">2</div>
                  <div className="text-sm text-muted-foreground">Reports This Month</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reconciliation Reports Table */}
      <Card>
        <CardHeader>
          <CardTitle>Reconciliation Reports</CardTitle>
          <CardDescription>
            History of all reconciliation reports and their status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Report Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Statement Amount</TableHead>
                <TableHead>System Amount</TableHead>
                <TableHead>Variance</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell>
                    <div className="font-medium">{report.report_name}</div>
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(report.created_at), 'MMM dd, yyyy')}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {report.statement_type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {format(new Date(report.period_start), 'MMM dd')} - {format(new Date(report.period_end), 'MMM dd')}
                    </div>
                  </TableCell>
                  <TableCell>{formatCurrency(report.total_statement_amount)}</TableCell>
                  <TableCell>{formatCurrency(report.total_system_amount)}</TableCell>
                  <TableCell>
                    <div className={report.unmatched_amount > 1000 ? "text-destructive" : "text-muted-foreground"}>
                      {formatCurrency(report.unmatched_amount)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(report.reconciliation_status)}>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(report.reconciliation_status)}
                        {report.reconciliation_status}
                      </div>
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">View</Button>
                      <Button variant="outline" size="sm">
                        <Download className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReconciliationPage;