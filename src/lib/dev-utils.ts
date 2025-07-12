// Development utilities for sample data and dev tools

export const isDevelopment = () => {
  return import.meta.env.DEV || import.meta.env.MODE === 'development';
};

// Sample data generators
export const generateSampleClientData = () => {
  const firstNames = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'James', 'Lisa', 'Robert', 'Anna'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
  const occupations = ['Teacher', 'Engineer', 'Doctor', 'Farmer', 'Merchant', 'Driver', 'Chef', 'Mechanic', 'Nurse', 'Student'];
  
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  
  return {
    client_number: `CLI${String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0')}`,
    first_name: firstName,
    last_name: lastName,
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
    phone: `+254${Math.floor(Math.random() * 900000000) + 100000000}`,
    national_id: String(Math.floor(Math.random() * 90000000) + 10000000),
    gender: Math.random() > 0.5 ? 'male' : 'female',
    occupation: occupations[Math.floor(Math.random() * occupations.length)],
    monthly_income: String(Math.floor(Math.random() * 50000) + 10000),
  };
};

export const generateSampleLoanApplicationData = () => {
  const purposes = [
    'Business expansion - purchasing additional inventory for retail shop',
    'Agricultural development - buying seeds and fertilizers for next season',
    'Equipment purchase - acquiring new machinery for workshop',
    'Working capital - managing cash flow during slow season',
    'Home improvement - renovating and expanding living space',
    'Education - paying school fees for children',
    'Medical expenses - covering treatment and medication costs',
    'Livestock purchase - buying cattle for dairy farming',
    'Vehicle purchase - acquiring transport for business',
    'Stock financing - purchasing goods for resale'
  ];
  
  const collaterals = [
    'Land title deed - 0.5 acres residential plot',
    'Vehicle logbook - Toyota Probox 2015 model',
    'Business equipment - bakery ovens and mixers',
    'Livestock - 5 dairy cows',
    'Household items - furniture and electronics',
    'Agricultural produce - 10 bags of maize',
    'Motorbike - Bajaj Boxer 2020 model',
    'Shop inventory - electronics and accessories',
    'Savings certificate - fixed deposit account',
    'Jewelry - gold ornaments and watches'
  ];
  
  return {
    requested_amount: Math.floor(Math.random() * 95000) + 5000, // 5K to 100K
    requested_term: [6, 12, 18, 24, 36][Math.floor(Math.random() * 5)],
    purpose: purposes[Math.floor(Math.random() * purposes.length)],
    collateral_description: Math.random() > 0.3 ? collaterals[Math.floor(Math.random() * collaterals.length)] : '',
  };
};

export const generateSampleLoanProductData = () => {
  const productNames = [
    'Small Business Loan',
    'Agricultural Loan',
    'Emergency Loan',
    'Education Loan',
    'Asset Finance',
    'Group Loan',
    'Micro Enterprise Loan',
    'Seasonal Loan',
    'Equipment Loan',
    'Working Capital Loan'
  ];
  
  const descriptions = [
    'Designed for small business owners to expand operations',
    'Supporting farmers with seasonal agricultural needs',
    'Quick access to funds for urgent requirements',
    'Financing education and training expenses',
    'Acquisition of business assets and equipment',
    'Collective lending for community groups',
    'Supporting micro and small enterprises',
    'Short-term loans for seasonal business needs',
    'Purchase of machinery and equipment',
    'Managing day-to-day business operations'
  ];
  
  const minPrincipal = Math.floor(Math.random() * 10000) + 1000;
  const maxPrincipal = minPrincipal + Math.floor(Math.random() * 90000) + 10000;
  const defaultPrincipal = Math.floor((minPrincipal + maxPrincipal) / 2);
  
  const minRate = Math.floor(Math.random() * 10) + 5; // 5-15%
  const maxRate = minRate + Math.floor(Math.random() * 10) + 5; // +5-15%
  const defaultRate = Math.floor((minRate + maxRate) / 2);
  
  const productName = productNames[Math.floor(Math.random() * productNames.length)];
  
  return {
    name: productName,
    short_name: productName.split(' ').map(word => word[0]).join('').toUpperCase(),
    description: descriptions[Math.floor(Math.random() * descriptions.length)],
    min_principal: minPrincipal,
    max_principal: maxPrincipal,
    default_principal: defaultPrincipal,
    min_nominal_interest_rate: minRate,
    max_nominal_interest_rate: maxRate,
    default_nominal_interest_rate: defaultRate,
    min_term: 3,
    max_term: 60,
    default_term: 12,
  };
};

