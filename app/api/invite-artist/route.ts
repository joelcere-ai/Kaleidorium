import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { randomUUID } from 'crypto';
import { verifyAdmin } from '@/lib/auth-middleware';
import { Database } from '@/lib/supabase-types';
import { adminRateLimit } from '@/lib/rate-limit';
import { handleSupabaseError, SecureErrors, secureLog } from '@/lib/secure-error-handler';

export async function POST(req: NextRequest) {
  // SECURITY: Apply rate limiting for admin endpoints
  const rateLimitResponse = adminRateLimit(req);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    secureLog('info', 'Admin invite artist request started', { endpoint: '/api/invite-artist' });
    
    // Get the authorization header
    const authHeader = req.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return SecureErrors.authentication({ reason: 'missing_auth_header' });
    }

    const accessToken = authHeader.replace('Bearer ', '')
    
    // Create Supabase client with the access token
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Verify the token by getting the user
    const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken)
    
    if (userError || !user) {
      return SecureErrors.authentication({ reason: 'invalid_token' });
    }

    // SECURITY: Enhanced admin verification with database role check
    let isAdmin = false;
    let dbVerified = false;

    try {
      // First check database role (most authoritative)
      const { data: collectorData, error: collectorError } = await supabase
        .from('Collectors')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (!collectorError && collectorData?.role === 'admin') {
        isAdmin = true;
        dbVerified = true;
        secureLog('info', 'Admin verified via database', { userId: user.id, email: user.email });
      } else {
        // Fallback to email check for legacy admin
        isAdmin = user.email === 'joel.cere@hypehack.sg';
        dbVerified = false;
        secureLog('warn', 'Admin verified via email fallback', { 
          userId: user.id, 
          email: user.email,
          dbError: collectorError?.message 
        });
      }
    } catch (dbError) {
      // If database check fails, fall back to email verification
      isAdmin = user.email === 'joel.cere@hypehack.sg';
      dbVerified = false;
      secureLog('warn', 'Database check failed, using email fallback', { 
        userId: user.id, 
        email: user.email,
        error: dbError 
      });
    }

    if (!isAdmin) {
      secureLog('warn', 'Admin access denied - insufficient privileges', {
        userId: user.id,
        userEmail: user.email,
        dbVerified
      });
      return SecureErrors.authorization({ reason: 'not_admin', userEmail: user.email });
    }

    // SECURITY: Log admin access for audit trail
    secureLog('info', 'Admin access granted for invite generation', {
      userId: user.id,
      userEmail: user.email,
      dbVerified
    });

    const authResult = { user, isAdmin: true, isAuthenticated: true, dbVerified }

    const { email } = await req.json();
    if (!email) {
      return SecureErrors.validation('Email is required', { field: 'email' });
    }

    // Create admin client with service role key for database operations
    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Check if email is already registered as an artist
    try {
      const { data: existingArtist, error: artistCheckError } = await adminSupabase
        .from('Artists')
        .select('email')
        .eq('email', email.toLowerCase().trim())
        .single();

      if (!artistCheckError && existingArtist) {
        return NextResponse.json({ 
          success: false, 
          error: 'This email address is already registered as an artist. Artists can only be invited once.' 
        }, { status: 400 });
      }
    } catch (err) {
      // Continue if table doesn't exist or other non-critical error
      secureLog('warn', 'Could not check existing artists', { email, error: err });
    }

    // Check if email already has a pending invitation
    try {
      const { data: existingInvite, error: inviteCheckError } = await adminSupabase
        .from('Invitations')
        .select('email, used, created_at')
        .eq('email', email.toLowerCase().trim())
        .eq('used', false)
        .single();

      if (!inviteCheckError && existingInvite) {
        const inviteDate = new Date(existingInvite.created_at);
        const now = new Date();
        const hoursDiff = (now.getTime() - inviteDate.getTime()) / (1000 * 60 * 60);
        
        if (hoursDiff <= 36) { // Invitation still valid
          return NextResponse.json({ 
            success: false, 
            error: 'This email address already has a pending invitation. Please check your email or wait for the current invitation to expire.' 
          }, { status: 400 });
        }
      }
    } catch (err) {
      // Continue if check fails
      secureLog('warn', 'Could not check existing invitations', { email, error: err });
    }

    // Use the already initialized authenticated client
    
    // Generate a secure random token
    let inviteToken;
    try {
      inviteToken = randomUUID();
      secureLog('info', 'Admin generated invite token', { 
        adminEmail: user.email, 
        inviteEmail: email 
      });
    } catch (err) {
      return SecureErrors.server({ operation: 'token_generation' });
    }
    
    // Insert into invitations table using service role key to bypass RLS
    try {
      const { data: insertData, error: insertError } = await adminSupabase.from('Invitations').insert({
        email: email.toLowerCase().trim(),
        token: inviteToken,
        created_at: new Date().toISOString()
      });
      
      if (insertError) {
        secureLog('error', 'Invitation insert failed', { 
          error: insertError,
          email,
          adminEmail: user.email,
          dbVerified
        });
        
        // Handle specific database errors with user-friendly messages
        if (insertError.code === '23505') { // Unique constraint violation
          return NextResponse.json({ 
            success: false, 
            error: 'An invitation for this email address already exists. Please check existing invitations or wait for the current one to expire.' 
          }, { status: 400 });
        }
        
        return handleSupabaseError(insertError, 'invitation_insert');
      }
      
      secureLog('info', 'Invitation created successfully', { 
        inviteEmail: email,
        adminEmail: user.email,
        insertData
      });
    } catch (err) {
      secureLog('error', 'Invitation insert exception', { 
        error: err,
        email,
        adminEmail: user.email 
      });
      
      // Return a more specific error message
      return NextResponse.json({ 
        success: false, 
        error: 'Database error occurred while creating invitation. Please try again or contact support.' 
      }, { status: 500 });
    }
    
    // Return token for admin to copy
    return NextResponse.json({ success: true, token: inviteToken });
  } catch (error) {
    return SecureErrors.server({ operation: 'invite_artist' });
  }
} 