import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { validateUUID } from '@/lib/validation';
import { Database } from '@/lib/supabase-types';
import { authRateLimit } from '@/lib/rate-limit';
import { handleSupabaseError, SecureErrors, secureLog } from '@/lib/secure-error-handler';
import { createLogger } from '@/lib/secure-logger';

export async function POST(request: NextRequest) {
  const logger = createLogger();
  
  // SECURITY: Apply rate limiting for invitation verification
  const rateLimitResponse = authRateLimit(request);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }
  
  try {
    const { token, email } = await request.json();
    
    // SECURITY: Validate token format
    const tokenValidation = validateUUID(token);
    if (!tokenValidation.valid) {
      return SecureErrors.validation('Invalid token format');
    }

    // SECURITY: Validate email if provided
    if (!email || typeof email !== 'string') {
      return SecureErrors.validation('Email is required for invitation verification');
    }

    // Use service role key to bypass RLS issues
    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    // SECURITY: Direct invitation validation with service role
    try {
      const { data: invitation, error } = await adminSupabase
        .from('Invitations')
        .select('email, used, created_at')
        .eq('token', tokenValidation.sanitized!)
        .single();

      if (error || !invitation) {
        secureLog('warn', 'Invalid invitation token', { 
          email: email.trim().toLowerCase(), 
          hasError: !!error,
          errorDetails: error 
        });
        return SecureErrors.authentication({ 
          reason: 'invalid_invite_token',
          details: 'Invalid invitation token' 
        });
      }

      // SECURITY: Prevent invitation reuse
      if (invitation.used) {
        secureLog('warn', 'Attempted reuse of used invitation', { 
          email: email.trim().toLowerCase()
        });
        return SecureErrors.authentication({ 
          reason: 'invalid_invite_token',
          details: 'Invitation token has already been used' 
        });
      }

      // SECURITY: Verify email matches (prevent token hijacking)
      if (invitation.email.toLowerCase() !== email.trim().toLowerCase()) {
        secureLog('warn', 'Invitation email mismatch', { 
          userEmail: email.trim().toLowerCase(), 
          inviteEmail: invitation.email 
        });
        return SecureErrors.authentication({ 
          reason: 'invalid_invite_token',
          details: 'Invitation token does not match your email' 
        });
      }

      // SECURITY: Check expiration (36 hours)
      const inviteDate = new Date(invitation.created_at);
      const now = new Date();
      const hoursDiff = (now.getTime() - inviteDate.getTime()) / (1000 * 60 * 60);
      
      if (hoursDiff > 36) {
        secureLog('warn', 'Expired invitation token', { 
          email: email.trim().toLowerCase(), 
          hoursDiff 
        });
        return SecureErrors.authentication({ 
          reason: 'invalid_invite_token',
          details: 'Invitation token has expired' 
        });
      }

      // SECURITY: Check if user already exists as artist (prevent duplicate registration)
      const { data: existingArtist } = await adminSupabase
        .from('Artists')
        .select('id')
        .eq('email', email.trim().toLowerCase())
        .single();

      if (existingArtist) {
        secureLog('warn', 'Attempted duplicate artist registration', { 
          email: email.trim().toLowerCase() 
        });
        return SecureErrors.authentication({ 
          reason: 'invalid_invite_token',
          details: 'Artist account already exists for this email' 
        });
      }

    } catch (dbError) {
      secureLog('error', 'Database error during invitation verification', { 
        email: email.trim().toLowerCase(),
        error: dbError 
      });
      return SecureErrors.server({ operation: 'verify_invite_token' });
    }

    logger.info('Invitation verification successful', { 
      email: email.trim().toLowerCase() 
    });
    
    // Return success without exposing sensitive data
    return NextResponse.json({ 
      valid: true,
      email: email.trim().toLowerCase()
    });

  } catch (error) {
    return SecureErrors.server({ operation: 'verify_invite_token' });
  }
} 