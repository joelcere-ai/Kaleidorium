import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/lib/supabase-types';
import { registrationRateLimit } from '@/lib/rate-limit';
import { SecureErrors, secureLog } from '@/lib/secure-error-handler';
import { verifyInvitationOwnership } from '@/lib/auth-middleware';
import { validateEmail, validateName, validateUUID } from '@/lib/validation';

export async function POST(request: NextRequest) {
  // SECURITY: Apply strict rate limiting for registration validation
  const rateLimitResponse = registrationRateLimit(request);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const { 
      email, 
      inviteToken, 
      username, 
      artistData 
    } = await request.json();

    // SECURITY: Comprehensive input validation
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      return SecureErrors.validation('Invalid email address');
    }

    const tokenValidation = validateUUID(inviteToken);
    if (!tokenValidation.valid) {
      return SecureErrors.validation('Invalid invitation token format');
    }

    const usernameValidation = validateName(username, 'Username');
    if (!usernameValidation.valid) {
      return SecureErrors.validation(usernameValidation.error || 'Invalid username');
    }

    const supabase = createRouteHandlerClient<Database>({ cookies });

    secureLog('info', 'Artist registration validation started', {
      email: emailValidation.sanitized,
      username: usernameValidation.sanitized
    });

    // SECURITY: Comprehensive invitation validation to prevent self-invitation bypass
    const invitationValidation = await verifyInvitationOwnership(
      supabase,
      emailValidation.sanitized!,
      tokenValidation.sanitized!
    );

    if (!invitationValidation.valid) {
      return SecureErrors.authentication({
        reason: 'invalid_invitation',
        details: invitationValidation.error
      });
    }

    // SECURITY: Check for duplicate usernames across all user types
    const [artistUsernameCheck, collectorUsernameCheck] = await Promise.all([
      supabase
        .from('Artists')
        .select('username')
        .eq('username', usernameValidation.sanitized)
        .single(),
      supabase
        .from('Collectors')
        .select('username')
        .eq('username', usernameValidation.sanitized)
        .single()
    ]);

    if (artistUsernameCheck.data || collectorUsernameCheck.data) {
      return SecureErrors.validation('Username is already taken');
    }

    // SECURITY: Check for duplicate email addresses in auth system
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const emailExists = existingUsers?.users?.some(
      user => user.email?.toLowerCase() === emailValidation.sanitized!.toLowerCase()
    );

    if (emailExists) {
      return SecureErrors.validation('An account with this email already exists');
    }

    // SECURITY: Validate artist data completeness
    const requiredFields = ['firstname', 'surname', 'country', 'biog', 'website'];
    for (const field of requiredFields) {
      if (!artistData[field] || typeof artistData[field] !== 'string' || artistData[field].trim() === '') {
        return SecureErrors.validation(`${field} is required`);
      }
    }

    // SECURITY: Additional security checks
    const securityChecks = await Promise.all([
      // Check for suspicious registration patterns
      supabase
        .from('Artists')
        .select('created_at')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .limit(10),
      
      // Check invitation creation patterns
      supabase
        .from('Invitations')
        .select('created_at, email')
        .eq('email', emailValidation.sanitized)
        .order('created_at', { ascending: false })
        .limit(5)
    ]);

    const recentRegistrations = securityChecks[0].data?.length || 0;
    const invitationHistory = securityChecks[1].data || [];

    // SECURITY: Rate limiting on registration patterns
    if (recentRegistrations > 5) {
      secureLog('warn', 'Suspicious registration activity detected', {
        recentRegistrations,
        email: emailValidation.sanitized
      });
      return SecureErrors.validation('Registration temporarily unavailable. Please try again later.');
    }

    // SECURITY: Check for multiple invitations to same email (potential abuse)
    if (invitationHistory.length > 2) {
      secureLog('warn', 'Multiple invitations detected for same email', {
        email: emailValidation.sanitized,
        invitationCount: invitationHistory.length
      });
      return SecureErrors.validation('Multiple invitations detected. Please contact support.');
    }

    secureLog('info', 'Artist registration validation successful', {
      email: emailValidation.sanitized,
      username: usernameValidation.sanitized
    });

    // Return validation success with sanitized data
    return NextResponse.json({
      valid: true,
      sanitizedData: {
        email: emailValidation.sanitized,
        username: usernameValidation.sanitized,
        inviteToken: tokenValidation.sanitized
      },
      message: 'Registration data validated successfully'
    });

  } catch (error) {
    secureLog('error', 'Artist registration validation failed', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return SecureErrors.server({ operation: 'validate_artist_registration' });
  }
} 