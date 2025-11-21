import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { Database } from './supabase-types'
import { SecureErrors, secureLog } from './secure-error-handler'

export interface AuthContext {
  user: any
  isAdmin: boolean
  isAuthenticated: boolean
  userRole?: 'admin' | 'artist' | 'gallery' | 'collector'
  dbVerified: boolean
}

/**
 * SECURITY: Enhanced role verification with database backing
 */
async function verifyUserRole(supabase: any, userId: string, userEmail: string): Promise<{
  role: 'admin' | 'artist' | 'gallery' | 'collector' | null,
  dbVerified: boolean
}> {
  try {
    // Check Collectors table for user role (most authoritative)
    const { data: collectorData, error: collectorError } = await supabase
      .from('Collectors')
      .select('role')
      .eq('user_id', userId)
      .single();

    if (!collectorError && collectorData?.role) {
          secureLog('info', 'Role verified from Collectors table', { 
      userId, 
      role: collectorData.role 
    });
    return { role: collectorData.role as 'admin' | 'artist' | 'gallery' | 'collector', dbVerified: true };
    }

    // Fallback: Check Artists table for artist or gallery status
    const { data: artistData, error: artistError } = await supabase
      .from('Artists')
      .select('id, is_gallery')
      .eq('id', userId)
      .single();

    if (!artistError && artistData) {
      if (artistData.is_gallery) {
        secureLog('info', 'Gallery role verified from Artists table', { userId });
        return { role: 'gallery', dbVerified: true };
      } else {
        secureLog('info', 'Artist role verified from Artists table', { userId });
        return { role: 'artist', dbVerified: true };
      }
    }

    // Final fallback: Admin email check (legacy support)
    if (userEmail === 'joel.cere@hypehack.sg') {
      secureLog('warn', 'Admin role verified by email fallback', { userEmail });
      return { role: 'admin', dbVerified: false };
    }

    secureLog('warn', 'No role found for user', { userId, userEmail });
    return { role: null, dbVerified: false };

  } catch (error: any) {
    secureLog('error', 'Role verification failed', { userId, error: error?.message || 'Unknown error' });
    return { role: null, dbVerified: false };
  }
}

/**
 * SECURITY: Enhanced authentication with comprehensive role validation
 */
export async function verifyAuth(request: NextRequest): Promise<AuthContext | NextResponse> {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies })
    
    // Get the current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session?.user) {
      secureLog('warn', 'Authentication failed', { 
        hasSession: !!session, 
        error: sessionError?.message 
      });
      return SecureErrors.authentication({ reason: 'no_session' });
    }

    const user = session.user;
    
    // SECURITY: Comprehensive role verification with database backing
    const roleVerification = await verifyUserRole(supabase, user.id, user.email || '');
    
    const isAdmin = roleVerification.role === 'admin';
    
    return {
      user,
      isAdmin,
      isAuthenticated: true,
      userRole: roleVerification.role || 'collector',
      dbVerified: roleVerification.dbVerified
    };
    
  } catch (error: any) {
    secureLog('error', 'Auth verification error', { error: error?.message || 'Unknown error' });
    return SecureErrors.server({ operation: 'auth_verification' });
  }
}

/**
 * SECURITY: Strict admin verification with database role backing
 */
export async function verifyAdmin(request: NextRequest): Promise<AuthContext | NextResponse> {
  const authResult = await verifyAuth(request)
  
  // If auth verification failed, return the error response
  if (authResult instanceof NextResponse) {
    return authResult
  }
  
  if (!authResult.isAdmin) {
    secureLog('warn', 'Admin access denied', { 
      userId: authResult.user.id,
      userRole: authResult.userRole,
      userEmail: authResult.user.email
    });
    return SecureErrors.authorization({ reason: 'not_admin' });
  }

  // SECURITY: Log admin access for audit trail
  secureLog('info', 'Admin access granted', {
    userId: authResult.user.id,
    userEmail: authResult.user.email,
    dbVerified: authResult.dbVerified
  });
  
  return authResult
}

