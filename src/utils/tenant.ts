import { supabase } from '@/integrations/supabase/client';

export interface TenantInfo {
  id: string;
  name: string;
  slug: string;
  subdomain: string;
  domain?: string | null;
  status: 'active' | 'suspended' | 'cancelled';
}

/**
 * Extract subdomain from hostname
 * For *.loanspurcbs.com, extracts the subdomain part
 */
export function getSubdomainFromHostname(hostname: string): string | null {
  // Remove port if present
  const cleanHostname = hostname.split(':')[0];
  
  // Check if it's the main domain or localhost
  if (cleanHostname === 'loanspurcbs.com' || 
      cleanHostname === 'localhost' || 
      cleanHostname.includes('127.0.0.1') ||
      cleanHostname.includes('lovableproject.com')) {
    return null;
  }
  
  // Extract subdomain from *.loanspurcbs.com
  if (cleanHostname.endsWith('.loanspurcbs.com')) {
    const subdomain = cleanHostname.replace('.loanspurcbs.com', '');
    return subdomain === 'www' ? null : subdomain;
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
    const { data, error } = await supabase
      .from('tenants')
      .select('id, name, slug, subdomain, domain, status')
      .eq('subdomain', subdomain)
      .eq('status', 'active')
      .single();

    if (error || !data) {
      console.error('Error fetching tenant:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error fetching tenant by subdomain:', error);
    return null;
  }
}

/**
 * Build subdomain URL
 */
export function buildSubdomainUrl(subdomain: string, path: string = ''): string {
  const baseUrl = 'https://' + (subdomain ? `${subdomain}.` : '') + 'loanspurcbs.com';
  return baseUrl + (path.startsWith('/') ? path : '/' + path);
}