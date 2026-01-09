const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugInvitations() {
  try {
    console.log('Debugging Invitations table...');
    
    // 1. Check if Invitations table exists
    console.log('\n1. Checking Invitations table structure...');
    const { data: tableInfo, error: tableError } = await supabase
      .from('Invitations')
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.error('Error accessing Invitations table:', tableError);
      
      // Try to create the table if it doesn't exist
      console.log('\nAttempting to create Invitations table...');
      const { error: createError } = await supabase.rpc('create_invitations_table');
      if (createError) {
        console.error('Error creating table:', createError);
      } else {
        console.log('Invitations table created successfully');
      }
      return;
    }
    
    console.log('Invitations table exists and is accessible');
    console.log('Sample data:', tableInfo);
    
    // 2. Check admin user in Collectors table
    console.log('\n2. Checking admin user in Collectors table...');
    const { data: adminData, error: adminError } = await supabase
      .from('Collectors')
      .select('*')
      .eq('email', 'joel.cere@hypehack.sg')
      .single();
    
    if (adminError) {
      console.error('Error getting admin data:', adminError);
    } else {
      console.log('Admin data:', adminData);
    }
    
    // 3. Test token generation
    console.log('\n3. Testing token generation...');
    const testEmail = 'joelcere@gmail.com';
    const testToken = 'test-token-' + Date.now();
    
    const { data: insertData, error: insertError } = await supabase
      .from('Invitations')
      .insert({
        email: testEmail,
        token: testToken,
        created_at: new Date().toISOString()
      });
    
    if (insertError) {
      console.error('Error inserting test invitation:', insertError);
    } else {
      console.log('Test invitation inserted successfully:', insertData);
      
      // Clean up test data
      const { error: deleteError } = await supabase
        .from('Invitations')
        .delete()
        .eq('token', testToken);
      
      if (deleteError) {
        console.error('Error cleaning up test data:', deleteError);
      } else {
        console.log('Test data cleaned up successfully');
      }
    }
    
    // 4. Check RLS policies
    console.log('\n4. Checking RLS policies...');
    const { data: policies, error: policiesError } = await supabase
      .rpc('get_table_policies', { table_name: 'Invitations' });
    
    if (policiesError) {
      console.log('Could not check policies (this is normal):', policiesError.message);
    } else {
      console.log('RLS policies:', policies);
    }
    
  } catch (error) {
    console.error('Debug failed:', error);
  }
}

debugInvitations();



