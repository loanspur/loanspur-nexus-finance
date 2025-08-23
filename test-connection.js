// Test script to verify Supabase connection and super admin user
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://woqesvsopdgoikpatzxp.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvcWVzdnNvcGRnb2lrcGF0enhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1MjQ0NDMsImV4cCI6MjA2NzEwMDQ0M30.rIFhs-PZ24UZBOzE4nx1Ev8Pyp__7rMt5N-7kWNUeDI";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testConnection() {
  console.log('Testing Supabase connection...');
  
  try {
    // Test basic connection
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    
    if (error) {
      console.error('❌ Database connection failed:', error);
      return;
    }
    
    console.log('✅ Database connection successful');
    
    // Check super admin user
    const { data: superAdmin, error: superAdminError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', 'justmurenga@gmail.com')
      .eq('role', 'super_admin')
      .single();
    
    if (superAdminError) {
      console.error('❌ Error fetching super admin:', superAdminError);
    } else if (superAdmin) {
      console.log('✅ Super admin user found:', {
        id: superAdmin.id,
        email: superAdmin.email,
        role: superAdmin.role,
        is_active: superAdmin.is_active,
        tenant_id: superAdmin.tenant_id
      });
    } else {
      console.log('❌ Super admin user not found');
    }
    
    // Check password reset tokens table
    const { data: resetTokens, error: resetError } = await supabase
      .from('password_reset_tokens')
      .select('count')
      .limit(1);
    
    if (resetError) {
      console.error('❌ Password reset tokens table error:', resetError);
    } else {
      console.log('✅ Password reset tokens table accessible');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testConnection();
