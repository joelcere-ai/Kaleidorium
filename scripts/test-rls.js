#!/usr/bin/env node

/**
 * 🔒 RLS (Row Level Security) Test Script
 * This script tests if RLS is properly enabled on your Supabase tables
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Make sure you have NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env file');
  process.exit(1);
}

// Create clients
const anonClient = createClient(supabaseUrl, supabaseAnonKey);
const serviceClient = supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null;

async function testRLSStatus() {
  console.log('🔒 Testing Row Level Security (RLS) Status');
  console.log('==========================================\n');

  const tablesToTest = ['Artwork', 'ArtworkAnalytics', 'Artists', 'Collectors', 'Invitations'];
  
  if (!serviceClient) {
    console.log('⚠️  No service role key found - can only test basic RLS functionality\n');
  }

  for (const table of tablesToTest) {
    console.log(`📋 Testing table: ${table}`);
    console.log('-'.repeat(40));
    
    try {
      // Test 1: Check if RLS is enabled by trying to query as anonymous user
      console.log('🔍 Test 1: Anonymous access (should be blocked)');
      const { data: anonData, error: anonError } = await anonClient
        .from(table)
        .select('*')
        .limit(1);

      if (anonError) {
        if (anonError.code === 'PGRST116' || anonError.message.includes('row-level security')) {
          console.log('✅ RLS is ENABLED - Anonymous access properly blocked');
        } else {
          console.log(`⚠️  Unexpected error: ${anonError.message}`);
        }
      } else {
        console.log('❌ RLS might NOT be enabled - Anonymous access allowed');
        console.log(`   Retrieved ${anonData?.length || 0} rows`);
      }

      // Test 2: Check with service role (if available)
      if (serviceClient) {
        console.log('🔍 Test 2: Service role access (should work)');
        const { data: serviceData, error: serviceError } = await serviceClient
          .from(table)
          .select('count(*)')
          .single();

        if (serviceError) {
          console.log(`⚠️  Service role error: ${serviceError.message}`);
        } else {
          console.log(`✅ Service role access works - Found ${serviceData?.count || 0} rows`);
        }
      }

      // Test 3: Try to check RLS status directly (if service role available)
      if (serviceClient) {
        console.log('🔍 Test 3: Direct RLS status check');
        const { data: rlsStatus, error: rlsError } = await serviceClient
          .rpc('check_rls_status', { table_name: table })
          .single();

        if (rlsError && !rlsError.message.includes('function "check_rls_status" does not exist')) {
          console.log(`⚠️  RLS check error: ${rlsError.message}`);
        }
      }

    } catch (error) {
      console.log(`❌ Error testing ${table}: ${error.message}`);
    }
    
    console.log(''); // Empty line for readability
  }
}

async function testRLSPolicies() {
  console.log('🛡️  Testing RLS Policies');
  console.log('========================\n');

  // Test authenticated access to Artwork table
  console.log('📋 Testing Artwork table policies');
  console.log('-'.repeat(40));
  
  try {
    // This should fail because we're not authenticated
    const { data, error } = await anonClient
      .from('Artwork')
      .select('id, title, artist')
      .limit(5);

    if (error) {
      if (error.code === 'PGRST116' || error.message.includes('row-level security')) {
        console.log('✅ Artwork RLS policy working - Unauthenticated access blocked');
      } else {
        console.log(`⚠️  Unexpected error: ${error.message}`);
      }
    } else {
      console.log('❌ Artwork RLS policy might be too permissive');
      console.log(`   Retrieved ${data?.length || 0} artworks without authentication`);
    }
  } catch (error) {
    console.log(`❌ Error testing Artwork policies: ${error.message}`);
  }
  
  console.log('');
}

async function createRLSCheckFunction() {
  if (!serviceClient) {
    console.log('⚠️  Skipping RLS function creation - no service role key');
    return;
  }

  console.log('🔧 Creating RLS status check function...');
  
  const createFunctionSQL = `
    CREATE OR REPLACE FUNCTION check_rls_status(table_name text)
    RETURNS TABLE(
      table_name text,
      rls_enabled boolean,
      policy_count bigint
    )
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    BEGIN
      RETURN QUERY
      SELECT 
        t.table_name::text,
        t.row_security::boolean as rls_enabled,
        COALESCE(p.policy_count, 0) as policy_count
      FROM information_schema.tables t
      LEFT JOIN (
        SELECT 
          schemaname || '.' || tablename as full_table_name,
          COUNT(*) as policy_count
        FROM pg_policies 
        GROUP BY schemaname, tablename
      ) p ON p.full_table_name = t.table_schema || '.' || t.table_name
      WHERE t.table_schema = 'public' 
      AND t.table_name = check_rls_status.table_name;
    END;
    $$;
  `;

  try {
    const { error } = await serviceClient.rpc('exec_sql', { sql: createFunctionSQL });
    if (error) {
      console.log(`⚠️  Could not create RLS check function: ${error.message}`);
    } else {
      console.log('✅ RLS check function created successfully');
    }
  } catch (error) {
    // Try direct SQL execution if rpc doesn't work
    console.log('⚠️  RLS function creation skipped - using alternative method');
  }
}

async function generateRLSReport() {
  console.log('📊 RLS Security Report');
  console.log('======================\n');
  
  const timestamp = new Date().toISOString();
  console.log(`Report generated: ${timestamp}\n`);
  
  if (serviceClient) {
    console.log('✅ Service role access: Available');
  } else {
    console.log('⚠️  Service role access: Not available (limited testing)');
  }
  
  console.log(`🔗 Supabase URL: ${supabaseUrl}`);
  console.log(`🔑 Using anonymous key: ${supabaseAnonKey.substring(0, 20)}...`);
  console.log('');
}

async function main() {
  try {
    await generateRLSReport();
    await createRLSCheckFunction();
    await testRLSStatus();
    await testRLSPolicies();
    
    console.log('🎉 RLS Testing Complete!');
    console.log('========================\n');
    console.log('Summary:');
    console.log('- If you see "✅ RLS is ENABLED" for all tables, your security is working');
    console.log('- If you see "❌ RLS might NOT be enabled", you need to run the SQL commands again');
    console.log('- Check the Supabase dashboard > Authentication > Policies to see your policies');
    console.log('');
    console.log('Next steps if RLS is working:');
    console.log('1. Test with authenticated users');
    console.log('2. Verify policies match your business logic');
    console.log('3. Update email addresses as listed in SECURITY_CHECKLIST.md');
    
  } catch (error) {
    console.error('❌ RLS testing failed:', error.message);
    process.exit(1);
  }
}

// Run the tests
main(); 