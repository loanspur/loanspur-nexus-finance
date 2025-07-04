import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { read, utils } from 'https://esm.sh/xlsx@0.18.5'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ClientRecord {
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  national_id?: string;
  date_of_birth?: string;
  gender?: string;
  occupation?: string;
  monthly_income?: number;
  address?: any;
  client_number?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Starting client data import process...')

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get the current user and tenant
    const authHeader = req.headers.get('Authorization')!
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (authError || !user) {
      console.error('Authentication error:', authError)
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Get user profile to get tenant_id
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile?.tenant_id) {
      console.error('Profile error:', profileError)
      return new Response(
        JSON.stringify({ error: 'No tenant found for user' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Parse form data to get the uploaded file
    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) {
      return new Response(
        JSON.stringify({ error: 'No file uploaded' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('Processing file:', file.name, 'Size:', file.size)

    // Read the Excel file
    const buffer = await file.arrayBuffer()
    const workbook = read(new Uint8Array(buffer), { type: 'array' })
    const worksheet = workbook.Sheets[workbook.SheetNames[0]]
    const rawData = utils.sheet_to_json(worksheet)

    console.log('Parsed', rawData.length, 'rows from Excel file')

    // Validate and transform data
    const clientRecords: ClientRecord[] = []
    const errors: string[] = []

    for (let i = 0; i < rawData.length; i++) {
      const row = rawData[i] as any
      const rowNumber = i + 2 // Excel row number (accounting for header)

      try {
        // Validate required fields
        if (!row.first_name || !row.last_name) {
          errors.push(`Row ${rowNumber}: First name and last name are required`)
          continue
        }

        // Generate client number if not provided
        const client_number = row.client_number || `CL${Date.now()}${Math.floor(Math.random() * 1000)}`

        const clientRecord: ClientRecord = {
          client_number,
          first_name: String(row.first_name).trim(),
          last_name: String(row.last_name).trim(),
          email: row.email ? String(row.email).trim() : null,
          phone: row.phone ? String(row.phone).trim() : null,
          national_id: row.national_id ? String(row.national_id).trim() : null,
          date_of_birth: row.date_of_birth ? new Date(row.date_of_birth).toISOString().split('T')[0] : null,
          gender: row.gender ? String(row.gender).toLowerCase() : null,
          occupation: row.occupation ? String(row.occupation).trim() : null,
          monthly_income: row.monthly_income ? parseFloat(row.monthly_income) : null,
          address: row.address ? { full_address: String(row.address).trim() } : null,
        }

        clientRecords.push(clientRecord)
      } catch (error) {
        console.error(`Error processing row ${rowNumber}:`, error)
        errors.push(`Row ${rowNumber}: ${error.message}`)
      }
    }

    if (errors.length > 0 && clientRecords.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: 'No valid records found', 
          details: errors 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Insert valid records into database
    const recordsToInsert = clientRecords.map(record => ({
      ...record,
      tenant_id: profile.tenant_id,
      is_active: true,
      approval_status: 'pending',
      kyc_status: 'pending'
    }))

    console.log('Inserting', recordsToInsert.length, 'client records')

    const { data: insertedClients, error: insertError } = await supabase
      .from('clients')
      .insert(recordsToInsert)
      .select()

    if (insertError) {
      console.error('Insert error:', insertError)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to insert client records', 
          details: insertError.message 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('Successfully imported', insertedClients?.length || 0, 'clients')

    return new Response(
      JSON.stringify({
        success: true,
        imported: insertedClients?.length || 0,
        errors: errors.length > 0 ? errors : undefined,
        message: `Successfully imported ${insertedClients?.length || 0} clients${errors.length > 0 ? ` with ${errors.length} errors` : ''}`
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})