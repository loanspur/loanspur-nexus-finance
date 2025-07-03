import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "@/hooks/use-toast";

export interface AuditTrail {
  id: string;
  tenant_id: string;
  user_id?: string;
  table_name: string;
  record_id?: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'EXPORT' | 'IMPORT' | 'BACKUP' | 'RESTORE' | 'VIEW';
  old_values?: any;
  new_values?: any;
  ip_address?: string;
  user_agent?: string;
  session_id?: string;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  compliance_flags: string[];
  created_at: string;
  profiles?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

export interface UserActivitySession {
  id: string;
  user_id: string;
  session_token: string;
  ip_address?: string;
  user_agent?: string;
  device_fingerprint?: string;
  login_time: string;
  logout_time?: string;
  last_activity: string;
  is_active: boolean;
  location_data?: any;
  tenant_id: string;
  created_at: string;
  profiles?: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

export interface UserActivityLog {
  id: string;
  session_id: string;
  user_id: string;
  tenant_id: string;
  activity_type: string;
  activity_description?: string;
  page_url?: string;
  api_endpoint?: string;
  request_method?: string;
  response_status?: number;
  duration_ms?: number;
  metadata: any;
  created_at: string;
}

export interface ComplianceRule {
  id: string;
  tenant_id: string;
  rule_name: string;
  rule_description?: string;
  rule_type: 'data_retention' | 'access_control' | 'privacy' | 'security' | 'financial';
  rule_config: any;
  severity: 'info' | 'warning' | 'error' | 'critical';
  is_active: boolean;
  auto_remediation: boolean;
  remediation_config?: any;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface ComplianceViolation {
  id: string;
  tenant_id: string;
  rule_id: string;
  violation_type: string;
  violation_description: string;
  affected_table?: string;
  affected_record_id?: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  status: 'open' | 'investigating' | 'resolved' | 'ignored';
  auto_detected: boolean;
  detection_details?: any;
  resolution_notes?: string;
  resolved_by?: string;
  resolved_at?: string;
  created_at: string;
  updated_at: string;
  compliance_rules?: ComplianceRule;
}

export interface DataBackup {
  id: string;
  tenant_id: string;
  backup_name: string;
  backup_type: 'full' | 'incremental' | 'differential';
  backup_scope: 'all_data' | 'tenant_data' | 'specific_tables';
  backup_config?: any;
  file_path?: string;
  file_size?: number;
  checksum?: string;
  backup_status: 'pending' | 'in_progress' | 'completed' | 'failed';
  started_at?: string;
  completed_at?: string;
  retention_until?: string;
  backup_metadata?: any;
  error_message?: string;
  created_by?: string;
  created_at: string;
}

export interface SystemHealthMetric {
  id: string;
  tenant_id?: string;
  metric_name: string;
  metric_value: number;
  metric_unit?: string;
  metric_type: 'performance' | 'security' | 'compliance' | 'availability';
  threshold_warning?: number;
  threshold_critical?: number;
  status: 'healthy' | 'warning' | 'critical';
  metadata?: any;
  recorded_at: string;
  created_at: string;
}

export interface ComplianceReport {
  id: string;
  tenant_id: string;
  report_name: string;
  report_type: 'audit_summary' | 'compliance_status' | 'risk_assessment' | 'activity_analysis';
  report_period_start: string;
  report_period_end: string;
  report_data: any;
  report_status: 'generating' | 'completed' | 'failed';
  file_url?: string;
  generated_by?: string;
  generated_at?: string;
  created_at: string;
}

export const useAuditCompliance = () => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);

  // Audit Trails
  const fetchAuditTrails = async (
    filters?: {
      table_name?: string;
      action?: string;
      user_id?: string;
      date_from?: string;
      date_to?: string;
    }
  ): Promise<AuditTrail[]> => {
    if (!profile?.tenant_id) return [];
    
    let query = supabase
      .from('audit_trails')
      .select(`
        *,
        profiles (first_name, last_name, email)
      `)
      .eq('tenant_id', profile.tenant_id)
      .order('created_at', { ascending: false })
      .limit(100);

    if (filters?.table_name) {
      query = query.eq('table_name', filters.table_name);
    }
    if (filters?.action) {
      query = query.eq('action', filters.action as AuditTrail['action']);
    }
    if (filters?.user_id) {
      query = query.eq('user_id', filters.user_id);
    }
    if (filters?.date_from) {
      query = query.gte('created_at', filters.date_from);
    }
    if (filters?.date_to) {
      query = query.lte('created_at', filters.date_to);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching audit trails:', error);
      return [];
    }

    return (data || []) as AuditTrail[];
  };

