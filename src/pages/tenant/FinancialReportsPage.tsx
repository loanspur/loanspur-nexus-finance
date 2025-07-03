import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useFinancialReporting, FinancialReport, ChartOfAccount, PortfolioAnalysis } from "@/hooks/useFinancialReporting";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { FileText, TrendingUp, Download, Plus, Calculator, PieChart as PieChartIcon, BarChart3 } from "lucide-react";
import { format } from "date-fns";

const FinancialReportsPage = () => {
  const {
    loading,
    generateFinancialReport,
    fetchFinancialReports,
    fetchChartOfAccounts,
    generatePortfolioAnalysis,
    fetchPortfolioAnalysis
  } = useFinancialReporting();

  const [reports, setReports] = useState<FinancialReport[]>([]);
  const [accounts, setAccounts] = useState<ChartOfAccount[]>([]);
  const [portfolioAnalysis, setPortfolioAnalysis] = useState<PortfolioAnalysis[]>([]);
  const [selectedReport, setSelectedReport] = useState<FinancialReport | null>(null);
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false);

  // Form states
  const [reportType, setReportType] = useState<FinancialReport['report_type']>('balance_sheet');
  const [reportName, setReportName] = useState('');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [reportsData, accountsData, portfolioData] = await Promise.all([
      fetchFinancialReports(),
      fetchChartOfAccounts(),
      fetchPortfolioAnalysis()
    ]);
    
    setReports(reportsData);
    setAccounts(accountsData);
    setPortfolioAnalysis(portfolioData);
  };

  const handleGenerateReport = async () => {
    if (!reportName || !periodStart || !periodEnd) return;

    const report = await generateFinancialReport(reportType, reportName, periodStart, periodEnd);
    if (report) {
      setReports(prev => [report, ...prev]);
      setIsGenerateDialogOpen(false);
      setReportName('');
      setPeriodStart('');
      setPeriodEnd('');
    }
  };

  const handleGeneratePortfolioAnalysis = async () => {
    const today = new Date().toISOString().split('T')[0];
    const analysis = await generatePortfolioAnalysis(today);
    if (analysis) {
      setPortfolioAnalysis(prev => [analysis, ...prev]);
    }
  };

  const getStatusBadge = (status: FinancialReport['status']) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-500">Completed</Badge>;
      case 'generating':
        return <Badge variant="secondary">Generating</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  const getReportTypeIcon = (type: FinancialReport['report_type']) => {
    switch (type) {
      case 'balance_sheet':
      case 'profit_loss':
        return <FileText className="w-4 h-4" />;
      case 'portfolio_analysis':
        return <TrendingUp className="w-4 h-4" />;
      case 'loan_aging':
        return <BarChart3 className="w-4 h-4" />;
      default:
        return <PieChartIcon className="w-4 h-4" />;
    }
  };

  const renderReportData = (report: FinancialReport) => {
    if (!report.report_data) return <div>No data available</div>;

    switch (report.report_type) {
      case 'balance_sheet':
        return renderBalanceSheet(report.report_data);
      case 'profit_loss':
        return renderProfitLoss(report.report_data);
      case 'loan_aging':
        return renderLoanAging(report.report_data);
      default:
        return <pre className="text-sm">{JSON.stringify(report.report_data, null, 2)}</pre>;
    }
  };

  const renderBalanceSheet = (data: any) => (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Assets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Current Assets</span>
                <span>${data.assets?.current_assets?.reduce((sum: number, acc: any) => sum + acc.balance, 0).toLocaleString() || '0'}</span>
              </div>
              <div className="flex justify-between font-semibold border-t pt-2">
                <span>Total Assets</span>
                <span>${data.assets?.total_assets?.toLocaleString() || '0'}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Liabilities & Equity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Current Liabilities</span>
                <span>${data.liabilities?.current_liabilities?.reduce((sum: number, acc: any) => sum + acc.balance, 0).toLocaleString() || '0'}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Equity</span>
                <span>${data.equity?.total_equity?.toLocaleString() || '0'}</span>
              </div>
              <div className="flex justify-between font-semibold border-t pt-2">
                <span>Total Liab. + Equity</span>
                <span>${((data.liabilities?.total_liabilities || 0) + (data.equity?.total_equity || 0)).toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderProfitLoss = (data: any) => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profit & Loss Statement</CardTitle>
          <CardDescription>
            For period: {data.period_start} to {data.period_end}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium">Revenue</h4>
              <div className="flex justify-between">
                <span>Total Revenue</span>
                <span>${data.revenue?.total_revenue?.toLocaleString() || '0'}</span>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Expenses</h4>
              <div className="flex justify-between">
                <span>Total Expenses</span>
                <span>${data.expenses?.total_expenses?.toLocaleString() || '0'}</span>
              </div>
            </div>
            <div className="flex justify-between font-semibold text-lg border-t pt-2">
              <span>Net Income</span>
              <span className={data.net_income >= 0 ? 'text-green-600' : 'text-red-600'}>
                ${data.net_income?.toLocaleString() || '0'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderLoanAging = (data: any) => {
    const chartData = Object.entries(data.aging_buckets || {}).map(([key, value]: [string, any]) => ({
      name: key.replace(/_/g, ' ').toUpperCase(),
      count: value.count,
      amount: value.amount
    }));

    return (
      <div className="space-y-6">
        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold">{data.summary?.total_loans || 0}</div>
              <p className="text-sm text-muted-foreground">Total Loans</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold">${(data.summary?.total_portfolio || 0).toLocaleString()}</div>
              <p className="text-sm text-muted-foreground">Total Portfolio</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold">${(data.summary?.total_overdue || 0).toLocaleString()}</div>
              <p className="text-sm text-muted-foreground">Total Overdue</p>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Loan Aging Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="amount" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderPortfolioAnalysis = () => {
    if (portfolioAnalysis.length === 0) return null;

    const latest = portfolioAnalysis[0];
    const chartData = [
      { name: 'Active Loans', value: latest.active_loans },
      { name: 'Overdue Loans', value: latest.overdue_loans }
    ];

    const COLORS = ['hsl(var(--primary))', 'hsl(var(--destructive))'];

    return (
      <div className="space-y-6">
        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold">${latest.total_portfolio_value.toLocaleString()}</div>
              <p className="text-sm text-muted-foreground">Portfolio Value</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold">{latest.active_loans}</div>
              <p className="text-sm text-muted-foreground">Active Loans</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold">${latest.average_loan_size.toLocaleString()}</div>
              <p className="text-sm text-muted-foreground">Avg Loan Size</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold">{((latest.par_30 / latest.total_portfolio_value) * 100).toFixed(1)}%</div>
              <p className="text-sm text-muted-foreground">PAR 30</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Loan Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Financial Reports</h1>
          <p className="text-muted-foreground">Generate and manage financial reports</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleGeneratePortfolioAnalysis} variant="outline">
            <Calculator className="w-4 h-4 mr-2" />
            Generate Portfolio Analysis
          </Button>
          <Dialog open={isGenerateDialogOpen} onOpenChange={setIsGenerateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Generate Report
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Generate Financial Report</DialogTitle>
                <DialogDescription>
                  Create a new financial report for your organization
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="reportType">Report Type</Label>
                  <Select value={reportType} onValueChange={(value: any) => setReportType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="balance_sheet">Balance Sheet</SelectItem>
                      <SelectItem value="profit_loss">Profit & Loss</SelectItem>
                      <SelectItem value="cash_flow">Cash Flow Statement</SelectItem>
                      <SelectItem value="portfolio_analysis">Portfolio Analysis</SelectItem>
                      <SelectItem value="loan_aging">Loan Aging Report</SelectItem>
                      <SelectItem value="regulatory_cbk">Regulatory (CBK)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="reportName">Report Name</Label>
                  <Input
                    id="reportName"
                    value={reportName}
                    onChange={(e) => setReportName(e.target.value)}
                    placeholder="Enter report name"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="periodStart">Period Start</Label>
                    <Input
                      id="periodStart"
                      type="date"
                      value={periodStart}
                      onChange={(e) => setPeriodStart(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="periodEnd">Period End</Label>
                    <Input
                      id="periodEnd"
                      type="date"
                      value={periodEnd}
                      onChange={(e) => setPeriodEnd(e.target.value)}
                    />
                  </div>
                </div>
                <Button onClick={handleGenerateReport} disabled={loading} className="w-full">
                  {loading ? 'Generating...' : 'Generate Report'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="reports" className="space-y-6">
        <TabsList>
          <TabsTrigger value="reports">Financial Reports</TabsTrigger>
          <TabsTrigger value="portfolio">Portfolio Analysis</TabsTrigger>
          <TabsTrigger value="accounts">Chart of Accounts</TabsTrigger>
        </TabsList>

        <TabsContent value="reports" className="space-y-6">
          <div className="grid gap-6">
            {reports.map((report) => (
              <Card key={report.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getReportTypeIcon(report.report_type)}
                    <div>
                      <CardTitle className="text-lg">{report.report_name}</CardTitle>
                      <CardDescription>
                        {format(new Date(report.report_period_start), 'MMM dd, yyyy')} - {format(new Date(report.report_period_end), 'MMM dd, yyyy')}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(report.status)}
                    {report.status === 'completed' && (
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Export
                      </Button>
                    )}
                  </div>
                </CardHeader>
                {report.status === 'completed' && selectedReport?.id === report.id && (
                  <CardContent>
                    {renderReportData(report)}
                  </CardContent>
                )}
                {report.status === 'completed' && selectedReport?.id !== report.id && (
                  <CardContent>
                    <Button 
                      variant="ghost" 
                      onClick={() => setSelectedReport(selectedReport?.id === report.id ? null : report)}
                    >
                      View Report Details
                    </Button>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="portfolio">
          {renderPortfolioAnalysis()}
        </TabsContent>

        <TabsContent value="accounts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Chart of Accounts</CardTitle>
              <CardDescription>Manage your accounting structure</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {['asset', 'liability', 'equity', 'revenue', 'expense'].map((type) => (
                  <div key={type}>
                    <h4 className="font-medium capitalize mb-2">{type}s</h4>
                    <div className="space-y-2">
                      {accounts
                        .filter(acc => acc.account_type === type)
                        .map((account) => (
                          <div key={account.id} className="flex justify-between items-center p-3 border rounded">
                            <div>
                              <div className="font-medium">{account.account_code} - {account.account_name}</div>
                              <div className="text-sm text-muted-foreground">{account.description}</div>
                            </div>
                            <div className="text-right">
                              <div className="font-medium">${account.balance.toLocaleString()}</div>
                              <Badge variant="outline" className="text-xs">{account.account_category}</Badge>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FinancialReportsPage;