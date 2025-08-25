import { supabase } from '@/integrations/supabase/client';

export interface TenantInfo {
  id: string;
  name: string;
  slug: string;
  subdomain: string | null;
  domain?: string | null;
  logo_url?: string | null;
  status: 'active' | 'suspended' | 'cancelled';
}

/**
 * Extract subdomain from hostname
 * Supports *.loanspurcbs.com (production) and *.loanspur.online (development)
 */
export function getBaseDomain(hostname?: string): string {
  const h = (hostname || (typeof window !== 'undefined' ? window.location.hostname : '')).split(':')[0];
  // If we're on the dev domain, return it; otherwise default to production
  if (h && (h === 'loanspur.online' || h.endsWith('.loanspur.online'))) return 'loanspur.online';
  return 'loanspurcbs.com';
}

export function getSubdomainFromHostname(hostname: string): string | null {
  // Remove port if present
  const cleanHostname = hostname.split(':')[0];
  
  if (import.meta.env['VITE_IS_DEVELOPMENT'] === 'true') {
    console.log('Subdomain detection - hostname:', hostname, 'cleanHostname:', cleanHostname);
  }
  
  // Check if it's a main domain or localhost
  if (cleanHostname && (cleanHostname === 'loanspurcbs.com' || 
      cleanHostname === 'loanspur.online' ||
      cleanHostname === 'localhost' || 
      cleanHostname.includes('127.0.0.1') ||
      cleanHostname.includes('lovableproject.com'))) {
    if (import.meta.env['VITE_IS_DEVELOPMENT'] === 'true') {
      console.log('Detected as main domain/localhost, returning null');
    }
    return null;
  }
  
  // Extract subdomain from known base domains
  if (cleanHostname && cleanHostname.endsWith('.loanspurcbs.com')) {
    const subdomain = cleanHostname.replace('.loanspurcbs.com', '');
    if (import.meta.env['VITE_IS_DEVELOPMENT'] === 'true') {
      console.log('Extracted subdomain (prod):', subdomain);
    }
    return subdomain === 'www' ? null : subdomain;
  }
  if (cleanHostname && cleanHostname.endsWith('.loanspur.online')) {
    const subdomain = cleanHostname.replace('.loanspur.online', '');
    if (import.meta.env['VITE_IS_DEVELOPMENT'] === 'true') {
      console.log('Extracted subdomain (dev):', subdomain);
    }
    return subdomain === 'www' ? null : subdomain;
  }
  
  if (import.meta.env['VITE_IS_DEVELOPMENT'] === 'true') {
    console.log('No subdomain pattern matched, returning null');
  }
  return null;
}

/**
 * Get current subdomain from window location
 */
export function getCurrentSubdomain(): string | null {
  if (typeof window === 'undefined') return null;
  return getSubdomainFromHostname(window.location.hostname);
}

/**
 * Fetch tenant information by subdomain
 */
export async function getTenantBySubdomain(subdomain: string): Promise<TenantInfo | null> {
  try {
    console.log('🔍 Querying tenant with subdomain:', subdomain);
    
    const { data, error } = await supabase
      .from('tenants')
      .select('id, name, slug, subdomain, domain, logo_url, status')
      .eq('subdomain', subdomain)
      .eq('status', 'active')
      .limit(1)
      .maybeSingle();

    console.log('🔍 Database query result:', { data, error });
    console.log('🔍 Error details:', error);
    console.log('🔍 Data details:', data);

    if (error) {
      console.error('❌ Database error fetching tenant:', error);
      return null;
    }

    if (!data) {
      console.log('❌ No tenant found for subdomain:', subdomain);
      return null;
    }

    console.log('✅ Found tenant:', data);
    return data;
  } catch (error) {
    console.error('❌ Exception in getTenantBySubdomain:', error);
    return null;
  }
}

/**
 * Build subdomain URL
 */
export function buildSubdomainUrl(subdomain: string, path: string = '', baseDomain?: string): string {
  const domain = baseDomain || getBaseDomain();
  const baseUrl = 'https://' + (subdomain ? `${subdomain}.` : '') + domain;
  return baseUrl + (path.startsWith('/') ? path : '/' + path);
}