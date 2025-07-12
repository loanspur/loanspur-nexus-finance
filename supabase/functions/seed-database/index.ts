import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Database {
  public: {
    Tables: {
      tenants: any;
      profiles: any;
      clients: any;
      loan_products: any;
      savings_products: any;
      loans: any;
      savings_accounts: any;
    };
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient<Database>(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Sample data generators
    const generateSampleTenants = (count: number) => {
      const organizations = [
        'Sunrise Microfinance', 'Unity Savings & Credit', 'Progress Financial Services',
        'Community Development Bank', 'Hope Microfinance', 'Trust Financial Co-op',
        'Farmers Credit Union', 'Women Empowerment Finance', 'Youth Development Fund'
      ];
      
      return Array.from({ length: count }, (_, i) => {
        const orgName = organizations[i % organizations.length];
        return {
          name: `${orgName} ${i + 1}`,
          slug: `${orgName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${i + 1}`,
          description: `${orgName} is committed to providing accessible financial services`,
          contact_email: `info@${orgName.toLowerCase().replace(/[^a-z0-9]/g, '')}${i + 1}.com`,
          contact_phone: `+254${Math.floor(Math.random() * 900000000) + 100000000}`,
          country: 'Kenya',
          timezone: 'Africa/Nairobi',
          address: {
            street: `${Math.floor(Math.random() * 999) + 1} Main Street`,
            city: ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru'][Math.floor(Math.random() * 4)],
            postal_code: String(Math.floor(Math.random() * 90000) + 10000),
          },
        };
      });
    };

    const generateSampleClients = (tenantId: string, count: number) => {
      const firstNames = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'James', 'Lisa'];
      const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller'];
      const occupations = ['Teacher', 'Engineer', 'Doctor', 'Farmer', 'Merchant', 'Driver'];
      
      return Array.from({ length: count }, (_, i) => {
        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
        
        return {
          tenant_id: tenantId,
          client_number: `CLI${String(i + 1).padStart(4, '0')}`,
          first_name: firstName,
          last_name: lastName,
          email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i + 1}@example.com`,
          phone: `+254${Math.floor(Math.random() * 900000000) + 100000000}`,
          national_id: String(Math.floor(Math.random() * 90000000) + 10000000),
          gender: Math.random() > 0.5 ? 'male' : 'female',
          occupation: occupations[Math.floor(Math.random() * occupations.length)],
          monthly_income: Math.floor(Math.random() * 50000) + 10000,
          date_of_birth: new Date(1970 + Math.floor(Math.random() * 40), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0],
          is_active: true,
        };
      });
    };

    const generateSampleLoanProducts = (tenantId: string, count: number) => {
      const productNames = [
        'Small Business Loan', 'Agricultural Loan', 'Emergency Loan',
        'Education Loan', 'Asset Finance', 'Group Loan'
      ];
      
      return Array.from({ length: count }, (_, i) => {
        const minPrincipal = Math.floor(Math.random() * 10000) + 1000;
        const maxPrincipal = minPrincipal + Math.floor(Math.random() * 90000) + 10000;
        const minRate = Math.floor(Math.random() * 5) + 5;
        const maxRate = minRate + Math.floor(Math.random() * 10) + 5;
        
        return {
          tenant_id: tenantId,
          name: productNames[i % productNames.length],
          short_name: productNames[i % productNames.length].split(' ').map(w => w[0]).join(''),
          description: `${productNames[i % productNames.length]} for various financial needs`,
          min_principal: minPrincipal,
          max_principal: maxPrincipal,
          default_principal: Math.floor((minPrincipal + maxPrincipal) / 2),
          min_nominal_interest_rate: minRate,
          max_nominal_interest_rate: maxRate,
          default_nominal_interest_rate: Math.floor((minRate + maxRate) / 2),
          min_term: 3,
          max_term: 60,
          default_term: 12,
          is_active: true,
        };
      });
    };

    const generateSampleSavingsProducts = (tenantId: string, count: number) => {
      const productNames = [
        'Basic Savings', 'Premium Savings', 'Youth Savings',
        'Business Savings', 'Fixed Deposit', 'Group Savings'
      ];
      
      return Array.from({ length: count }, (_, i) => {
        return {
          tenant_id: tenantId,
          name: productNames[i % productNames.length],
          short_name: productNames[i % productNames.length].split(' ').map(w => w[0]).join(''),
          description: `${productNames[i % productNames.length]} account with competitive rates`,
          minimum_opening_balance: Math.floor(Math.random() * 5000) + 500,
          minimum_balance: Math.floor(Math.random() * 1000) + 100,
          interest_rate: parseFloat((Math.random() * 8 + 2).toFixed(2)),
          interest_posting_frequency: ['monthly', 'quarterly', 'annually'][Math.floor(Math.random() * 3)],
          is_active: true,
        };
      });
    };

    // Insert sample data
    console.log('Starting database seeding...');

    // 1. Create sample tenants
    const tenants = generateSampleTenants(3);
    const { data: insertedTenants, error: tenantsError } = await supabaseClient
      .from('tenants')
      .insert(tenants)
      .select();

    if (tenantsError) {
      console.error('Error inserting tenants:', tenantsError);
      throw tenantsError;
    }

    console.log(`Created ${insertedTenants?.length} tenants`);

    // For each tenant, create related data
    const results = {
      tenants: insertedTenants?.length || 0,
      clients: 0,
      loanProducts: 0,
      savingsProducts: 0,
    };

    for (const tenant of insertedTenants || []) {
      // 2. Create clients for this tenant
      const clients = generateSampleClients(tenant.id, 15);
      const { data: insertedClients, error: clientsError } = await supabaseClient
        .from('clients')
        .insert(clients)
        .select();

      if (clientsError) {
        console.error('Error inserting clients:', clientsError);
        continue;
      }

      results.clients += insertedClients?.length || 0;

      // 3. Create loan products
      const loanProducts = generateSampleLoanProducts(tenant.id, 6);
      const { data: insertedLoanProducts, error: loanProductsError } = await supabaseClient
        .from('loan_products')
        .insert(loanProducts)
        .select();

      if (loanProductsError) {
        console.error('Error inserting loan products:', loanProductsError);
        continue;
      }

      results.loanProducts += insertedLoanProducts?.length || 0;

      // 4. Create savings products
      const savingsProducts = generateSampleSavingsProducts(tenant.id, 6);
      const { data: insertedSavingsProducts, error: savingsProductsError } = await supabaseClient
        .from('savings_products')
        .insert(savingsProducts)
        .select();

      if (savingsProductsError) {
        console.error('Error inserting savings products:', savingsProductsError);
        continue;
      }

      results.savingsProducts += insertedSavingsProducts?.length || 0;
    }

    console.log('Database seeding completed:', results);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Database seeded successfully',
        results,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error seeding database:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});