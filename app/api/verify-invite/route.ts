import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { validateUUID } from '@/lib/validation';
import { Database } from '@/lib/supabase-types';
import { authRateLimit } from '@/lib/rate-limit';
import { handleSupabaseError, SecureErrors, secureLog } from '@/lib/secure-error-handler';
import { createLogger } from '@/lib/secure-logger';
import { verifyInvitationOwnership } from '@/lib/auth-middleware';

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

    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // SECURITY: Use comprehensive invitation validation to prevent bypass
    const invitationValidation = await verifyInvitationOwnership(
      supabase,
      email.trim().toLowerCase(),
      tokenValidation.sanitized!
    );

    if (!invitationValidation.valid) {
      return SecureErrors.authentication({ 
        reason: 'invalid_invite_token',
        details: invitationValidation.error 
      });
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