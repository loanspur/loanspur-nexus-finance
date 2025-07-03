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
import { useAuditCompliance, AuditTrail, ComplianceViolation, DataBackup, SystemHealthMetric, ComplianceReport, ComplianceRule } from "@/hooks/useAuditCompliance";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Area, AreaChart } from "recharts";
import { Shield, Activity, AlertTriangle, Database, FileText, Plus, Eye, CheckCircle, XCircle, Clock, TrendingUp, Download } from "lucide-react";
import { format } from "date-fns";

const AuditCompliancePage = () => {
  const {
    loading,
    fetchAuditTrails,
    logUserActivity,
    fetchComplianceViolations,
    resolveComplianceViolation,
    fetchDataBackups,
    createDataBackup,
    fetchSystemHealthMetrics,
    fetchComplianceReports,
    generateComplianceReport,
    fetchComplianceRules,
    createComplianceRule
  } = useAuditCompliance();

  const [auditTrails, setAuditTrails] = useState<AuditTrail[]>([]);
  const [complianceViolations, setComplianceViolations] = useState<ComplianceViolation[]>([]);
  const [dataBackups, setDataBackups] = useState<DataBackup[]>([]);
  const [healthMetrics, setHealthMetrics] = useState<SystemHealthMetric[]>([]);
  const [complianceReports, setComplianceReports] = useState<ComplianceReport[]>([]);
  const [complianceRules, setComplianceRules] = useState<ComplianceRule[]>([]);
  
  // Dialog states
  const [isBackupDialogOpen, setIsBackupDialogOpen] = useState(false);
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [isRuleDialogOpen, setIsRuleDialogOpen] = useState(false);
  const [isResolveDialogOpen, setIsResolveDialogOpen] = useState(false);
  const [selectedViolation, setSelectedViolation] = useState<ComplianceViolation | null>(null);

  // Form states
  const [backupName, setBackupName] = useState('');
  const [backupType, setBackupType] = useState<'full' | 'incremental' | 'differential'>('full');
  const [backupScope, setBackupScope] = useState<'all_data' | 'tenant_data' | 'specific_tables'>('tenant_data');
  
  const [reportName, setReportName] = useState('');
  const [reportType, setReportType] = useState<'audit_summary' | 'compliance_status' | 'risk_assessment' | 'activity_analysis'>('audit_summary');
  const [reportPeriodStart, setReportPeriodStart] = useState('');
  const [reportPeriodEnd, setReportPeriodEnd] = useState('');

  const [ruleName, setRuleName] = useState('');
  const [ruleDescription, setRuleDescription] = useState('');
  const [ruleType, setRuleType] = useState<'data_retention' | 'access_control' | 'privacy' | 'security' | 'financial'>('security');
  const [ruleSeverity, setRuleSeverity] = useState<'info' | 'warning' | 'error' | 'critical'>('warning');

  const [resolutionNotes, setResolutionNotes] = useState('');

  useEffect(() => {
    loadData();
    // Log page visit
    logUserActivity('page_view', 'Visited Audit & Compliance Dashboard');
  }, []);

  const loadData = async () => {
    const [auditData, violationsData, backupsData, metricsData, reportsData, rulesData] = await Promise.all([
      fetchAuditTrails(),
      fetchComplianceViolations(),
      fetchDataBackups(),
      fetchSystemHealthMetrics(),
      fetchComplianceReports(),
      fetchComplianceRules()
    ]);
    
    setAuditTrails(auditData);
    setComplianceViolations(violationsData);
    setDataBackups(backupsData);
    setHealthMetrics(metricsData);
    setComplianceReports(reportsData);
    setComplianceRules(rulesData);
  };

  const handleCreateBackup = async () => {
    if (!backupName) return;

    const backup = await createDataBackup(backupName, backupType, backupScope);
    if (backup) {
      setDataBackups(prev => [backup, ...prev]);
      setIsBackupDialogOpen(false);
      resetBackupForm();
      logUserActivity('backup_initiated', `Backup created: ${backupName}`);
    }
  };

  const handleGenerateReport = async () => {
    if (!reportName || !reportPeriodStart || !reportPeriodEnd) return;

    const report = await generateComplianceReport(reportName, reportType, reportPeriodStart, reportPeriodEnd);
    if (report) {
      setComplianceReports(prev => [report, ...prev]);
      setIsReportDialogOpen(false);
      resetReportForm();
      logUserActivity('report_generated', `Report generated: ${reportName}`);
    }
  };

  const handleCreateRule = async () => {
    if (!ruleName || !ruleDescription) return;

    const rule = await createComplianceRule(ruleName, ruleDescription, ruleType, {}, ruleSeverity);
    if (rule) {
      setComplianceRules(prev => [rule, ...prev]);
      setIsRuleDialogOpen(false);
      resetRuleForm();
      logUserActivity('compliance_rule_created', `Rule created: ${ruleName}`);
    }
  };

  const handleResolveViolation = async () => {
    if (!selectedViolation || !resolutionNotes) return;

    const success = await resolveComplianceViolation(selectedViolation.id, resolutionNotes);
    if (success) {
      setComplianceViolations(prev => 
        prev.map(v => v.id === selectedViolation.id 
          ? { ...v, status: 'resolved', resolution_notes: resolutionNotes }
          : v
        )
      );
      setIsResolveDialogOpen(false);
      setSelectedViolation(null);
      setResolutionNotes('');
      logUserActivity('violation_resolved', `Resolved violation: ${selectedViolation.violation_type}`);
    }
  };

  const resetBackupForm = () => {
    setBackupName('');
    setBackupType('full');
    setBackupScope('tenant_data');
  };

  const resetReportForm = () => {
    setReportName('');
    setReportType('audit_summary');
    setReportPeriodStart('');
    setReportPeriodEnd('');
  };

  const resetRuleForm = () => {
    setRuleName('');
    setRuleDescription('');
    setRuleType('security');
    setRuleSeverity('warning');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
      case 'resolved':
        return <Badge variant="default" className="bg-green-500 text-white">
          <CheckCircle className="w-3 h-3 mr-1" />
          {status}
        </Badge>;
      case 'pending':
      case 'open':
        return <Badge variant="secondary">
          <Clock className="w-3 h-3 mr-1" />
          {status}
        </Badge>;
      case 'failed':
        return <Badge variant="destructive">
          <XCircle className="w-3 h-3 mr-1" />
          Failed
        </Badge>;
      case 'investigating':
        return <Badge variant="default" className="bg-blue-500 text-white">
          <Eye className="w-3 h-3 mr-1" />
          Investigating
        </Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <Badge variant="destructive">{severity}</Badge>;
      case 'error':
        return <Badge variant="default" className="bg-orange-500 text-white">{severity}</Badge>;
      case 'warning':
        return <Badge variant="default" className="bg-yellow-500 text-white">{severity}</Badge>;
      case 'info':
        return <Badge variant="secondary">{severity}</Badge>;
      default:
        return <Badge variant="outline">{severity}</Badge>;
    }
  };

  const renderAuditChart = () => {
    const actionCounts = auditTrails.reduce((acc, trail) => {
      acc[trail.action] = (acc[trail.action] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const chartData = Object.entries(actionCounts).map(([action, count]) => ({
      action,
      count
    }));

    return (
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="action" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="count" fill="hsl(var(--primary))" />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  const renderHealthMetricsChart = () => {
    const chartData = healthMetrics.map(metric => ({
      name: metric.metric_name,
      value: metric.metric_value,
      status: metric.status,
      warning: metric.threshold_warning,
      critical: metric.threshold_critical
    }));

    return (
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
        </AreaChart>
      </ResponsiveContainer>
    );
  };

  const openViolations = complianceViolations.filter(v => v.status === 'open');
  const criticalViolations = complianceViolations.filter(v => v.severity === 'critical');
  const recentBackups = dataBackups.filter(b => b.backup_status === 'completed').slice(0, 3);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Audit & Compliance</h1>
          <p className="text-muted-foreground">Monitor system activity, compliance status, and data security</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isBackupDialogOpen} onOpenChange={setIsBackupDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Database className="w-4 h-4 mr-2" />
                Create Backup
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Data Backup</DialogTitle>
                <DialogDescription>
                  Initiate a new data backup process
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="backupName">Backup Name</Label>
                  <Input
                    id="backupName"
                    value={backupName}
                    onChange={(e) => setBackupName(e.target.value)}
                    placeholder="Enter backup name"
                  />
                </div>
                <div>
                  <Label htmlFor="backupType">Backup Type</Label>
                  <Select value={backupType} onValueChange={(value: any) => setBackupType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full">Full Backup</SelectItem>
                      <SelectItem value="incremental">Incremental</SelectItem>
                      <SelectItem value="differential">Differential</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="backupScope">Backup Scope</Label>
                  <Select value={backupScope} onValueChange={(value: any) => setBackupScope(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tenant_data">Tenant Data Only</SelectItem>
                      <SelectItem value="all_data">All Data</SelectItem>
                      <SelectItem value="specific_tables">Specific Tables</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleCreateBackup} disabled={loading} className="w-full">
                  {loading ? 'Creating...' : 'Create Backup'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <FileText className="w-4 h-4 mr-2" />
                Generate Report
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Generate Compliance Report</DialogTitle>
                <DialogDescription>
                  Create a comprehensive compliance report
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="reportName">Report Name</Label>
                  <Input
                    id="reportName"
                    value={reportName}
                    onChange={(e) => setReportName(e.target.value)}
                    placeholder="Enter report name"
                  />
                </div>
                <div>
                  <Label htmlFor="reportType">Report Type</Label>
                  <Select value={reportType} onValueChange={(value: any) => setReportType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="audit_summary">Audit Summary</SelectItem>
                      <SelectItem value="compliance_status">Compliance Status</SelectItem>
                      <SelectItem value="risk_assessment">Risk Assessment</SelectItem>
                      <SelectItem value="activity_analysis">Activity Analysis</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="periodStart">Period Start</Label>
                    <Input
                      id="periodStart"
                      type="date"
                      value={reportPeriodStart}
                      onChange={(e) => setReportPeriodStart(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="periodEnd">Period End</Label>
                    <Input
                      id="periodEnd"
                      type="date"
                      value={reportPeriodEnd}
                      onChange={(e) => setReportPeriodEnd(e.target.value)}
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

      {/* Dashboard Overview */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="hover-scale">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-primary">{auditTrails.length}</div>
                <p className="text-sm text-muted-foreground">Audit Trails</p>
              </div>
              <Activity className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="hover-scale">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-destructive">{openViolations.length}</div>
                <p className="text-sm text-muted-foreground">Open Violations</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-destructive" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="hover-scale">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-success">{recentBackups.length}</div>
                <p className="text-sm text-muted-foreground">Recent Backups</p>
              </div>
              <Database className="w-8 h-8 text-success" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="hover-scale">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-primary">{complianceReports.length}</div>
                <p className="text-sm text-muted-foreground">Reports Generated</p>
              </div>
              <FileText className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="audit" className="space-y-6">
        <TabsList>
          <TabsTrigger value="audit">Audit Trails</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="backups">Data Backups</TabsTrigger>
          <TabsTrigger value="health">System Health</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="audit" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Audit Activity Overview</CardTitle>
              <CardDescription>System actions and user activities</CardDescription>
            </CardHeader>
            <CardContent>
              {renderAuditChart()}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Audit Trails</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {auditTrails.slice(0, 10).map((trail) => (
                  <div key={trail.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{trail.action}</Badge>
                        <span className="font-medium">{trail.table_name}</span>
                        {trail.profiles && (
                          <span className="text-sm text-muted-foreground">
                            by {trail.profiles.first_name} {trail.profiles.last_name}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {format(new Date(trail.created_at), 'PPP pp')}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getSeverityBadge(trail.risk_level)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Compliance Monitoring</h2>
            <Dialog open={isRuleDialogOpen} onOpenChange={setIsRuleDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Rule
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Compliance Rule</DialogTitle>
                  <DialogDescription>
                    Define a new compliance rule for monitoring
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="ruleName">Rule Name</Label>
                    <Input
                      id="ruleName"
                      value={ruleName}
                      onChange={(e) => setRuleName(e.target.value)}
                      placeholder="Enter rule name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="ruleDescription">Description</Label>
                    <Textarea
                      id="ruleDescription"
                      value={ruleDescription}
                      onChange={(e) => setRuleDescription(e.target.value)}
                      placeholder="Describe the compliance rule"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="ruleType">Rule Type</Label>
                      <Select value={ruleType} onValueChange={(value: any) => setRuleType(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="security">Security</SelectItem>
                          <SelectItem value="privacy">Privacy</SelectItem>
                          <SelectItem value="financial">Financial</SelectItem>
                          <SelectItem value="data_retention">Data Retention</SelectItem>
                          <SelectItem value="access_control">Access Control</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="ruleSeverity">Severity</Label>
                      <Select value={ruleSeverity} onValueChange={(value: any) => setRuleSeverity(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="info">Info</SelectItem>
                          <SelectItem value="warning">Warning</SelectItem>
                          <SelectItem value="error">Error</SelectItem>
                          <SelectItem value="critical">Critical</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button onClick={handleCreateRule} disabled={loading} className="w-full">
                    {loading ? 'Creating...' : 'Create Rule'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Compliance Violations</CardTitle>
                <CardDescription>
                  {criticalViolations.length} critical violations requiring attention
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {complianceViolations.slice(0, 5).map((violation) => (
                    <div key={violation.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">{violation.violation_type}</div>
                        <div className="text-sm text-muted-foreground">{violation.violation_description}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {format(new Date(violation.created_at), 'PPP')}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getSeverityBadge(violation.severity)}
                        {getStatusBadge(violation.status)}
                        {violation.status === 'open' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedViolation(violation);
                              setIsResolveDialogOpen(true);
                            }}
                          >
                            Resolve
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Compliance Rules</CardTitle>
                <CardDescription>Active monitoring rules</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {complianceRules.slice(0, 5).map((rule) => (
                    <div key={rule.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">{rule.rule_name}</div>
                        <div className="text-sm text-muted-foreground">{rule.rule_description}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Type: {rule.rule_type.replace('_', ' ')}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getSeverityBadge(rule.severity)}
                        <Badge variant={rule.is_active ? "default" : "secondary"}>
                          {rule.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="backups" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Data Backup History</CardTitle>
              <CardDescription>Automated and manual backup operations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dataBackups.map((backup) => (
                  <div key={backup.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{backup.backup_name}</div>
                      <div className="text-sm text-muted-foreground">
                        {backup.backup_type} backup • {backup.backup_scope.replace('_', ' ')}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Started: {format(new Date(backup.started_at || backup.created_at), 'PPP pp')}
                        {backup.completed_at && (
                          <> • Completed: {format(new Date(backup.completed_at), 'PPP pp')}</>
                        )}
                      </div>
                      {backup.file_size && (
                        <div className="text-xs text-muted-foreground">
                          Size: {(backup.file_size / 1024 / 1024).toFixed(2)} MB
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(backup.backup_status)}
                      {backup.backup_status === 'completed' && (
                        <Button size="sm" variant="outline">
                          <Download className="w-3 h-3 mr-1" />
                          Download
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="health" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>System Health Metrics</CardTitle>
              <CardDescription>Real-time system performance and security indicators</CardDescription>
            </CardHeader>
            <CardContent>
              {renderHealthMetricsChart()}
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            {healthMetrics.map((metric) => (
              <Card key={metric.id} className="hover-scale">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{metric.metric_name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold">
                      {metric.metric_value}{metric.metric_unit}
                    </div>
                    <Badge variant={
                      metric.status === 'healthy' ? 'default' :
                      metric.status === 'warning' ? 'secondary' : 'destructive'
                    }>
                      {metric.status}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground mt-2">
                    Type: {metric.metric_type}
                  </div>
                  {metric.threshold_warning && (
                    <div className="text-xs text-muted-foreground">
                      Warning: {metric.threshold_warning} • Critical: {metric.threshold_critical}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Reports</CardTitle>
              <CardDescription>Generated compliance and audit reports</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {complianceReports.map((report) => (
                  <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{report.report_name}</div>
                      <div className="text-sm text-muted-foreground">
                        {report.report_type.replace('_', ' ')} • 
                        {format(new Date(report.report_period_start), 'MMM d')} - 
                        {format(new Date(report.report_period_end), 'MMM d, yyyy')}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Generated: {format(new Date(report.created_at), 'PPP pp')}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(report.report_status)}
                      {report.report_status === 'completed' && (
                        <Button size="sm" variant="outline">
                          <Download className="w-3 h-3 mr-1" />
                          Download
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Resolve Violation Dialog */}
      <Dialog open={isResolveDialogOpen} onOpenChange={setIsResolveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Compliance Violation</DialogTitle>
            <DialogDescription>
              Provide resolution details for this violation
            </DialogDescription>
          </DialogHeader>
          {selectedViolation && (
            <div className="space-y-4">
              <div className="p-3 bg-muted rounded-lg">
                <div className="font-medium">{selectedViolation.violation_type}</div>
                <div className="text-sm text-muted-foreground">{selectedViolation.violation_description}</div>
              </div>
              <div>
                <Label htmlFor="resolutionNotes">Resolution Notes</Label>
                <Textarea
                  id="resolutionNotes"
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Describe how this violation was resolved"
                />
              </div>
              <Button onClick={handleResolveViolation} disabled={loading} className="w-full">
                {loading ? 'Resolving...' : 'Mark as Resolved'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AuditCompliancePage;