export const generateSampleSavingsProductData = () => {
  const productNames = [
    'Basic Savings',
    'Premium Savings',
    'Youth Savings',
    'Business Savings',
    'Fixed Deposit',
    'Education Savings',
    'Emergency Fund',
    'Group Savings',
    'Retirement Savings',
    'Goal Savings'
  ];
  
  const descriptions = [
    'Standard savings account for all customers',
    'High-yield savings with premium benefits',
    'Specially designed for young savers',
    'Business savings with transaction flexibility',
    'Fixed-term deposits with guaranteed returns',
    'Education-focused savings with incentives',
    'Emergency fund with instant access',
    'Collective savings for groups',
    'Long-term retirement planning',
    'Target-based savings for specific goals'
  ];
  
  const productName = productNames[Math.floor(Math.random() * productNames.length)];
  
  return {
    name: productName,
    short_name: productName.split(' ').map(word => word[0]).join('').toUpperCase(),
    description: descriptions[Math.floor(Math.random() * descriptions.length)],
    minimum_opening_balance: Math.floor(Math.random() * 5000) + 500,
    minimum_balance: Math.floor(Math.random() * 1000) + 100,
    interest_rate: (Math.random() * 8 + 2).toFixed(2), // 2-10%
    interest_posting_frequency: ['monthly', 'quarterly', 'annually'][Math.floor(Math.random() * 3)],
  };
};

export const generateSampleLoanData = () => {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 7); // 7 days from now
  
  const firstRepaymentDate = new Date();
  firstRepaymentDate.setMonth(firstRepaymentDate.getMonth() + 1); // 1 month from now

  return {
    requested_amount: "150000",
    loan_purpose: "business_expansion",
    fund_id: "general",
    expected_disbursement_date: futureDate,
    savings_linkage: false,
    linked_savings_account: "",
    loan_term: "12",
    number_of_repayments: "12",
    first_repayment_date: firstRepaymentDate,
    interest_rate: "15.5",
    loan_charges: [
      { charge_type: "processing_fee", amount: "2500" },
      { charge_type: "insurance", amount: "1200" }
    ],
    collateral_items: [
      {
        type: "property",
        description: "Commercial shop in city center",
        value: "500000"
      }
    ],
    required_documents: ["id_copy", "business_permit", "bank_statements", "guarantor_forms"]
  };
};

export const generateSampleTenantData = () => {
  const organizationNames = [
    'Sunrise Microfinance',
    'Unity Savings & Credit',
    'Progress Financial Services',
    'Community Development Bank',
    'Hope Microfinance',
    'Trust Financial Co-op',
    'Farmers Credit Union',
    'Women Empowerment Finance',
    'Youth Development Fund',
    'Rural Development Bank'
  ];
  
  const orgName = organizationNames[Math.floor(Math.random() * organizationNames.length)];
  
  return {
    name: orgName,
    slug: orgName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-'),
    description: `${orgName} is committed to providing accessible financial services to underserved communities`,
    contact_email: `info@${orgName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
    contact_phone: `+254${Math.floor(Math.random() * 900000000) + 100000000}`,
    country: 'Kenya',
    timezone: 'Africa/Nairobi',
    address: {
      street: `${Math.floor(Math.random() * 999) + 1} ${['Main', 'Central', 'Market', 'Bank', 'Commercial'][Math.floor(Math.random() * 5)]} Street`,
      city: ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret'][Math.floor(Math.random() * 5)],
      postal_code: String(Math.floor(Math.random() * 90000) + 10000),
    },
  };
};

export const generateSampleUserData = () => {
  const firstNames = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'James', 'Lisa', 'Robert', 'Anna'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
  const roles = ['tenant_admin', 'loan_officer', 'accountant', 'manager'];
  
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  
  return {
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
    first_name: firstName,
    last_name: lastName,
    role: roles[Math.floor(Math.random() * roles.length)],
    phone: `+254${Math.floor(Math.random() * 900000000) + 100000000}`,
  };
};

// Seed data creation functions
export const seedDatabase = async () => {
  if (!isDevelopment()) {
    console.warn('Seed database is only available in development mode');
    return;
  }
  
  try {
    // Call the Supabase Edge Function
    const response = await fetch('https://woqesvsopdgoikpatzxp.supabase.co/functions/v1/seed-database', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvcWVzdnNvcGRnb2lrcGF0enhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1MjQ0NDMsImV4cCI6MjA2NzEwMDQ0M30.rIFhs-PZ24UZBOzE4nx1Ev8Pyp__7rMt5N-7kWNUeDI`,
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to seed database');
    }
    
    const result = await response.json();
    console.log('Database seeded successfully:', result);
    return result;
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
};