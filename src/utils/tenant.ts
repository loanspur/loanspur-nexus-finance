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
  
  console.log('Subdomain detection - hostname:', hostname, 'cleanHostname:', cleanHostname);
  
  // Check if it's the main domain or localhost
  if (cleanHostname === 'loanspurcbs.com' || 
      cleanHostname === 'localhost' || 
      cleanHostname.includes('127.0.0.1') ||
      cleanHostname.includes('lovableproject.com')) {
    console.log('Detected as main domain/localhost, returning null');
    return null;
  }
  
  // Extract subdomain from *.loanspurcbs.com
  if (cleanHostname.endsWith('.loanspurcbs.com')) {
    const subdomain = cleanHostname.replace('.loanspurcbs.com', '');
    console.log('Extracted subdomain:', subdomain);
    return subdomain === 'www' ? null : subdomain;
  }
  
  console.log('No subdomain pattern matched, returning null');
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
      .select('id, name, slug, subdomain, domain, status')
      .eq('subdomain', subdomain)
      .eq('status', 'active')
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
export function buildSubdomainUrl(subdomain: string, path: string = ''): string {
  const baseUrl = 'https://' + (subdomain ? `${subdomain}.` : '') + 'loanspurcbs.com';
  return baseUrl + (path.startsWith('/') ? path : '/' + path);
}