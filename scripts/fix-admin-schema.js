const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixAdminSchema() {
  try {
    console.log('Fixing admin schema...');
    
    const adminEmail = 'joel.cere@hypehack.sg';
    
    // Get the admin user
    const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError || !existingUsers?.users) {
      console.error('Error getting users:', listError);
      return;
    }
    
    const adminUser = existingUsers.users.find(user => user.email === adminEmail);
    if (!adminUser) {
      console.error('Admin user not found');
      return;
    }
    
    console.log('Found admin user:', adminUser.id);
    
    // Check current Collectors table entry
    const { data: currentCollector, error: selectError } = await supabase
      .from('Collectors')
      .select('*')
      .eq('id', adminUser.id)
      .single();
    
    if (selectError) {
      console.error('Error getting collector data:', selectError);
      return;
    }
    
    console.log('Current collector data:', currentCollector);
    
    // Update the Collectors table to use user_id instead of id
    const { data: updateData, error: updateError } = await supabase
      .from('Collectors')
      .update({
        user_id: adminUser.id,
        email: adminEmail,
        role: 'admin',
        created_at: new Date().toISOString()
      })
      .eq('id', adminUser.id);
    
    if (updateError) {
      console.error('Error updating collector:', updateError);
      return;
    }
    
    console.log('Updated collector with user_id:', adminUser.id);
    
    // Verify the update
    const { data: verifyData, error: verifyError } = await supabase
      .from('Collectors')
      .select('*')
      .eq('user_id', adminUser.id)
      .single();
    
    if (verifyError) {
      console.error('Error verifying update:', verifyError);
      return;
    }
    
    console.log('Verification successful:', verifyData);
    
  } catch (error) {
    console.error('Fix failed:', error);
  }
}

fixAdminSchema();
