const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupAdmin() {
  try {
    console.log('Setting up admin user...');
    
    const adminEmail = 'joel.cere@hypehack.sg';
    const adminPassword = 'Kaleidorium123$';
    
    // First, try to get existing user
    const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();
    
    let userId = null;
    if (!listError && existingUsers?.users) {
      const existingUser = existingUsers.users.find(user => user.email === adminEmail);
      if (existingUser) {
        userId = existingUser.id;
        console.log('Found existing user:', userId);
        
        // Update password for existing user
        const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
          password: adminPassword,
          user_metadata: {
            role: 'admin'
          }
        });
        
        if (updateError) {
          console.error('Error updating existing user:', updateError);
          return;
        }
        
        console.log('Updated existing user password and role');
      }
    }
    
    // If no existing user, create new one
    if (!userId) {
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true,
        user_metadata: {
          role: 'admin'
        }
      });
      
      if (authError) {
        console.error('Error creating admin user:', authError);
        return;
      }
      
      userId = authData.user.id;
      console.log('Admin user created successfully:', userId);
    }
    
    // Add admin role to Collectors table
    const { data: collectorData, error: collectorError } = await supabase
      .from('Collectors')
      .upsert({
        id: userId,
        email: adminEmail,
        role: 'admin',
        created_at: new Date().toISOString()
      });
    
    if (collectorError) {
      console.error('Error adding admin to Collectors table:', collectorError);
      return;
    }
    
    console.log('Admin role added to Collectors table successfully');
    console.log('Admin credentials:');
    console.log('Email:', adminEmail);
    console.log('Password:', adminPassword);
    
  } catch (error) {
    console.error('Setup failed:', error);
  }
}

setupAdmin();
