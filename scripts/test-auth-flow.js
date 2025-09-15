const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testAuthFlow() {
  try {
    console.log('Testing authentication flow...');
    
    const adminEmail = 'joel.cere@hypehack.sg';
    const adminPassword = 'Kaleidorium123$';
    
    // 1. Test admin login
    console.log('\n1. Testing admin login...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: adminEmail,
      password: adminPassword
    });
    
    if (authError) {
      console.error('Login failed:', authError);
      return;
    }
    
    console.log('Login successful:', {
      userId: authData.user.id,
      email: authData.user.email,
      accessToken: authData.session?.access_token ? 'Present' : 'Missing'
    });
    
    // 2. Test user verification with access token
    console.log('\n2. Testing user verification...');
    const { data: { user }, error: userError } = await supabase.auth.getUser(authData.session.access_token);
    
    if (userError) {
      console.error('User verification failed:', userError);
      return;
    }
    
    console.log('User verification successful:', {
      userId: user.id,
      email: user.email
    });
    
    // 3. Test admin role check
    console.log('\n3. Testing admin role check...');
    const { data: collectorData, error: collectorError } = await supabase
      .from('Collectors')
      .select('role')
      .eq('user_id', user.id)
      .single();
    
    if (collectorError) {
      console.error('Role check failed:', collectorError);
      return;
    }
    
    console.log('Role check result:', collectorData);
    
    // 4. Test invitation creation
    console.log('\n4. Testing invitation creation...');
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
      console.error('Invitation creation failed:', insertError);
    } else {
      console.log('Invitation creation successful');
      
      // Clean up
      await supabase
        .from('Invitations')
        .delete()
        .eq('token', testToken);
    }
    
    // 5. Test the exact API call
    console.log('\n5. Testing API call simulation...');
    const response = await fetch('https://v0-kaleidorium-uf.vercel.app/api/invite-artist', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authData.session.access_token}`
      },
      body: JSON.stringify({
        email: testEmail
      })
    });
    
    console.log('API Response status:', response.status);
    const responseText = await response.text();
    console.log('API Response body:', responseText);
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testAuthFlow();
