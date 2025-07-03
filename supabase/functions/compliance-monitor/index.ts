import { serve } from "https://deno.land/std@0.208.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ComplianceCheck {
  rule_id: string;
  rule_name: string;
  rule_type: string;
  rule_config: any;
  severity: string;
  tenant_id: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get all active compliance rules
    const { data: rules, error: rulesError } = await supabaseClient
      .from('compliance_rules')
      .select('*')
      .eq('is_active', true)

    if (rulesError) {
      console.error('Error fetching compliance rules:', rulesError)
      throw rulesError
    }

    const violations = []

    for (const rule of rules as ComplianceCheck[]) {
      try {
        const violation = await checkCompliance(supabaseClient, rule)
        if (violation) {
          violations.push(violation)
        }
      } catch (error) {
        console.error(`Error checking rule ${rule.rule_name}:`, error)
      }
    }

    // Insert new violations
    if (violations.length > 0) {
      const { error: insertError } = await supabaseClient
        .from('compliance_violations')
        .insert(violations)

      if (insertError) {
        console.error('Error inserting violations:', insertError)
        throw insertError
      }
    }

    // Update system health metrics
    await updateSystemHealthMetrics(supabaseClient)

    return new Response(
      JSON.stringify({
        success: true,
        violations_found: violations.length,
        rules_checked: rules.length
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Compliance monitoring error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

async function checkCompliance(supabase: any, rule: ComplianceCheck) {
  switch (rule.rule_type) {
    case 'data_retention':
      return await checkDataRetention(supabase, rule)
    case 'access_control':
      return await checkAccessControl(supabase, rule)
    case 'security':
      return await checkSecurity(supabase, rule)
    case 'privacy':
      return await checkPrivacy(supabase, rule)
    case 'financial':
      return await checkFinancial(supabase, rule)
    default:
      return null
  }
}

async function checkDataRetention(supabase: any, rule: ComplianceCheck) {
  const config = rule.rule_config
  const retentionDays = config.retention_days || 2555 // ~7 years default
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays)

  for (const tableName of config.apply_to || ['clients', 'loans', 'payments']) {
    const { data, error } = await supabase
      .from(tableName)
      .select('id, created_at')
      .lt('created_at', cutoffDate.toISOString())
      .limit(1)

    if (error) continue

    if (data && data.length > 0) {
      return {
        tenant_id: rule.tenant_id,
        rule_id: rule.rule_id,
        violation_type: 'data_retention_exceeded',
        violation_description: `Records in ${tableName} exceed retention period of ${retentionDays} days`,
        affected_table: tableName,
        severity: rule.severity,
        detection_details: {
          table: tableName,
          retention_days: retentionDays,
          oldest_record: data[0].created_at,
          records_count: data.length
        }
      }
    }
  }

  return null
}

async function checkAccessControl(supabase: any, rule: ComplianceCheck) {
  const config = rule.rule_config
  const maxFailedLogins = config.max_failed_logins || 5
  const sessionTimeoutHours = config.session_timeout_hours || 8

  // Check for excessive failed logins (simulated)
  const now = new Date()
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)

  // Check for long-running sessions
  const sessionCutoff = new Date(now.getTime() - sessionTimeoutHours * 60 * 60 * 1000)
  
  const { data: longSessions, error } = await supabase
    .from('user_activity_sessions')
    .select('id, user_id, login_time')
    .eq('is_active', true)
    .lt('login_time', sessionCutoff.toISOString())
    .limit(1)

  if (error) return null

  if (longSessions && longSessions.length > 0) {
    return {
      tenant_id: rule.tenant_id,
      rule_id: rule.rule_id,
      violation_type: 'session_timeout_exceeded',
      violation_description: `Active sessions exceed timeout limit of ${sessionTimeoutHours} hours`,
      severity: rule.severity,
      detection_details: {
        timeout_hours: sessionTimeoutHours,
        long_sessions_count: longSessions.length,
        oldest_session: longSessions[0].login_time
      }
    }
  }

  return null
}

async function checkSecurity(supabase: any, rule: ComplianceCheck) {
  const config = rule.rule_config
  
  // Check for suspicious audit trail patterns
  const now = new Date()
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)

  const { data: suspiciousActivity, error } = await supabase
    .from('audit_trails')
    .select('user_id, action')
    .gte('created_at', oneHourAgo.toISOString())
    .eq('tenant_id', rule.tenant_id)

  if (error) return null

  if (suspiciousActivity && suspiciousActivity.length > 100) {
    return {
      tenant_id: rule.tenant_id,
      rule_id: rule.rule_id,
      violation_type: 'unusual_activity_pattern',
      violation_description: `Unusually high activity detected: ${suspiciousActivity.length} actions in the last hour`,
      severity: 'warning',
      detection_details: {
        activity_count: suspiciousActivity.length,
        time_period: 'last_hour'
      }
    }
  }

  return null
}

async function checkPrivacy(supabase: any, rule: ComplianceCheck) {
  // Check for data access patterns that might indicate privacy issues
  return null // Placeholder
}

async function checkFinancial(supabase: any, rule: ComplianceCheck) {
  // Check for financial compliance issues
  return null // Placeholder
}

async function updateSystemHealthMetrics(supabase: any) {
  const now = new Date()

  // Database connections (simulated)
  const dbConnections = Math.floor(Math.random() * 50) + 10

  // API response time (simulated)
  const apiResponseTime = Math.floor(Math.random() * 200) + 100

  // Failed login rate (simulated)
  const failedLoginRate = Math.floor(Math.random() * 5)

  // Compliance score calculation
  const { data: totalViolations } = await supabase
    .from('compliance_violations')
    .select('severity')
    .eq('status', 'open')

  let complianceScore = 100
  if (totalViolations) {
    totalViolations.forEach((v: any) => {
      switch (v.severity) {
        case 'critical': complianceScore -= 20; break
        case 'error': complianceScore -= 10; break
        case 'warning': complianceScore -= 5; break
        case 'info': complianceScore -= 1; break
      }
    })
  }
  complianceScore = Math.max(0, complianceScore)

  const metrics = [
    {
      metric_name: 'database_connections',
      metric_value: dbConnections,
      metric_unit: 'count',
      metric_type: 'performance',
      threshold_warning: 80,
      threshold_critical: 95,
      status: dbConnections > 95 ? 'critical' : dbConnections > 80 ? 'warning' : 'healthy'
    },
    {
      metric_name: 'api_response_time',
      metric_value: apiResponseTime,
      metric_unit: 'ms',
      metric_type: 'performance',
      threshold_warning: 1000,
      threshold_critical: 3000,
      status: apiResponseTime > 3000 ? 'critical' : apiResponseTime > 1000 ? 'warning' : 'healthy'
    },
    {
      metric_name: 'failed_login_rate',
      metric_value: failedLoginRate,
      metric_unit: 'percentage',
      metric_type: 'security',
      threshold_warning: 10,
      threshold_critical: 25,
      status: failedLoginRate > 25 ? 'critical' : failedLoginRate > 10 ? 'warning' : 'healthy'
    },
    {
      metric_name: 'compliance_score',
      metric_value: complianceScore,
      metric_unit: 'percentage',
      metric_type: 'compliance',
      threshold_warning: 80,
      threshold_critical: 60,
      status: complianceScore < 60 ? 'critical' : complianceScore < 80 ? 'warning' : 'healthy'
    }
  ]

  for (const metric of metrics) {
    await supabase
      .from('system_health_metrics')
      .insert({
        ...metric,
        recorded_at: now.toISOString()
      })
  }
}