/**
 * SECURITY: Verify user is a registered artist with database validation
 */
export async function verifyArtist(request: NextRequest): Promise<AuthContext | NextResponse> {
  const authResult = await verifyAuth(request)
  
  if (authResult instanceof NextResponse) {
    return authResult
  }
  
  // Admin can access artist functions
  if (authResult.isAdmin) {
    return authResult;
  }
  
  if (authResult.userRole !== 'artist') {
    secureLog('warn', 'Artist access denied', { 
      userId: authResult.user.id,
      userRole: authResult.userRole,
      userEmail: authResult.user.email
    });
    return SecureErrors.authorization({ reason: 'not_artist' });
  }
  
  return authResult;
}

/**
 * SECURITY: Enhanced resource ownership verification
 */
export async function verifyResourceOwnership(
  request: NextRequest, 
  resourceUserId: string
): Promise<AuthContext | NextResponse> {
  const authResult = await verifyAuth(request)
  
  if (authResult instanceof NextResponse) {
    return authResult
  }
  
  // Admin can access any resource, or user must own the resource
  if (!authResult.isAdmin && authResult.user.id !== resourceUserId) {
    secureLog('warn', 'Resource access denied', {
      userId: authResult.user.id,
      resourceUserId,
      userRole: authResult.userRole
    });
    return SecureErrors.authorization({ reason: 'not_resource_owner' });
  }
  
  return authResult
}

/**
 * SECURITY: Verify invitation token ownership and prevent self-invitation bypass
 */
export async function verifyInvitationOwnership(
  supabase: any,
  userEmail: string,
  inviteToken: string
): Promise<{ valid: boolean, error?: string }> {
  try {
    // SECURITY: Verify the invitation exists and matches the user's email
    const { data: invitation, error } = await supabase
      .from('Invitations')
      .select('email, used, created_at')
      .eq('token', inviteToken)
      .single();

    if (error || !invitation) {
      secureLog('warn', 'Invalid invitation token', { userEmail, hasError: !!error });
      return { valid: false, error: 'Invalid invitation token' };
    }

    // SECURITY: Prevent invitation reuse
    if (invitation.used) {
      secureLog('warn', 'Attempted reuse of used invitation', { userEmail, inviteToken });
      return { valid: false, error: 'Invitation token has already been used' };
    }

    // SECURITY: Verify email matches (prevent token hijacking)
    if (invitation.email.toLowerCase() !== userEmail.toLowerCase()) {
      secureLog('warn', 'Invitation email mismatch', { 
        userEmail, 
        inviteEmail: invitation.email 
      });
      return { valid: false, error: 'Invitation token does not match your email' };
    }

    // SECURITY: Check expiration (36 hours)
    const inviteDate = new Date(invitation.created_at);
    const now = new Date();
    const hoursDiff = (now.getTime() - inviteDate.getTime()) / (1000 * 60 * 60);
    
    if (hoursDiff > 36) {
      secureLog('warn', 'Expired invitation token', { userEmail, hoursDiff });
      return { valid: false, error: 'Invitation token has expired' };
    }

    // SECURITY: Check if user already exists as artist (prevent duplicate registration)
    const { data: existingArtist } = await supabase
      .from('Artists')
      .select('id')
      .eq('email', userEmail)
      .single();

    if (existingArtist) {
      secureLog('warn', 'Attempted duplicate artist registration', { userEmail });
      return { valid: false, error: 'An artist account with this email already exists' };
    }

    secureLog('info', 'Invitation validation successful', { userEmail });
    return { valid: true };

  } catch (error: any) {
    secureLog('error', 'Invitation validation error', { userEmail, error: error?.message || 'Unknown error' });
    return { valid: false, error: 'Failed to validate invitation' };
  }
} 