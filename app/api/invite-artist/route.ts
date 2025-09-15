import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
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
    
    // Insert into invitations table
    try {
      const { data: insertData, error: insertError } = await supabase.from('Invitations').insert({
        email,
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
      return handleSupabaseError(err, 'invitation_insert');
    }
    
    // Return token for admin to copy
    return NextResponse.json({ success: true, token: inviteToken });
  } catch (error) {
    return SecureErrors.server({ operation: 'invite_artist' });
  }
} 