  const logUserActivity = async (
    activityType: string,
    activityDescription?: string,
    metadata?: any
  ): Promise<boolean> => {
    if (!profile?.id) return false;
    
    try {
      // Get or create active session
      const sessionToken = localStorage.getItem('audit_session_token') || 
        `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      localStorage.setItem('audit_session_token', sessionToken);

      // Check if session exists
      let { data: session } = await supabase
        .from('user_activity_sessions')
        .select('id')
        .eq('session_token', sessionToken)
        .eq('is_active', true)
        .single();

      if (!session) {
        // Create new session
        const { data: newSession } = await supabase
          .from('user_activity_sessions')
          .insert({
            user_id: profile.id,
            session_token: sessionToken,
            tenant_id: profile.tenant_id,
            ip_address: '127.0.0.1', // In real app, get from request
            user_agent: navigator.userAgent
          })
          .select('id')
          .single();
        
        session = newSession;
      }

      if (session) {
        // Log activity
        await supabase
          .from('user_activity_logs')
          .insert({
            session_id: session.id,
            user_id: profile.id,
            tenant_id: profile.tenant_id,
            activity_type: activityType,
            activity_description: activityDescription,
            page_url: window.location.href,
            metadata: metadata || {}
          });

        // Update last activity
        await supabase
          .from('user_activity_sessions')
          .update({ last_activity: new Date().toISOString() })
          .eq('id', session.id);
      }

      return true;
    } catch (error) {
      console.error('Error logging user activity:', error);
      return false;
    }
  };

  // User Activity Sessions
  const fetchUserActivitySessions = async (
    filters?: {
      user_id?: string;
      is_active?: boolean;
      date_from?: string;
      date_to?: string;
    }
  ): Promise<UserActivitySession[]> => {
    if (!profile?.tenant_id) return [];
    
    let query = supabase
      .from('user_activity_sessions')
      .select(`
        *,
        profiles (first_name, last_name, email)
      `)
      .eq('tenant_id', profile.tenant_id)
      .order('login_time', { ascending: false })
      .limit(50);

    if (filters?.user_id) {
      query = query.eq('user_id', filters.user_id);
    }
    if (filters?.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active);
    }
    if (filters?.date_from) {
      query = query.gte('login_time', filters.date_from);
    }
    if (filters?.date_to) {
      query = query.lte('login_time', filters.date_to);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching user activity sessions:', error);
      return [];
    }

    return (data || []) as UserActivitySession[];
  };

  // Compliance Rules
  const fetchComplianceRules = async (): Promise<ComplianceRule[]> => {
    if (!profile?.tenant_id) return [];
    
    const { data, error } = await supabase
      .from('compliance_rules')
      .select('*')
      .eq('tenant_id', profile.tenant_id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching compliance rules:', error);
      return [];
    }

    return (data || []) as ComplianceRule[];
  };

  const createComplianceRule = async (
    ruleName: string,
    ruleDescription: string,
    ruleType: ComplianceRule['rule_type'],
    ruleConfig: any,
    severity: ComplianceRule['severity']
  ): Promise<ComplianceRule | null> => {
    if (!profile?.tenant_id) return null;
    
    setLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('compliance_rules')
        .insert({
          tenant_id: profile.tenant_id,
          rule_name: ruleName,
          rule_description: ruleDescription,
          rule_type: ruleType,
          rule_config: ruleConfig,
          severity,
          created_by: profile.id
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Compliance rule created successfully",
      });

      return data as ComplianceRule;
    } catch (error) {
      console.error('Error creating compliance rule:', error);
      toast({
        title: "Error",
        description: "Failed to create compliance rule",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Compliance Violations
  const fetchComplianceViolations = async (
    filters?: {
      status?: string;
      severity?: string;
      rule_type?: string;
    }
  ): Promise<ComplianceViolation[]> => {
    if (!profile?.tenant_id) return [];
    
    let query = supabase
      .from('compliance_violations')
      .select(`
        *,
        compliance_rules (rule_name, rule_type, severity)
      `)
      .eq('tenant_id', profile.tenant_id)
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.severity) {
      query = query.eq('severity', filters.severity);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching compliance violations:', error);
      return [];
    }

    return (data || []) as ComplianceViolation[];
  };

  const resolveComplianceViolation = async (
    violationId: string,
    resolutionNotes: string
  ): Promise<boolean> => {
    if (!profile?.id) return false;
    
    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('compliance_violations')
        .update({
          status: 'resolved',
          resolution_notes: resolutionNotes,
          resolved_by: profile.id,
          resolved_at: new Date().toISOString()
        })
        .eq('id', violationId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Compliance violation resolved",
      });

      return true;
    } catch (error) {
      console.error('Error resolving compliance violation:', error);
      toast({
        title: "Error",
        description: "Failed to resolve violation",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Data Backups
  const fetchDataBackups = async (): Promise<DataBackup[]> => {
    if (!profile?.tenant_id) return [];
    
    const { data, error } = await supabase
      .from('data_backups')
      .select('*')
      .eq('tenant_id', profile.tenant_id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching data backups:', error);
      return [];
    }

    return (data || []) as DataBackup[];
  };

  const createDataBackup = async (
    backupName: string,
    backupType: DataBackup['backup_type'],
    backupScope: DataBackup['backup_scope'],
    backupConfig?: any
  ): Promise<DataBackup | null> => {
    if (!profile?.tenant_id) return null;
    
    setLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('data_backups')
        .insert({
          tenant_id: profile.tenant_id,
          backup_name: backupName,
          backup_type: backupType,
          backup_scope: backupScope,
          backup_config: backupConfig || {},
          created_by: profile.id
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Backup initiated successfully",
      });

      return data as DataBackup;
    } catch (error) {
      console.error('Error creating data backup:', error);
      toast({
        title: "Error",
        description: "Failed to initiate backup",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  // System Health Metrics
  const fetchSystemHealthMetrics = async (): Promise<SystemHealthMetric[]> => {
    const { data, error } = await supabase
      .from('system_health_metrics')
      .select('*')
      .order('recorded_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching system health metrics:', error);
      return [];
    }

    return (data || []) as SystemHealthMetric[];
  };

  // Compliance Reports
  const fetchComplianceReports = async (): Promise<ComplianceReport[]> => {
    if (!profile?.tenant_id) return [];
    
    const { data, error } = await supabase
      .from('compliance_reports')
      .select('*')
      .eq('tenant_id', profile.tenant_id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching compliance reports:', error);
      return [];
    }

    return (data || []) as ComplianceReport[];
  };

  const generateComplianceReport = async (
    reportName: string,
    reportType: ComplianceReport['report_type'],
    periodStart: string,
    periodEnd: string
  ): Promise<ComplianceReport | null> => {
    if (!profile?.tenant_id) return null;
    
    setLoading(true);
    
    try {
      // Generate report data based on type
      let reportData = {};
      
      if (reportType === 'audit_summary') {
        const auditTrails = await fetchAuditTrails({
          date_from: periodStart,
          date_to: periodEnd
        });
        
        reportData = {
          total_actions: auditTrails.length,
          actions_by_type: auditTrails.reduce((acc, trail) => {
            acc[trail.action] = (acc[trail.action] || 0) + 1;
            return acc;
          }, {} as Record<string, number>),
          risk_levels: auditTrails.reduce((acc, trail) => {
            acc[trail.risk_level] = (acc[trail.risk_level] || 0) + 1;
            return acc;
          }, {} as Record<string, number>)
        };
      }

      const { data, error } = await supabase
        .from('compliance_reports')
        .insert({
          tenant_id: profile.tenant_id,
          report_name: reportName,
          report_type: reportType,
          report_period_start: periodStart,
          report_period_end: periodEnd,
          report_data: reportData,
          report_status: 'completed',
          generated_by: profile.id,
          generated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Compliance report generated successfully",
      });

      return data as ComplianceReport;
    } catch (error) {
      console.error('Error generating compliance report:', error);
      toast({
        title: "Error",
        description: "Failed to generate report",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    fetchAuditTrails,
    logUserActivity,
    fetchUserActivitySessions,
    fetchComplianceRules,
    createComplianceRule,
    fetchComplianceViolations,
    resolveComplianceViolation,
    fetchDataBackups,
    createDataBackup,
    fetchSystemHealthMetrics,
    fetchComplianceReports,
    generateComplianceReport
  };
};